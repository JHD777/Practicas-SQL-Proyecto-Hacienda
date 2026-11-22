/* ==========================================================================
   Currículo · parte 3 — Escribir datos, diseñar y optimizar
   ========================================================================== */
window.CURRICULO = window.CURRICULO || [];

window.CURRICULO.push(
  // =========================================================================
  {
    id: 'm8',
    titulo: 'Modificar datos',
    emoji: '✍️',
    nivel: 'Intermedio',
    resumen: 'INSERT, UPDATE, DELETE, borrado lógico y transacciones. Aquí se rompen cosas.',
    lecciones: [
      {
        id: 'm8-l1',
        titulo: 'INSERT: añadir filas',
        minutos: 9,
        intro: 'La primera sentencia que modifica datos. Y la que más veces ejecutarás en una aplicación.',
        bloques: [
          {
            t: 'p',
            c: 'La forma básica lista las columnas y luego los valores, en el mismo orden. Las columnas que no menciones toman su valor por defecto o `NULL`.',
          },
          {
            t: 'sql',
            titulo: 'Insertar un catálogo',
            c: "INSERT INTO causa_muerte (nombre)\nVALUES ('Insolación / golpe de calor')\nRETURNING id, nombre, activo;",
          },
          {
            t: 'p',
            c: '`RETURNING` es una joya de PostgreSQL: te devuelve las filas recién insertadas, con los valores que generó la base (`id`, `fecha_registro`, `activo`…). Evita tener que hacer un `SELECT` después. No es estándar de SQL, pero lo tienen PostgreSQL y SQLite.',
          },
          {
            t: 'nota',
            tipo: 'info',
            titulo: 'Los ejemplos de este módulo no cambian nada',
            c: 'Los ejemplos con `INSERT`, `UPDATE` o `DELETE` se ejecutan dentro de una transacción que **se deshace al instante**. Puedes pulsar Ejecutar mil veces: la base queda igual. Para escribir de verdad, usa el laboratorio (y su botón de restablecer).',
          },
          { t: 'h', c: 'Varias filas de una vez' },
          {
            t: 'sql',
            titulo: 'Insertar en bloque',
            c: "INSERT INTO tipo_labor (nombre)\nVALUES ('Cercado'), ('Arado'), ('Siembra de maíz')\nRETURNING id, nombre;",
          },
          {
            t: 'p',
            c: 'Un solo `INSERT` con varias filas es mucho más rápido que varios `INSERT` sueltos: una sola ida y vuelta al servidor.',
          },
          { t: 'h', c: 'INSERT ... SELECT' },
          {
            t: 'p',
            c: 'Puedes insertar el resultado de una consulta. Es la herramienta de las migraciones y los respaldos.',
          },
          {
            t: 'sql',
            titulo: 'Copiar animales a un grupo nuevo',
            c: "INSERT INTO pesaje (id_animal, fecha, peso_kg, comentario)\nSELECT id, DATE '2020-01-01', 450, 'Pesaje histórico importado'\nFROM animal\nWHERE id IN (2, 4, 6)\nRETURNING id, id_animal, fecha, peso_kg;",
          },
          {
            t: 'nota',
            tipo: 'ojo',
            titulo: 'Los triggers también se disparan',
            c: 'Si la tabla tiene un disparador `BEFORE INSERT` (como el que bloquea pesajes de animales no activos), se ejecuta igual. Un `INSERT ... SELECT` puede fallar entero si una sola fila viola una regla.',
          },
          { t: 'h', c: 'Valores por defecto' },
          {
            t: 'p',
            c: 'Las columnas `SERIAL` obtienen su valor de una secuencia. Las que tienen `DEFAULT CURRENT_DATE` toman la fecha de hoy. Si necesitas forzar un valor concreto, lo indicas; si no, omites la columna.',
          },
          {
            t: 'sql',
            titulo: 'Dejar que la base ponga la fecha',
            c: "INSERT INTO pesaje (id_animal, peso_kg, comentario)\nVALUES (2, 470, 'Pesaje de control')\nRETURNING id, fecha, peso_kg;",
          },
          {
            t: 'p',
            c: 'No hemos indicado `fecha` y ha aparecido rellena: la columna tiene `DEFAULT CURRENT_DATE`. Lo mismo pasa con `id` (secuencia) y con `activo` (DEFAULT TRUE) en casi todas las tablas del esquema.',
          },
          {
            t: 'quiz',
            pregunta: '¿Qué hace `RETURNING`?',
            opciones: [
              'Devuelve las filas afectadas por la sentencia',
              'Deshace la operación',
              'Crea un respaldo',
              'Convierte el INSERT en SELECT',
            ],
            correcta: 0,
            explicacion: 'Devuelve las filas insertadas, actualizadas o borradas, con sus valores finales. Muy útil para conocer el `id` generado.',
          },
        ],
        clave: [
          '`INSERT INTO tabla (columnas) VALUES (...)` con columnas explícitas.',
          'Varias filas en un solo `VALUES` es más rápido.',
          '`RETURNING` devuelve las filas afectadas.',
        ],
      },
      {
        id: 'm8-l2',
        titulo: 'UPDATE, DELETE y borrado lógico',
        minutos: 11,
        intro: 'Cambiar y borrar filas con cuidado: el olvido del WHERE es el error más caro de SQL.',
        bloques: [
          {
            t: 'p',
            c: '`UPDATE` cambia valores en las filas que cumplen el `WHERE`. Si lo olvidas, actualizas **todas** las filas de la tabla. No hay confirmación ni papelera.',
          },
          {
            t: 'sql',
            titulo: 'Actualizar una fila',
            c: "UPDATE grupo\nSET nombre = 'Vaquillas de reemplazo'\nWHERE id = 3\nRETURNING id, nombre;",
          },
          {
            t: 'nota',
            tipo: 'error',
            titulo: 'El WHERE que salva vidas',
            c: 'Antes de un `UPDATE` o un `DELETE`, ejecuta el mismo `WHERE` con un `SELECT` para ver qué filas te llevas. Y hazlo dentro de una transacción: si te equivocas, `ROLLBACK`.',
          },
          { t: 'h', c: 'Calcular a partir de la propia fila' },
          {
            t: 'sql',
            titulo: 'Subir el 10 % a los precios de venta',
            c: 'UPDATE detalle_venta\nSET precio_unitario = round(precio_unitario * 1.10, 2)\nRETURNING id, id_venta, precio_unitario;',
          },
          {
            t: 'p',
            c: 'Este ejemplo no tiene `WHERE`: afecta a **todas** las filas de `detalle_venta`. En la vida real es un cambio masivo deliberado; en el laboratorio, un accidente. Por eso se ejecuta en una transacción que se deshace.',
          },
          {
            t: 'p',
            c: 'Puedes usar varias columnas y expresiones complejas. También `UPDATE ... FROM` para tomar valores de otra tabla:',
          },
          {
            t: 'sql',
            titulo: 'UPDATE con datos de otra tabla',
            c: "UPDATE animal a\nSET comentario = 'Grupo actual: ' || g.nombre\nFROM grupo g\nWHERE g.id = a.id_grupo AND a.id = 1\nRETURNING a.id, a.comentario;",
          },
          { t: 'h', c: 'DELETE' },
          {
            t: 'sql',
            titulo: 'Borrar programaciones canceladas',
            c: "DELETE FROM programacion_sanitaria\nWHERE estado = 'Cancelada'\nRETURNING id, titulo, estado;",
          },
          {
            t: 'p',
            c: '`DELETE FROM tabla` sin `WHERE` vacía la tabla. `TRUNCATE tabla` lo hace todavía más rápido (y reinicia la identidad), pero no se puede deshacer fila a fila y no dispara los triggers `DELETE`.',
          },
          { t: 'h', c: 'Borrado lógico' },
          {
            t: 'p',
            c: 'En un sistema real casi nunca se borra un animal: se marca como inactivo para conservar su historial. El esquema lo hace con la columna `activo` y un **trigger** que pone `fecha_baja` automáticamente.',
          },
          {
            t: 'sql',
            titulo: 'Borrado lógico (y el trigger de fecha_baja)',
            c: 'UPDATE animal\nSET activo = FALSE\nWHERE id = 80\nRETURNING id, numero_arete, activo, fecha_baja;',
          },
          {
            t: 'p',
            c: 'Fíjate en que `fecha_baja` no aparece en el `SET`: la pone el disparador `tg_animal_fecha_baja`. Si vuelves a poner `activo = TRUE`, lo limpia. Ese es el módulo de triggers, más adelante.',
          },
          {
            t: 'nota',
            tipo: 'info',
            titulo: 'Estado frente a activo',
            c: '`estado` cuenta la historia del animal (Activo, Vendido, Muerto). `activo` es el borrado lógico del registro. Un animal vendido tiene `estado = \'Vendido\'` pero normalmente sigue con `activo = true`, porque su historial debe seguir consultable.',
          },
          {
            t: 'quiz',
            pregunta: 'Ejecutas `UPDATE animal SET comentario = \'revisado\';` sin WHERE. ¿Qué ocurre?',
            opciones: [
              'Un error: UPDATE exige WHERE',
              'Solo actualiza la primera fila',
              'Actualiza todas las filas de la tabla',
              'No actualiza nada',
            ],
            correcta: 2,
            explicacion: 'Sin `WHERE` no hay filtro: todas las filas se actualizan. PostgreSQL no te avisa.',
          },
        ],
        clave: [
          '`UPDATE ... SET ... WHERE ...`; omite el `WHERE` y actualizas todo.',
          '`RETURNING` también funciona en `UPDATE` y `DELETE`.',
          'El borrado lógico conserva el historial: `activo = FALSE`.',
        ],
      },
      {
        id: 'm8-l3',
        titulo: 'Transacciones: todo o nada',
        minutos: 11,
        intro: 'La propiedad que hace que una base de datos sea fiable. Y la que evita que una venta a medias deje el inventario roto.',
        bloques: [
          {
            t: 'p',
            c: 'Una transacción agrupa varias sentencias en una unidad atómica: o se aplican todas, o ninguna. Se delimita con `BEGIN` y termina con `COMMIT` (confirmar) o `ROLLBACK` (deshacer).',
          },
          {
            t: 'codigo',
            lenguaje: 'sql',
            titulo: 'Vender un animal: tres pasos que deben ir juntos',
            c: "-- 1. cabecera de la venta\nBEGIN;\nINSERT INTO venta (fecha, id_comprador, precio_total)\nVALUES (CURRENT_DATE, 3, 5400.00)\nRETURNING id;\n\n-- 2. detalle (suponiendo que devolvió id = 6)\nINSERT INTO detalle_venta (id_venta, id_animal, precio_unitario)\nVALUES (6, 12, 5400.00);\n\n-- 3. el animal sale del inventario activo\nUPDATE animal\nSET estado = 'Vendido', fecha_salida = CURRENT_DATE, id_grupo = NULL\nWHERE id = 12;\n\nCOMMIT;",
          },
          {
            t: 'p',
            c: 'Si el paso 3 falla (por ejemplo, porque el animal ya estaba vendido y `detalle_venta` tiene un índice único sobre `id_animal`), un `ROLLBACK` deja la base exactamente como estaba: sin venta fantasma y sin animal marcado. Sin transacción, te quedaría una venta sin detalle y un inventario incoherente.',
          },
          { t: 'h', c: 'ACID' },
          {
            t: 'tabla',
            cabecera: ['Letra', 'Propiedad', 'Qué garantiza'],
            filas: [
              ['A', 'Atomicidad', 'Todo o nada.'],
              ['C', 'Consistencia', 'Las restricciones se cumplen al final.'],
              ['I', 'Aislamiento', 'Las transacciones concurrentes no ven estados intermedios.'],
              ['D', 'Durabilidad', 'Un `COMMIT` sobrevive a un corte de luz.'],
            ],
          },
          {
            t: 'nota',
            tipo: 'info',
            titulo: 'Aquí no puedes escribir BEGIN a mano',
            c: 'El editor del laboratorio ejecuta cada sentencia en su propia transacción implícita. Si escribes `BEGIN`, el servidor te lo rechaza para no dejar conexiones colgadas. Para practicar transacciones de verdad tienes la lección y el ejemplo de arriba (que es teórico).',
          },
          { t: 'h', c: 'Guardar puntos intermedios' },
          {
            t: 'p',
            c: '`SAVEPOINT` marca un punto dentro de la transacción al que puedes volver sin deshacerlo todo. Útil en procesos largos donde algunos pasos pueden fallar sin invalidar el resto.',
          },
          {
            t: 'codigo',
            lenguaje: 'sql',
            titulo: 'SAVEPOINT',
            c: "BEGIN;\nINSERT INTO venta (id_comprador, precio_total) VALUES (3, 5400);\nSAVEPOINT antes_del_detalle;\n\nINSERT INTO detalle_venta (id_venta, id_animal, precio_unitario)\nVALUES (6, 12, 5400);   -- si esto falla...\n\nROLLBACK TO antes_del_detalle;  -- ...volvemos aquí\nCOMMIT;",
          },
          { t: 'h', c: 'Aislamiento y concurrencia' },
          {
            t: 'p',
            c: 'Por defecto PostgreSQL usa `READ COMMITTED`: cada sentencia ve los cambios confirmados hasta ese momento. Los otros niveles son `REPEATABLE READ` y `SERIALIZABLE`, que dan más aislamiento a cambio de más bloqueos o reintentos.',
          },
          {
            t: 'sql',
            titulo: 'Ver el nivel de aislamiento actual',
            c: 'SHOW transaction_isolation;',
          },
          {
            t: 'p',
            c: 'Los problemas clásicos que evita el aislamiento: **lectura sucia** (leer algo no confirmado), **lectura no repetible** (leer dos veces y obtener valores distintos) y **lectura fantasma** (aparecen filas nuevas en la segunda lectura).',
          },
          {
            t: 'quiz',
            pregunta: 'Ejecutas `BEGIN`, un `INSERT` y luego cierras la conexión sin `COMMIT`. ¿Qué pasa con el INSERT?',
            opciones: [
              'Se guarda igual',
              'Se pierde: la transacción se revierte',
              'Queda pendiente para siempre',
              'Se guarda a medias',
            ],
            correcta: 1,
            explicacion: 'Sin `COMMIT`, cerrar la conexión provoca un `ROLLBACK` implícito. Nada de lo hecho en la transacción queda guardado.',
          },
        ],
        clave: [
          '`BEGIN` … `COMMIT` / `ROLLBACK`: atomicidad.',
          'ACID: atomicidad, consistencia, aislamiento y durabilidad.',
          '`SAVEPOINT` permite deshacer parte de una transacción.',
        ],
      },
    ],
  },

  // =========================================================================
  {
    id: 'm9',
    titulo: 'Diseñar una base de datos',
    emoji: '🏗️',
    nivel: 'Intermedio',
    resumen: 'CREATE TABLE, restricciones y normalización: el esquema que tienes delante, explicado.',
    lecciones: [
      {
        id: 'm9-l1',
        titulo: 'CREATE TABLE y tipos de datos',
        minutos: 11,
        intro: 'Diseñar es decidir qué se guarda, con qué tipo y qué reglas no se pueden violar nunca.',
        bloques: [
          {
            t: 'p',
            c: 'El esquema de la hacienda tiene 26 tablas. Todas siguen el mismo patrón: un `id` que las identifica, columnas con tipos concretos, restricciones y, cuando aplica, un borrado lógico con `activo`.',
          },
          {
            t: 'codigo',
            lenguaje: 'sql',
            titulo: 'Anatomía de una tabla del esquema',
            c: "CREATE TABLE grupo (\n    id                    SERIAL PRIMARY KEY,\n    nombre                VARCHAR(80) NOT NULL,\n    id_potrero            INT,\n    fecha_ingreso_potrero DATE,\n    activo                BOOLEAN NOT NULL DEFAULT TRUE,\n    fecha_baja            TIMESTAMPTZ\n);",
          },
          {
            t: 'p',
            c: 'Cada línea es una decisión de diseño. `SERIAL` genera el identificador. `NOT NULL` prohíbe el vacío. `DEFAULT TRUE` evita tener que escribirlo en cada `INSERT`. La ausencia de `NOT NULL` en `id_potrero` permite que un grupo no esté asignado a ningún potrero.',
          },
          { t: 'h', c: 'Elegir el tipo correcto' },
          {
            t: 'tabla',
            cabecera: ['Necesitas guardar…', 'Usa', 'Evita'],
            filas: [
              ['Un identificador', '`SERIAL` / `GENERATED ALWAYS AS IDENTITY`', '`VARCHAR`'],
              ['Un texto corto', '`VARCHAR(120)` o `TEXT`', 'Nada especial: en PostgreSQL `TEXT` no es más lento'],
              ['Dinero o medidas exactas', '`NUMERIC(12,2)`', '`FLOAT` / `REAL` (errores de redondeo)'],
              ['Un sí/no', '`BOOLEAN`', '`CHAR(1)` con `\'S\'`/`\'N\'`'],
              ['Una fecha', '`DATE`', '`VARCHAR(10)`'],
              ['Fecha y hora con zona', '`TIMESTAMPTZ`', '`TIMESTAMP` sin zona'],
              ['Un texto largo libre', '`TEXT`', '`VARCHAR(5000)` arbitrario'],
            ],
          },
          {
            t: 'nota',
            tipo: 'ojo',
            titulo: 'NUMERIC, no FLOAT, para dinero',
            c: '`0.1 + 0.2` en coma flotante da `0.30000000000000004`. Para precios y pesos se usa `NUMERIC`, que guarda decimales exactos. El esquema lo hace bien: `precio_total NUMERIC(12,2)`, `peso_kg NUMERIC(6,2)`.',
          },
          {
            t: 'sql',
            titulo: 'La diferencia, en vivo',
            c: 'SELECT 0.1::float8 + 0.2::float8 AS con_float,\n       0.1::numeric + 0.2::numeric AS con_numeric;',
          },
          { t: 'h', c: 'SERIAL frente a IDENTITY' },
          {
            t: 'p',
            c: '`SERIAL` es azúcar sintáctico de PostgreSQL: crea una secuencia, la asocia a la columna y pone `DEFAULT nextval(...)`. El estándar moderno es `GENERATED ALWAYS AS IDENTITY`, que hace lo mismo pero es SQL estándar y no permite insertar un valor manual por accidente. El esquema usa `SERIAL` por compatibilidad con Supabase y tutoriales antiguos; ambas opciones son válidas.',
          },
          {
            t: 'sql',
            titulo: 'Crear una tabla de insumos',
            c: "CREATE TABLE insumo (\n  id       SERIAL PRIMARY KEY,\n  nombre   VARCHAR(80) NOT NULL,\n  unidad   VARCHAR(10) NOT NULL DEFAULT 'kg',\n  stock    NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (stock >= 0)\n);\n\nINSERT INTO insumo (nombre, stock) VALUES ('Vacuna aftosa', 120), ('Sal mineral', 340.5);\n\nSELECT * FROM insumo;",
          },
          {
            t: 'p',
            c: 'Ese `CREATE TABLE` funciona aquí porque el ejemplo se ejecuta en una transacción que se deshace. En el laboratorio, sin embargo, crearía la tabla de verdad (hasta que restablezcas los datos).',
          },
          {
            t: 'quiz',
            pregunta: '¿Qué tipo usarías para un precio?',
            opciones: ['`FLOAT`', '`NUMERIC(12,2)`', '`INT`', '`TEXT`'],
            correcta: 1,
            explicacion: '`NUMERIC` guarda decimales exactos. `FLOAT` acumula errores de redondeo, y en dinero eso no es aceptable.',
          },
        ],
        clave: [
          '`SERIAL PRIMARY KEY` para identificadores; `NOT NULL` y `DEFAULT` para reglas.',
          '`NUMERIC` para dinero y medidas; `DATE`/`TIMESTAMPTZ` para fechas.',
          '`TEXT` en PostgreSQL no tiene penalización de rendimiento frente a `VARCHAR`.',
        ],
      },
      {
        id: 'm9-l2',
        titulo: 'Restricciones: que la base se defienda sola',
        minutos: 12,
        intro: 'Una restricción es una regla que la base de datos hace cumplir siempre, incluso si la aplicación tiene un bug.',
        bloques: [
          {
            t: 'p',
            c: 'Las restricciones son la última línea de defensa. Una aplicación se puede saltar una validación; una restricción `NOT NULL` no se la salta nadie.',
          },
          {
            t: 'tabla',
            cabecera: ['Restricción', 'Qué garantiza'],
            filas: [
              ['`PRIMARY KEY`', 'Identifica la fila: `NOT NULL` + único.'],
              ['`NOT NULL`', 'El valor existe siempre.'],
              ['`UNIQUE`', 'No hay dos filas con el mismo valor.'],
              ['`CHECK`', 'Una condición booleana se cumple.'],
              ['`DEFAULT`', 'Valor cuando no se indica.'],
              ['`FOREIGN KEY`', 'El valor existe en la tabla referenciada.'],
            ],
          },
          { t: 'h', c: 'CHECK: reglas de dominio' },
          {
            t: 'p',
            c: 'El esquema usa `CHECK` para validar dominios: el sexo solo puede ser `M` o `H`, el estado solo `Activo`, `Vendido` o `Muerto`, los porcentajes están entre 0 y 100. Son reglas del negocio escritas una vez y aplicadas a todas las inserciones.',
          },
          {
            t: 'sql',
            titulo: 'Provocar un CHECK a propósito',
            falla: true,
            c: "INSERT INTO pesaje (id_animal, fecha, peso_kg)\nVALUES (1, DATE '2026-01-01', -5);",
          },
          {
            t: 'p',
            c: 'El error dirá `viola la restricción «check» «ck_pesaje_rango»`. Ese nombre es la pista: alguien decidió que un peso negativo no tiene sentido. La base te está protegiendo de un dato corrupto.',
          },
          { t: 'h', c: 'FOREIGN KEY y qué pasa al borrar' },
          {
            t: 'p',
            c: 'La llave foránea de `animal.id_raza` a `raza.id` impide registrar un animal con una raza inexistente. Pero, ¿qué pasa si borras una raza que tiene animales? Depende de la política `ON DELETE`:',
          },
          {
            t: 'tabla',
            cabecera: ['Política', 'Comportamiento'],
            filas: [
              ['`RESTRICT`', 'Impide el borrado (la mayoría en este esquema).'],
              ['`CASCADE`', 'Borra en cascada las filas hijas.'],
              ['`SET NULL`', 'Pone la llave foránea a NULL.'],
              ['`NO ACTION`', 'Como `RESTRICT`, pero se comprueba al final de la sentencia.'],
            ],
          },
          {
            t: 'sql',
            titulo: 'Intentar borrar una raza en uso',
            falla: true,
            c: 'DELETE FROM raza WHERE id = 1;',
          },
          {
            t: 'p',
            c: 'Falla con `viola la restricción de llave foránea`. Es lo correcto: si se borrara, 20 animales se quedarían apuntando al vacío. Las tablas hijas del esquema usan `CASCADE` en las relaciones de composición (por ejemplo `detalle_venta` cuando se borra la `venta`).',
          },
          { t: 'h', c: 'UNIQUE parcial: la joya del esquema' },
          {
            t: 'p',
            c: 'Fíjate en estos índices del archivo:',
          },
          {
            t: 'codigo',
            lenguaje: 'sql',
            titulo: 'Índices únicos parciales',
            c: "CREATE UNIQUE INDEX uq_animal_arete ON animal (LOWER(numero_arete)) WHERE activo;\nCREATE UNIQUE INDEX uq_potrero_codigo ON potrero (LOWER(codigo)) WHERE activo;\nCREATE UNIQUE INDEX uq_comprador_nombre ON comprador (LOWER(nombre)) WHERE activo;",
          },
          {
            t: 'p',
            c: 'Un índice único **parcial**: solo se aplica a las filas donde `activo` es verdadero. Eso permite reutilizar el arete `A-101` después de dar de baja al animal que lo tenía, sin perder el histórico. Y `LOWER(numero_arete)` hace la unicidad insensible a mayúsculas: `a-101` y `A-101` chocan. Es una solución elegante a un problema real.',
          },
          {
            t: 'sql',
            titulo: 'Comprobar la unicidad insensible a mayúsculas',
            c: "SELECT numero_arete FROM animal WHERE lower(numero_arete) = lower('a-101');",
          },
          {
            t: 'quiz',
            pregunta: '¿Qué permite exactamente el índice `uq_animal_arete ... WHERE activo`?',
            opciones: [
              'Que el arete sea único entre todos los animales, incluidos los borrados',
              'Que el arete sea único solo entre los animales activos',
              'Que el arete no pueda repetirse nunca',
              'Que el arete se guarde en mayúsculas',
            ],
            correcta: 1,
            explicacion: 'Al ser parcial, solo restringe las filas con `activo = true`. Los registros dados de baja quedan fuera y pueden repetir el arete.',
          },
        ],
        clave: [
          'Las restricciones protegen los datos aunque la aplicación falle.',
          '`CHECK` valida dominios; `FK` mantiene la integridad referencial.',
          'Los índices únicos parciales permiten reutilizar códigos tras una baja lógica.',
        ],
      },
      {
        id: 'm9-l3',
        titulo: 'Normalización: 1FN, 2FN y 3FN',
        minutos: 12,
        intro: 'El esquema dice "100 % 3FN". Esta lección explica qué significa y por qué está así diseñado.',
        bloques: [
          {
            t: 'p',
            c: 'Normalizar es organizar las tablas para que cada dato viva en un solo sitio. Menos duplicación, menos incoherencias y menos bugs.',
          },
          { t: 'h', c: 'Primera forma normal (1FN)' },
          {
            t: 'p',
            c: 'Cada celda guarda **un solo valor atómico**: nada de listas separadas por comas. Un animal puede tener varias características físicas (mocha, pintada, chuta). La tentación es una columna `caracteristicas` con `\'Mocha, Pintada\'`. La solución correcta es una tabla puente:',
          },
          {
            t: 'tabla',
            cabecera: ['Mal (no 1FN)', 'Bien (1FN)'],
            filas: [
              ['`animal.caracteristicas = \'Mocha, Pintada\'`', 'Tabla `animal_caracteristica(id_animal, id_caracteristica)`'],
              ['`potrero.pastos = \'Brachiaria, Guinea\'`', 'Tabla `potrero_pasto(id_potrero, id_tipo_pasto)`'],
            ],
          },
          {
            t: 'sql',
            titulo: 'La tabla puente en acción',
            c: 'SELECT * FROM potrero_pasto ORDER BY id_potrero LIMIT 8;',
          },
          {
            t: 'p',
            c: 'Con la tabla puente puedes hacer cosas imposibles con una lista de texto: contar cuántos potreros tienen Brachiaria, filtrar por tipo de pasto o garantizar con `UNIQUE (id_potrero, id_tipo_pasto)` que no se repita la combinación.',
          },
          { t: 'h', c: 'Segunda forma normal (2FN)' },
          {
            t: 'p',
            c: 'Ya en 1FN, cada atributo debe depender de **toda** la clave primaria, no de una parte. Esto solo importa cuando la clave es compuesta. En `detalle_venta(id_venta, id_animal, precio_unitario)`, el precio depende del par (venta, animal), no del animal por separado. Si dependiera solo del animal, iría en `animal`.',
          },
          {
            t: 'sql',
            titulo: 'Claves compuestas del esquema',
            c: "SELECT tc.table_name, string_agg(kcu.column_name, ' + ' ORDER BY kcu.ordinal_position) AS clave\nFROM information_schema.table_constraints tc\nJOIN information_schema.key_column_usage kcu\n  ON kcu.constraint_name = tc.constraint_name AND kcu.table_schema = tc.table_schema\nWHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = 'public'\nGROUP BY tc.table_name\nORDER BY tc.table_name;",
          },
          {
            t: 'p',
            c: 'Todas las claves primarias del esquema son de una sola columna (`id`). La unicidad compuesta se resuelve con índices `UNIQUE` separados, como `uq_potrero_pasto (id_potrero, id_tipo_pasto)`. Eso ya garantiza la 2FN en las tablas puente: un pasto por potrero, una vez.',
          },
          { t: 'h', c: 'Tercera forma normal (3FN)' },
          {
            t: 'p',
            c: 'Ningún atributo debe depender de otro atributo que no sea la clave. Dicho de otro modo: nada de campos que se puedan deducir. Si `animal` tuviera `id_raza` y además `nombre_raza`, el nombre dependería de `id_raza`, no del animal. Eso es una dependencia transitiva y viola 3FN.',
          },
          {
            t: 'tabla',
            cabecera: ['Mal (no 3FN)', 'Bien (3FN)'],
            filas: [
              ['`animal(id_raza, nombre_raza)`', '`animal(id_raza)` + `raza(nombre)`'],
              ['`grupo(id_potrero, hectareas_potrero)`', '`grupo(id_potrero)` + `potrero(hectareas)`'],
              ['`venta(id_comprador, telefono_comprador)`', '`venta(id_comprador)` + `comprador(telefono)`'],
            ],
          },
          {
            t: 'p',
            c: 'El esquema cumple 3FN en todas sus tablas. `v_kardex` parece violarla porque tiene `grupo_actual`, `potrero_actual` y `edad_meses_calculada`… pero es una **vista**: no almacena nada, se calcula al consultarla. Una vista no rompe la normalización.',
          },
          {
            t: 'nota',
            tipo: 'info',
            titulo: 'Cuándo desnormalizar',
            c: 'En analítica y sistemas con muchísima lectura se desnormaliza a propósito: se duplican datos para evitar joins costosos. Se hace con los ojos abiertos y con procesos que mantienen la copia al día. Como regla: normaliza primero, desnormaliza cuando midas que hace falta.',
          },
          {
            t: 'sql',
            titulo: 'Comprobar si hay duplicados donde no debería',
            c: "SELECT id_potrero, id_tipo_pasto, count(*)\nFROM potrero_pasto\nGROUP BY id_potrero, id_tipo_pasto\nHAVING count(*) > 1;",
          },
          {
            t: 'quiz',
            pregunta: 'Una tabla `animal` con las columnas `id_raza` y `nombre_raza`, ¿qué forma normal viola?',
            opciones: ['1FN', '2FN', '3FN', 'Ninguna'],
            correcta: 2,
            explicacion: '`nombre_raza` depende de `id_raza`, no de la clave `id`. Es una dependencia transitiva, típica violación de 3FN.',
          },
        ],
        clave: [
          '1FN: valores atómicos, sin listas en una celda.',
          '2FN: cada atributo depende de toda la clave.',
          '3FN: sin dependencias transitivas; una vista no rompe la normalización.',
        ],
      },
    ],
  },

  // =========================================================================
  {
    id: 'm10',
    titulo: 'Vistas, índices y rendimiento',
    emoji: '⚡',
    nivel: 'Avanzado',
    resumen: 'Guardar consultas como tablas virtuales, acelerar búsquedas y leer el plan del motor.',
    lecciones: [
      {
        id: 'm10-l1',
        titulo: 'Vistas: consultas con nombre',
        minutos: 9,
        intro: 'Una vista es una consulta guardada que se comporta como una tabla. El esquema trae tres, y son las que usa la aplicación.',
        bloques: [
          {
            t: 'p',
            c: '`CREATE VIEW nombre AS SELECT ...` guarda la consulta, no los datos. Cada vez que consultas la vista, PostgreSQL ejecuta la consulta subyacente con los datos actuales.',
          },
          {
            t: 'sql',
            titulo: 'Crear una vista de animales por potrero',
            c: "CREATE VIEW v_animales_por_potrero AS\nSELECT p.codigo AS potrero,\n       g.nombre AS grupo,\n       count(a.id) AS cabezas\nFROM potrero p\nLEFT JOIN grupo g  ON g.id_potrero = p.id AND g.activo\nLEFT JOIN animal a ON a.id_grupo = g.id AND a.estado = 'Activo'\nGROUP BY p.codigo, g.nombre;\n\nSELECT * FROM v_animales_por_potrero ORDER BY potrero, grupo;",
          },
          {
            t: 'p',
            c: 'Una vista sirve para tres cosas: **simplificar** consultas complejas, **reutilizar** lógica y **restringir** lo que ve un usuario (una vista puede ocultar columnas sensibles).',
          },
          { t: 'h', c: 'Las vistas del esquema' },
          {
            t: 'tabla',
            cabecera: ['Vista', 'Qué resuelve'],
            filas: [
              ['`v_kardex`', 'Ficha completa de cada animal, con grupo actual o último, peso y edad.'],
              ['`v_ganancia_peso`', 'Ganancia diaria de peso calculada con `LAG`.'],
              ['`v_resumen_grupos`', 'Cabezas por grupo, separando machos y hembras con `FILTER`.'],
            ],
          },
          {
            t: 'sql',
            titulo: 'El kárdex, ordenado por peso',
            c: 'SELECT numero_arete, nombre_animal, grupo_actual, potrero_actual, peso_actual_kg\nFROM v_kardex\nORDER BY peso_actual_kg DESC\nLIMIT 5;',
          },
          { t: 'h', c: 'Vistas actualizables' },
          {
            t: 'p',
            c: 'Algunas vistas permiten `INSERT`/`UPDATE`/`DELETE` si son suficientemente simples (una tabla, sin agregados). Las de este esquema usan agregados y `LEFT JOIN`, así que son de solo lectura. Para escribir, ve a la tabla.',
          },
          { t: 'h', c: 'Vistas materializadas' },
          {
            t: 'p',
            c: '`CREATE MATERIALIZED VIEW` **sí guarda** el resultado en disco. Se consulta muy rápido, pero los datos se quedan viejos hasta que ejecutas `REFRESH MATERIALIZED VIEW`. Es la herramienta para informes pesados que no necesitan estar al segundo.',
          },
          {
            t: 'codigo',
            lenguaje: 'sql',
            titulo: 'Vista materializada y su refresco',
            c: "CREATE MATERIALIZED VIEW mv_resumen_mensual AS\nSELECT date_trunc('month', fecha)::date AS mes,\n       count(*) AS pesajes,\n       round(avg(peso_kg), 2) AS promedio\nFROM pesaje\nGROUP BY 1;\n\n-- más tarde, cuando los datos cambien\nREFRESH MATERIALIZED VIEW mv_resumen_mensual;",
          },
          {
            t: 'nota',
            tipo: 'ojo',
            titulo: 'Vista no es copia',
            c: 'Si borras una fila de la tabla base, desaparece de la vista inmediatamente. La vista no tiene datos propios. La única excepción es la vista materializada.',
          },
          {
            t: 'quiz',
            pregunta: '¿Cuándo usarías una vista materializada en lugar de una vista normal?',
            opciones: [
              'Cuando la consulta es lenta y los datos no necesitan estar al segundo',
              'Cuando quieres datos siempre actualizados',
              'Cuando la vista tiene agregados',
              'Siempre: son mejores',
            ],
            correcta: 0,
            explicacion: 'La vista materializada guarda el resultado: es rápida pero se queda obsoleta hasta el `REFRESH`. Se usa para informes pesados.',
          },
        ],
        clave: [
          'Una vista guarda la consulta, no los datos.',
          'Simplifica, reutiliza y restringe el acceso.',
          'La vista materializada guarda el resultado y hay que refrescarla.',
        ],
      },
      {
        id: 'm10-l2',
        titulo: 'Índices: encontrar sin recorrer todo',
        minutos: 11,
        intro: 'Sin índice, PostgreSQL lee la tabla entera. Con índice, salta directo. Pero cada índice cuesta espacio y velocidad de escritura.',
        bloques: [
          {
            t: 'p',
            c: 'Un índice es una estructura auxiliar ordenada por una columna. Es como el índice de un libro: en lugar de leer las 400 páginas, vas a la letra y encuentras la página.',
          },
          {
            t: 'p',
            c: 'La llave primaria ya crea un índice automáticamente. Las llaves foráneas **no** lo crean: si filtras por `animal.id_grupo` con frecuencia, conviene añadirlo.',
          },
          {
            t: 'sql',
            titulo: 'Los índices que ya existen en animal',
            c: "SELECT indexname, indexdef\nFROM pg_indexes\nWHERE tablename = 'animal'\nORDER BY indexname;",
          },
          { t: 'h', c: 'Tipos de índice' },
          {
            t: 'tabla',
            cabecera: ['Tipo', 'Para qué'],
            filas: [
              ['`btree` (por defecto)', 'Igualdad, rangos, ordenaciones. El 95 % de los casos.'],
              ['`gin`', 'Arrays, JSONB, búsqueda de texto completo.'],
              ['`gist`', 'Datos geométricos y de rangos.'],
              ['`hash`', 'Solo igualdad (rara vez merece la pena).'],
            ],
          },
          { t: 'h', c: 'Índices compuestos' },
          {
            t: 'p',
            c: 'Un índice sobre `(id_animal, fecha)` sirve para filtrar por `id_animal`, y también por `id_animal` + `fecha`. **No** sirve para filtrar solo por `fecha`. El orden de las columnas importa: piensa en el prefijo.',
          },
          {
            t: 'sql',
            titulo: 'El índice del último pesaje',
            c: "SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'pesaje';",
          },
          { t: 'h', c: 'Índices parciales' },
          {
            t: 'p',
            c: 'Ya los viste en la lección de restricciones. Además de unicidad, sirven para rendimiento: si el 90 % de tus consultas filtran `WHERE estado = \'Activo\'`, un índice parcial sobre esas filas es mucho más pequeño y rápido que uno completo.',
          },
          {
            t: 'codigo',
            lenguaje: 'sql',
            titulo: 'Índice parcial del esquema',
            c: "CREATE INDEX idx_animal_grupo_activo ON animal (id_grupo)\nWHERE estado = 'Activo' AND activo;",
          },
          {
            t: 'nota',
            tipo: 'ojo',
            titulo: 'El coste oculto',
            c: 'Cada índice acelera las lecturas y **frena** las escrituras (hay que actualizarlo en cada `INSERT`/`UPDATE`/`DELETE`) y ocupa disco. Una tabla con 10 índices es lenta al escribir. Indexa lo que consultas, no todo.',
          },
          {
            t: 'sql',
            titulo: 'Crear un índice y ver el plan',
            c: "CREATE INDEX idx_pesaje_peso ON pesaje (peso_kg);\n\nEXPLAIN SELECT * FROM pesaje WHERE peso_kg > 500;",
          },
          {
            t: 'p',
            c: 'La primera vez PostgreSQL puede preferir un `Seq Scan` si la tabla es pequeña: leer 2.000 filas es más barato que usar el índice. Los índices brillan con tablas grandes y filtros selectivos.',
          },
          {
            t: 'quiz',
            pregunta: 'Tienes un índice sobre `(id_animal, fecha)`. ¿Para cuál de estas consultas NO te sirve?',
            opciones: [
              '`WHERE id_animal = 5`',
              '`WHERE id_animal = 5 AND fecha > \'2026-01-01\'`',
              '`WHERE fecha > \'2026-01-01\'`',
              '`ORDER BY id_animal, fecha`',
            ],
            correcta: 2,
            explicacion: 'El índice está ordenado primero por `id_animal`. Filtrar solo por `fecha` no puede aprovechar ese orden; necesitarías otro índice que empiece por `fecha`.',
          },
        ],
        clave: [
          'Un índice evita leer la tabla entera, a costa de escrituras más lentas.',
          'El orden de las columnas en un índice compuesto importa.',
          'Los índices parciales son ideales para filtros recurrentes.',
        ],
      },
      {
        id: 'm10-l3',
        titulo: 'EXPLAIN: leer lo que piensa el motor',
        minutos: 12,
        intro: 'Antes de optimizar, mide. EXPLAIN te enseña el plan que PostgreSQL va a ejecutar.',
        bloques: [
          {
            t: 'p',
            c: '`EXPLAIN` muestra el plan **estimado**. `EXPLAIN ANALYZE` lo ejecuta y muestra además los tiempos y las filas reales. Es la herramienta número uno para diagnosticar consultas lentas.',
          },
          {
            t: 'sql',
            titulo: 'Plan de una consulta sencilla',
            c: "EXPLAIN ANALYZE\nSELECT a.numero_arete, p.fecha, p.peso_kg\nFROM pesaje p\nJOIN animal a ON a.id = p.id_animal\nWHERE p.peso_kg > 480\nORDER BY p.fecha DESC\nLIMIT 10;",
          },
          {
            t: 'p',
            c: 'La salida se lee de dentro hacia fuera. Cada línea es un **nodo** con un coste estimado (`cost=0.00..35.50`), el número de filas estimadas (`rows=`) y, con `ANALYZE`, el tiempo real (`actual time=`) y las filas reales.',
          },
          {
            t: 'tabla',
            cabecera: ['Nodo', 'Significado'],
            filas: [
              ['`Seq Scan`', 'Recorre la tabla entera. Normal en tablas pequeñas o filtros poco selectivos.'],
              ['`Index Scan`', 'Usa un índice y luego va a la tabla por cada fila.'],
              ['`Index Only Scan`', 'Todo lo necesario está en el índice: no toca la tabla.'],
              ['`Bitmap Heap Scan`', 'Usa el índice para localizar bloques y luego los lee.'],
              ['`Nested Loop`', 'Para cada fila de una tabla, busca en la otra. Bueno con pocas filas.'],
              ['`Hash Join`', 'Construye una tabla hash y la recorre. Bueno con muchas filas.'],
              ['`Merge Join`', 'Ordena ambas entradas y las fusiona.'],
              ['`Sort`', 'Ordena; si ves `external merge Disk`, se quedó sin memoria.'],
            ],
          },
          { t: 'h', c: 'Estimado frente a real' },
          {
            t: 'p',
            c: 'Si `rows=` estima 10 y `actual rows=` devuelve 10.000, el planificador está trabajando a ciegas: sus estadísticas están desactualizadas. La solución es `ANALYZE tabla;` (o esperar al autovacuum).',
          },
          {
            t: 'sql',
            titulo: 'Actualizar estadísticas',
            c: 'ANALYZE animal;\nANALYZE pesaje;',
          },
          {
            t: 'nota',
            tipo: 'tip',
            titulo: 'Cómo optimizar de verdad',
            c: '1) Mide con `EXPLAIN ANALYZE`. 2) Busca el nodo que se lleva el tiempo. 3) Comprueba si hay un `Seq Scan` sobre una tabla grande con un filtro selectivo: probablemente falte un índice. 4) Vuelve a medir. Nunca optimices "por intuición".',
          },
          {
            t: 'sql',
            titulo: 'Comparar con y sin índice',
            c: "EXPLAIN ANALYZE\nSELECT * FROM animal WHERE lower(numero_arete) = 'a-101';",
          },
          {
            t: 'p',
            c: 'Como existe `uq_animal_arete` sobre `lower(numero_arete) WHERE activo`, PostgreSQL puede usar un `Index Scan` en lugar de recorrer los 80 animales. Cambia la expresión a `upper(numero_arete)` y verás que ya no puede usar ese índice: para el motor, `lower(x)` y `upper(x)` son cosas distintas.',
          },
          {
            t: 'quiz',
            pregunta: '¿Qué significa un `Seq Scan` sobre una tabla de un millón de filas con `WHERE id = 5`?',
            opciones: [
              'Que el índice no existe o no se puede usar; probablemente falte uno',
              'Que es la forma más rápida',
              'Que la consulta es incorrecta',
              'Que hay que reiniciar PostgreSQL',
            ],
            correcta: 0,
            explicacion: 'Con una igualdad sobre la clave primaria debería haber un `Index Scan`. Un `Seq Scan` ahí indica que falta el índice o que las estadísticas están mal.',
          },
        ],
        clave: [
          '`EXPLAIN ANALYZE` ejecuta y muestra tiempos y filas reales.',
          '`Seq Scan` no es malo por sí solo; depende del tamaño y del filtro.',
          'Estimado y real muy distintos = estadísticas desactualizadas.',
        ],
      },
    ],
  }
);
