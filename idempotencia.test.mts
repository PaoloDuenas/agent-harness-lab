import assert from 'node:assert/strict';
import test from 'node:test';
import { withPostgres } from './postgres-test.mts';
import { importCatalog, initializeCatalog } from './catalog.mts';

test('el catálogo conserva una entrada por identificador al importar lotes', async () => withPostgres(run => {
  initializeCatalog(run);
  const first = ['demo-A', 'demo-B', 'demo-A'];
  const second = ['demo-B', 'demo-C'];
  const entries = () => run('SELECT item_id FROM catalog ORDER BY item_id;').split('\n');

  importCatalog(run, first);
  assert.deepEqual(entries(), ['demo-A', 'demo-B']);
  importCatalog(run, second);
  assert.deepEqual(entries(), ['demo-A', 'demo-B', 'demo-C']);
  importCatalog(run, first);
  importCatalog(run, []);
  assert.deepEqual(entries(), ['demo-A', 'demo-B', 'demo-C']);
}));

test('un catálogo con duplicados previos admite nuevas importaciones', async () => withPostgres(run => {
  run(`
    CREATE TABLE catalog (
      entry_number bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      item_id text NOT NULL
    );
    INSERT INTO catalog (item_id) VALUES ('A'), ('B'), ('A');
  `);
  const rows = () => run('SELECT entry_number, item_id FROM catalog ORDER BY entry_number;');
  assert.equal(rows(), '1|A\n2|B\n3|A');
  initializeCatalog(run);
  assert.equal(rows(), '1|A\n2|B');
  importCatalog(run, ['A', 'C']);
  importCatalog(run, ['A', 'C']);
  assert.equal(run('SELECT item_id FROM catalog ORDER BY item_id;'), 'A\nB\nC');
}));
