# SQL en la Hacienda

Curso interactivo de SQL construido sobre **tu propio esquema ganadero** (`esquema_hacienda.sql`).
No es una página de apuntes: es una aplicación que ejecuta SQL de verdad contra PostgreSQL,
con datos de ejemplo, ejercicios corregidos automáticamente y un laboratorio libre.

---

## Cómo empezar

Tienes dos formas de ejecutarlo. Elige la que mejor se adapte a tu equipo:

### Opción 1: Con Docker (Recomendada para equipos - Windows, Mac o Linux)

No necesitas instalar ni configurar PostgreSQL ni Node en tu máquina. Solo necesitas [Docker Desktop](https://www.docker.com/products/docker-desktop/).

1. Abre tu terminal en la carpeta del proyecto.
2. Ejecuta:
   ```bash
   docker compose up
   ```
3. Abre tu navegador en <http://localhost:8899>.
4. Para detenerlo: pulsa `Ctrl + C` (o ejecuta `docker compose down`).

---

### Opción 2: Sin Docker (Ejecución local nativa)

#### Requisitos:
- **Node.js** (v18 o superior). Sin `npm install` (cero dependencias externas).
- **PostgreSQL** instalado y corriendo en tu computadora.

#### Pasos:
- **En Windows**: Haz doble clic en **`iniciar.bat`**.
- **En Linux o macOS**: Abre la terminal y ejecuta:
  ```bash
  chmod +x iniciar.sh
  ./iniciar.sh
  ```
- Se abrirá automáticamente tu navegador en <http://localhost:8899>.
- Para terminar: cierra la ventana o pulsa `Ctrl + C`.

La primera vez, el programa crea automáticamente la base de datos `hacienda_practica`, carga el esquema
y siembra más de 2.000 registros de ejemplo. Las siguientes veces arranca de inmediato.

### Variables de entorno útiles (Opcionales)
Si tu PostgreSQL local usa credenciales distintas a las por defecto, puedes configurarlas:
- `PGHOST` (por defecto `127.0.0.1`)
- `PGPORT` (por defecto `5432`)
- `PGUSER` (por defecto `postgres`)
- `PGPASSWORD` (por defecto vacía)
- `PGDATABASE` (por defecto `hacienda_practica`)
- `PORT` (puerto web, por defecto `8899`)

### Si algo no arranca (en modo local)

- **«No se pudo conectar a PostgreSQL»** → el servicio de PostgreSQL está detenido o la contraseña es diferente. En Windows, abre *Servicios* y verifica que el servicio de Postgres esté iniciado.
- **«El puerto 8899 está ocupado»** → arranca en otro puerto:
  `set PORT=8900 && node server\server.js` (o en Linux/Mac: `PORT=8900 node server/server.js`)
- **La página carga sin datos** → mira la consola/terminal: ahí se muestra el detalle del error.

---

## Qué hay dentro

| Sección | Qué es |
| --- | --- |
| **Lecciones** | 40 lecciones en 14 módulos, de `SELECT` a disparadores y planes de ejecución. Cada una con ejemplos ejecutables y un quiz. |
| **Ejercicios** | 80 retos con corrección automática. Tu resultado se compara con el correcto: puedes llegar por otro camino. |
| **Laboratorio** | Editor SQL libre contra la base real, con el esquema a un clic e historial de consultas. |
| **Modelo de datos** | Las 26 tablas documentadas, sus llaves y las reglas que las protegen. |
| **Chuleta** | Referencia rápida y buscable de todos los comandos del curso. |

El progreso se guarda en el `localStorage` del navegador. No hay cuentas ni servidores
externos: nada sale de tu computadora.

---

## Huella en el sistema (importante)

Todo el proyecto vive **dentro de esta carpeta**. No descarga nada de internet y no
instala dependencias: el cliente de PostgreSQL está escrito a mano en `server/lib/pg.js`
usando solo módulos nativos de Node.

Lo único que sale de la carpeta es:

1. **Una base de datos PostgreSQL llamada `hacienda_practica`.** Es independiente de tus
   demás bases: no las lee ni las modifica. Puedes verla y borrarla con `psql`.
2. **Un servidor local** que escucha únicamente en `127.0.0.1:8899`. No se expone a la red
   y no se registra como servicio: solo existe mientras la ventana está abierta.

No se toca ninguna otra base, ni el registro de Windows, ni variables de entorno
permanentes, ni carpetas fuera del proyecto (salvo archivos temporales del sistema que
Windows limpia solo).

### Cómo deshacerlo del todo

- **Restablecer los datos** (volver al estado inicial): botón *restablecer datos* en la
  barra lateral, o borra la carpeta y vuelve a empezar.
- **Eliminar la base de datos**: doble clic en **`borrar_base_de_datos.bat`**.
  Solo borra `hacienda_practica`.
- **Eliminar el curso**: borra esta carpeta. No queda nada más.

---

## Cómo está hecho

```
esquema_hacienda.sql        tu esquema original (26 tablas + 3 vistas)
iniciar.bat                 lanzador
borrar_base_de_datos.bat    elimina solo la base de práctica
server/
  server.js                 servidor HTTP + API (sin dependencias)
  lib/pg.js                 cliente del protocolo PostgreSQL escrito a mano
  db/esquema.sql            copia del esquema que carga el servidor
  db/seed_datos.sql         datos de ejemplo generados
web/
  index.html
  assets/css/app.css        diseño completo (temas claro y oscuro)
  assets/js/core.js         estado, progreso, API, utilidades
  assets/js/editor.js       editor SQL con resaltado y tablas de resultados
  assets/js/views.js        todas las pantallas
  assets/js/app.js          router, navegación, buscador
  assets/data/*.js          contenido: currículo, ejercicios, modelo, chuleta
tools/                      scripts de generación y validación (no hacen falta para usar)
```

### La corrección de ejercicios

No se compara texto, se compara **resultado**:

1. El servidor ejecuta tu consulta dentro de una transacción y guarda el resultado.
2. Ejecuta la solución de referencia y guarda el suyo.
3. Compara ambos conjuntos de filas (sin importar el orden, salvo que la solución use
   `ORDER BY`). Los números se comparan numéricamente y las fechas por valor.

Los ejercicios de escritura (`INSERT`, `UPDATE`, `DELETE`, `CREATE`) se ejecutan de verdad,
pero **siempre dentro de una transacción que se deshace al terminar**: nada queda
modificado. La verificación posterior comprueba el estado resultante.

Los ejemplos de las lecciones funcionan igual: se ejecutan en una transacción que se
revierte, así que puedes pulsar *Ejecutar* mil veces sin miedo.

### Los datos

Los datos son sintéticos y deterministas (`tools/generar_datos.py`): 80 animales, 10
potreros, ~2.000 pesajes, 15 eventos sanitarios, 5 ventas y 3 cuadres de inventario. Están
diseñados para que haya casos interesantes: animales sin nombre, sin pesajes, grupos
vacíos, potreros sin grupo, ventas con un solo animal, empates de peso…

Fecha de referencia de los datos: **20 de noviembre de 2026**.

---

## Validación

Los scripts de `tools/` se usaron durante el desarrollo y puedes volver a ejecutarlos:

```bat
node tools\validar_contenido.js   :: ejecuta los 80 ejercicios y los 122 ejemplos SQL
node tools\test_ui.js             :: renderiza todas las vistas sin navegador
```

El primero necesita el servidor en marcha; comprueba que **todo** el SQL del curso se
ejecuta y devuelve resultados.
