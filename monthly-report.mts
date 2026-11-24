type Query = (sql: string, variables: Record<string, string>) => string;

export function monthlyReport(query: Query, month: string, zone: string) {
  const result = query(`
    SELECT json_build_object(
      'count', count(*),
      'totalCents', coalesce(sum(amount_cents), 0)
    )
    FROM invoices
    WHERE status = 'issued'
      AND to_char(issued_at AT TIME ZONE :'zone', 'YYYY-MM') = :'month';
  `, { month, zone });
  return JSON.parse(result) as { count: number; totalCents: number };
}
