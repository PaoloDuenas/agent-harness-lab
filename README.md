# agent-harness-lab

Laboratorio para comparar Claude Code y Codex desde el mismo commit.

## Primer hito

Con Node.js 24 y Docker con contenedores Linux en ejecución, corre desde la raíz:

```sh
node --test idempotencia.test.mts
```

La primera ejecución descarga la imagen `postgres:16-alpine` si hace falta.
La prueba crea un PostgreSQL temporal, carga tres registros ficticios de
procesamiento completado y consulta el conteo por ID. El control
`evt_demo_002` debe aparecer una vez. Para `evt_demo_001` la prueba espera
uno y encuentra dos, por lo que el comando termina con código 1.
Al terminar elimina el contenedor.

El fixture representa el estado almacenado después de una duplicación. La
causa de esa duplicación queda fuera del experimento. Para comparar agentes,
usa dos checkouts limpios del commit base y registra el modelo, la tarea,
las herramientas, el parche, el tiempo transcurrido y el resultado de la prueba.
