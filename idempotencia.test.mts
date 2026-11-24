import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import test from 'node:test';

test('cada evento debe tener un solo procesamiento completado', async () => {
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

    const counts = execFileSync('docker', [
      'exec', '-i', '-e', 'PGPASSWORD=fixture-only', container,
      'psql', ...connection, '-XqAt', '-v', 'ON_ERROR_STOP=1',
    ], {
      encoding: 'utf8',
      input: `
        CREATE TEMP TABLE completed_processing (
          processing_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          event_id text NOT NULL
        );
        INSERT INTO completed_processing (event_id)
        VALUES ('evt_demo_001'), ('evt_demo_001'), ('evt_demo_002');

        SELECT json_object_agg(event_id, completed_count)
        FROM (
          SELECT event_id, count(*) AS completed_count
          FROM completed_processing GROUP BY event_id
        ) AS totals;
      `,
    });
    const completed: Record<string, number> = JSON.parse(counts);
    assert.equal(completed.evt_demo_002, 1, 'evento de control evt_demo_002');
    assert.equal(completed.evt_demo_001, 1,
      `evt_demo_001: esperado 1 procesamiento, obtenido ${completed.evt_demo_001}`);
  } finally {
    execFileSync('docker', ['rm', '--force', container]);
  }
});
