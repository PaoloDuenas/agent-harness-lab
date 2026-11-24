import assert from 'node:assert/strict';
import test from 'node:test';
import { withPostgres } from '../postgres-test.mts';
import { balancesAt } from './balances.mts';

test('conciliación de cartera', async t => withPostgres(async run => {
  run(`
    CREATE TABLE invoices (id text PRIMARY KEY, customer text NOT NULL, currency text NOT NULL,
      issued_at timestamptz NOT NULL, due_on date NOT NULL, cents bigint NOT NULL CHECK (cents > 0));
    CREATE TABLE payments (id text PRIMARY KEY, customer text NOT NULL, currency text NOT NULL,
      received_at timestamptz NOT NULL, cents bigint NOT NULL CHECK (cents > 0));
    CREATE TABLE reversals (payment_id text PRIMARY KEY REFERENCES payments, reversed_at timestamptz NOT NULL);
    INSERT INTO invoices VALUES
      ('C','uno','MXN','2025-01-03Z','2025-02-01',70),
      ('A','uno','MXN','2025-01-03Z','2025-02-15',90),
      ('B','uno','MXN','2025-01-03Z','2025-02-01',60),
      ('D','uno','USD','2025-01-04Z','2025-02-01',40),
      ('E','dos','MXN','2025-01-04Z','2025-02-01',50),
      ('F','tres','MXN','2025-01-07Z','2025-02-01',9223372036854775807);
    INSERT INTO payments VALUES
      ('p','uno','MXN','2025-01-02Z',100), ('q','uno','MXN','2025-01-05Z',85),
      ('r','tres','MXN','2025-01-07Z',1), ('s','tres','MXN','2025-01-08Z',9223372036854775807);
    INSERT INTO reversals VALUES ('p','2025-01-06Z');
  `);
  const cases: [string, string, string[]][] = [
    ['anticipo sin facturas', '2025-01-02Z', []],
    ['vencimientos y desempate', '2025-01-03Z', ['90','0','30']],
    ['clientes y monedas independientes', '2025-01-04Z', ['90','0','30','40','50']],
    ['pago parcial posterior', '2025-01-05Z', ['35','0','0','40','50']],
    ['instante anterior a la reversión', '2025-01-05T23:59:59.999999Z', ['35','0','0','40','50']],
    ['reversión efectiva al corte', '2025-01-06T01:00:00+01:00', ['90','0','45','40','50']],
    ['importe superior a la precisión de Number', '2025-01-07Z', ['90','0','45','40','50','9223372036854775806']],
    ['crédito acumulado superior a bigint', '2025-01-08Z', ['90','0','45','40','50','0']],
    ['reconsulta histórica', '2025-01-03Z', ['90','0','30']],
  ];
  for (const [name, cutoff, amounts] of cases) {
    await t.test(name, () => {
      assert.deepEqual(balancesAt(run, cutoff), amounts.map((openCents, i) => ({
        invoice: 'ABCDEF'[i], openCents,
      })));
    });
  }
}));
