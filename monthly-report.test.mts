import assert from 'node:assert/strict';
import test from 'node:test';
import { monthlyReport } from './monthly-report.mts';
import { withPostgres } from './postgres-test.mts';

const checks = [
  { name: 'cierre del año', month: '2023-12', zone: 'America/Mexico_City', count: 1, totalCents: 101 },
  { name: 'mes siguiente', month: '2024-01', zone: 'America/Mexico_City', count: 1, totalCents: 202 },
  { name: 'febrero bisiesto', month: '2024-02', zone: 'America/Mexico_City', count: 1, totalCents: 303 },
  { name: 'mes con cambio de hora', month: '2024-03', zone: 'America/New_York', count: 2, totalCents: 909 },
  { name: 'mismo mes en otra zona', month: '2024-03', zone: 'Asia/Tokyo', count: 2, totalCents: 707 },
  { name: 'control UTC', month: '2024-03', zone: 'UTC', count: 1, totalCents: 404 },
  { name: 'mes vacío', month: '2024-06', zone: 'America/Mexico_City', count: 0, totalCents: 0 },
];

test('reporte mensual de facturas', async t => {
  await withPostgres(async run => {
    run(`
      CREATE TABLE invoices (issued_at timestamptz NOT NULL, status text NOT NULL, amount_cents integer NOT NULL);
      INSERT INTO invoices VALUES
        ('2024-01-01 05:59:59.999999+00', 'issued', 101),
        ('2024-01-01 06:00:00+00', 'issued', 202),
        ('2024-02-29 23:30:00+00', 'issued', 303),
        ('2024-03-15 12:00:00+00', 'issued', 404),
        ('2024-03-16 12:00:00+00', 'cancelled', 999),
        ('2024-04-01 03:59:59.999999+00', 'issued', 505),
        ('2024-04-01 04:00:00+00', 'issued', 606);
    `);
    for (const { name, month, zone, count, totalCents } of checks) {
      await t.test(name, () => {
        assert.deepEqual(monthlyReport(run, month, zone), { count, totalCents });
      });
    }
  });
});
