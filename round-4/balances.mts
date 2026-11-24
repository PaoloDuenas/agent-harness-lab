type Query = (sql: string, variables: Record<string, string>) => string;

export function balancesAt(query: Query, cutoff: string) {
  const result = query(`
    WITH payment_totals AS (
      SELECT p.customer, p.currency, sum(p.cents) AS paid
      FROM payments p
      WHERE p.received_at <= :'cutoff'::timestamptz
        AND NOT EXISTS (
          SELECT 1
          FROM reversals r
          WHERE r.payment_id = p.id AND r.reversed_at <= :'cutoff'::timestamptz
        )
      GROUP BY p.customer, p.currency
    ), invoice_totals AS (
      SELECT id, customer, currency, cents,
        sum(cents) OVER (
          PARTITION BY customer, currency
          ORDER BY due_on, id COLLATE "C"
          ROWS UNBOUNDED PRECEDING
        ) AS billed_through_invoice
      FROM invoices
      WHERE issued_at <= :'cutoff'::timestamptz
    )
    -- Cap the unpaid prefix at this invoice's amount to exclude prior balances.
    SELECT coalesce(json_agg(json_build_object(
      'invoice', i.id,
      'openCents', least(i.cents, greatest(0, i.billed_through_invoice - coalesce(t.paid, 0)))::text
    ) ORDER BY i.id COLLATE "C"), '[]')
    FROM invoice_totals i
    LEFT JOIN payment_totals t ON t.customer = i.customer AND t.currency = i.currency;
  `, { cutoff });
  return JSON.parse(result) as { invoice: string; openCents: string }[];
}
