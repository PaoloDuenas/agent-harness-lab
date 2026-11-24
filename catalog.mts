export type RunSql = (sql: string, variables?: Record<string, string>) => string;

export function initializeCatalog(run: RunSql): void {
  run(`
    CREATE TABLE IF NOT EXISTS catalog (
      entry_number bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      item_id text NOT NULL
    );
  `);
}

export function importCatalog(run: RunSql, itemIds: readonly string[]): void {
  run(`
    INSERT INTO catalog (item_id)
    SELECT DISTINCT item_id
    FROM jsonb_array_elements_text(:'items'::jsonb) AS incoming(item_id);
  `, { items: JSON.stringify(itemIds) });
}
