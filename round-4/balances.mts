type Query = (sql: string, variables: Record<string, string>) => string;

// Una sola consulta de solo lectura, sin importar cuántas facturas haya.
// El crédito de cada cliente y moneda se reparte en cascada: cada factura
// consume lo que dejaron las anteriores (vencimiento, luego id en orden C).
// Toda la aritmética usa numeric para no desbordar bigint.
export function balancesAt(query: Query, cutoff: string) {
  const result = query(`
    WITH params AS (SELECT :'cutoff'::timestamptz AS cutoff),
    credits AS (
      SELECT p.customer, p.currency, sum(p.cents::numeric) AS credit
      FROM payments p, params
      WHERE p.received_at <= params.cutoff
        AND NOT EXISTS (
          SELECT 1 FROM reversals r
          WHERE r.payment_id = p.id AND r.reversed_at <= params.cutoff
        )
      GROUP BY p.customer, p.currency
    ),
    visible AS (
      SELECT i.id, i.customer, i.currency, i.cents::numeric AS cents,
        sum(i.cents::numeric) OVER (
          PARTITION BY i.customer, i.currency
          ORDER BY i.due_on, i.id COLLATE "C"
          ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS through_here
      FROM invoices i, params
      WHERE i.issued_at <= params.cutoff
    )
    SELECT coalesce(json_agg(json_build_object(
      'invoice', v.id,
      'openCents', greatest(0, least(v.cents, v.through_here - coalesce(c.credit, 0)))::text
    ) ORDER BY v.id COLLATE "C"), '[]')
    FROM visible v
    LEFT JOIN credits c ON c.customer = v.customer AND c.currency = v.currency;
  `, { cutoff });
  return JSON.parse(result) as { invoice: string; openCents: string }[];
}
