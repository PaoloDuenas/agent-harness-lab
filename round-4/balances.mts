type Query = (sql: string, variables: Record<string, string>) => string;

export function balancesAt(query: Query, cutoff: string) {
  const result = query(`
    WITH totals AS (
      SELECT customer, sum(cents) AS paid
      FROM payments WHERE received_at <= :'cutoff'::timestamptz GROUP BY customer
    )
    SELECT coalesce(json_agg(json_build_object(
      'invoice', i.id, 'openCents', greatest(0, i.cents - coalesce(t.paid, 0))::text
    ) ORDER BY i.id COLLATE "C"), '[]')
    FROM invoices i LEFT JOIN totals t ON t.customer = i.customer
    WHERE i.issued_at <= :'cutoff'::timestamptz;
  `, { cutoff });
  return JSON.parse(result) as { invoice: string; openCents: string }[];
}
