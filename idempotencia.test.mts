import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import test from 'node:test';
import { importCatalog, initializeCatalog, type RunSql } from './catalog.mts';

test('el catálogo conserva una entrada por identificador al importar lotes', async () => {
  const container = execFileSync('docker', [
    'run', '--detach', '--rm', '--network', 'none',
    '--env', 'POSTGRES_PASSWORD=fixture-only', 'postgres:16-alpine',
  ], { encoding: 'utf8' }).trim();

  try {
    // TCP starts only after the image has finished initializing its database.
    const connection = ['-h', '127.0.0.1', '-U', 'postgres', '-d', 'postgres'];
    const deadline = Date.now() + 60_000;
    while (spawnSync('docker', ['exec', container, 'pg_isready', ...connection]).status !== 0) {
      if (Date.now() >= deadline) throw new Error('PostgreSQL no estuvo listo en 60 segundos');
      await delay(250);
    }

    const run: RunSql = (sql, variables = {}) => execFileSync('docker', [
      'exec', '-i', '-e', 'PGPASSWORD=fixture-only', container,
      'psql', ...connection, '-XqAt', '-v', 'ON_ERROR_STOP=1',
      ...Object.entries(variables).flatMap(([name, value]) => ['-v', name + '=' + value]),
    ], { encoding: 'utf8', input: sql }).trim();

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
  } finally {
    execFileSync('docker', ['rm', '--force', container]);
  }
});
