# Agent Harness Lab

## Ronda 2 · Importación de un catálogo en PostgreSQL

Dos agentes partieron del commit `f6061bd` en worktrees limpios. El importador
en TypeScript recibe lotes de identificadores ficticios. El catálogo debe conservar
una entrada por identificador entre importaciones, incluso al repetir un lote.
Un lote vacío debe conservar el contenido.

### Prompt compartido

> Ejecuta la prueba del repositorio. Investiga el fallo y corrige la aplicación respetando el comportamiento documentado. Conserva las comprobaciones existentes y verifica el resultado. Al terminar, resume la causa, el cambio y el resultado de la prueba.

### Resultados

| Herramienta y configuración | Rama | Commit del parche | Catálogo nuevo (original) | Duplicados previos (posterior) |
|---|---|---|---|---|
| Claude Code · Claude Opus 5.5 High | `codex/benchmark-claude` | `b8aa949` | Pasa | Falla al crear el índice único |
| Codex · GPT-6.2 Sol High | `codex/benchmark-codex` | `8871936` | Pasa | Pasa |

La prueba original comienza con un catálogo vacío. Ambos parches impiden que
un identificador aparezca dos veces al recibir lotes sucesivos. El operador
observó que Claude terminó primero. El experimento no midió los tiempos exactos ni el costo.

**La segunda prueba se diseñó y ejecutó después de recibir ambos parches.**
Carga las filas `1:A, 2:B, 3:A` con el esquema anterior, inicializa el catálogo
y comprueba que conserve `1:A, 2:B`. Luego importa el lote `[A, C]` dos veces
y espera un catálogo con `A, B, C`.

Con el parche de Claude, PostgreSQL rechaza el índice único porque A ya está
repetido y la inicialización se detiene. Con el de Codex, la inicialización
conserva la primera fila de cada identificador y elimina las repetidas antes de
crear el índice. Esto exige bloquear el catálogo y buscar duplicados en cada
inicialización. La elección de conservar la primera fila forma parte de esta
evaluación posterior.

### Reproducir la comparación

Con Node.js 24 y Docker para contenedores Linux, abre la rama de cada agente en
su propio checkout y ejecuta el mismo comando desde la raíz:

```sh
node --test idempotencia.test.mts
```

La punta de cada rama incluye ambas pruebas. Los commits de parche indicados en
la tabla conservan la entrega original del agente con la primera prueba. Cada
caso crea y elimina su propio contenedor PostgreSQL 16. Docker puede descargar
la imagen `postgres:16-alpine` en la primera ejecución.

En la rama de Claude se espera una prueba aprobada y una fallida (código 1).
En la de Codex se esperan dos aprobadas (código 0). La rama
`codex/second-experiment` contiene el importador base y las dos pruebas para
consultar el experimento sin aplicar ninguna solución.
