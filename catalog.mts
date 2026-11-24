export type RunSql = (sql: string, variables?: Record<string, string>) => string;

export function initializeCatalog(run: RunSql): void {
  run(`
    BEGIN;

    CREATE TABLE IF NOT EXISTS catalog (
      entry_number bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      item_id text NOT NULL
    );

    LOCK TABLE catalog IN SHARE ROW EXCLUSIVE MODE;

    DELETE FROM catalog AS entry
    USING (
      SELECT item_id, MIN(entry_number) AS first_entry_number
      FROM catalog
      GROUP BY item_id
      HAVING COUNT(*) > 1
    ) AS duplicates
    WHERE entry.item_id = duplicates.item_id
      AND entry.entry_number <> duplicates.first_entry_number;

    CREATE UNIQUE INDEX IF NOT EXISTS catalog_item_id_unique ON catalog (item_id);

    COMMIT;
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
