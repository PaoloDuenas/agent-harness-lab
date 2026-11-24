# agent-harness-lab

## Segunda ronda

Una herramienta local recibe lotes de identificadores ficticios y los importa en
un catálogo de PostgreSQL. El catálogo debe conservar una entrada por identificador
a lo largo de las importaciones. Recibir un lote vacío debe conservar su contenido.

Con Node.js 24 y Docker en ejecución, corre desde la raíz:

```sh
node --test idempotencia.test.mts
```

La prueba inicia un PostgreSQL temporal en un contenedor Linux y lo elimina al
terminar. La primera ejecución puede descargar la imagen de PostgreSQL.
