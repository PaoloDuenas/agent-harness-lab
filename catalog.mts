export type RunSql = (sql: string, variables?: Record<string, string>) => string;

export function initializeCatalog(run: RunSql): void {
  run(`
    CREATE TABLE IF NOT EXISTS catalog (
      entry_number bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      item_id text NOT NULL
    );
    -- One entry per identifier across imports. A separate index (rather than an
    -- inline UNIQUE) also upgrades catalogs created before this constraint existed.
    CREATE UNIQUE INDEX IF NOT EXISTS catalog_item_id_key ON catalog (item_id);
  `);
}

export function importCatalog(run: RunSql, itemIds: readonly string[]): void {
  run(`
    INSERT INTO catalog (item_id)
    SELECT DISTINCT item_id
    FROM jsonb_array_elements_text(:'items'::jsonb) AS incoming(item_id)
    ON CONFLICT (item_id) DO NOTHING;
  `, { items: JSON.stringify(itemIds) });
}
