# Ronda 4 · Conciliación histórica de cartera

Una aplicación debe reconstruir el saldo de cada factura a un instante de corte.
La entrada contiene fechas con zona horaria e importes positivos en centavos
enteros. Todas las operaciones de este laboratorio son ficticias.

- Incluye facturas emitidas y pagos recibidos hasta el instante de corte, inclusive.
- Cada pago pertenece a un cliente y una moneda. Su crédito puede cubrir varias
  facturas de ese mismo cliente y moneda, por orden de vencimiento y después
  por identificador ascendente (orden C). Los anticipos quedan disponibles para
  las facturas visibles al corte. El saldo mínimo de una factura es cero.
- Una reversión anula el pago completo desde el instante de la reversión,
  inclusive. El reporte histórico anterior debe seguir siendo reproducible.
- Devuelve todas las facturas visibles, incluidas las liquidadas, ordenadas por
  identificador (orden C). Expresa cada saldo como cadena decimal exacta,
  incluso cuando la suma de pagos supera el rango de un bigint de PostgreSQL.
- El reporte es de solo lectura. Debe funcionar con cualquier conjunto válido
  de registros bajo el esquema de la prueba, independientemente del orden de carga.

Con Node.js 24 y Docker ejecuta desde la raíz:

```sh
node --test round-4/balances.test.mts
```

## Evaluación acordada antes de las entregas

Publicaremos el número de casos aprobados y el tiempo individual desde el envío
del prompt hasta la respuesta final. Para revisar el parche indicaremos si
preserva la interfaz y los datos, cómo mantiene la exactitud y cuántas consultas
ejecuta al aumentar la cantidad de facturas. Una diferencia de rendimiento
requiere una medición. No otorgaremos puntos por usar una técnica específica.
