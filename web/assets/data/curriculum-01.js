/* ==========================================================================
   Currículo · parte 1 — Arranque, fundamentos, filtrado y funciones
   ========================================================================== */
window.CURRICULO = window.CURRICULO || [];

window.CURRICULO.push(
  // =========================================================================
  {
    id: 'm0',
    titulo: 'Antes de empezar',
    emoji: '🌾',
    nivel: 'Introducción',
    resumen: 'Qué es esta hacienda, qué base de datos tienes delante y cómo se usa el curso.',
    lecciones: [
      {
        id: 'm0-l1',
        titulo: 'Bienvenido a la Hacienda Las Piñas',
        minutos: 6,
        intro: 'Un curso de SQL no necesita ejemplos de "clientes" y "pedidos". Aquí vas a trabajar con algo mucho mejor: 80 vacas, 10 potreros, sus pesajes, sus vacunas y sus ventas.',
        bloques: [
          {
            t: 'p',
            c: 'Bienvenido. Esta página es a la vez un **curso** y una **base de datos real** que puedes consultar mientras lees. Todo lo que ves aquí se ejecuta contra una instancia de **PostgreSQL** que vive en tu computadora, con el esquema que está en `esquema_hacienda.sql`.',
          },
          {
            t: 'p',
            c: 'La hacienda tiene 26 tablas que cubren el día a día de un establecimiento ganadero: potreros, grupos de animales, pesajes, sanidad, ventas y cuadres de inventario. No es un juguete: tiene llaves foráneas, restricciones (`CHECK`), índices, vistas y disparadores. Es decir, el mismo tipo de SQL que te vas a encontrar en un trabajo.',
          },
          { t: 'h', c: 'Qué puedes hacer aquí' },
          {
            t: 'lista',
            items: [
              'Leer las **40 lecciones**, de `SELECT` a disparadores y planes de ejecución.',
              'Ejecutar **todos los ejemplos** con un clic, sobre datos reales.',
              'Resolver **80 ejercicios** que se corrigen solos comparando tu resultado con el correcto.',
              'Experimentar libremente en el **laboratorio**, con el esquema a la vista.',
              'Consultar el **modelo de datos** y la **chuleta** cuando necesites recordar algo.',
            ],
          },
          {
            t: 'nota',
            tipo: 'info',
            titulo: 'Los ejercicios se corrigen de verdad',
            c: 'No hay un "texto esperado". Tu consulta se ejecuta en PostgreSQL y el resultado se compara con el de la solución. Puedes llegar a la respuesta por un camino distinto al mío: si el resultado coincide, el ejercicio está bien.',
          },
          { t: 'h', c: 'Mira la hacienda antes de tocar nada' },
          {
            t: 'sql',
            titulo: 'Cuántos animales hay',
            c: 'SELECT count(*) AS animales FROM animal;',
          },
          {
            t: 'p',
            c: 'Pulsa **▶ Ejecutar** y verás la respuesta debajo del código. Ahora mira el resumen de los grupos: es una de las tres vistas que el sistema ya trae hechas.',
          },
          {
            t: 'sql',
            titulo: 'Los grupos y sus potreros',
            c: 'SELECT * FROM v_resumen_grupos;',
          },
          {
            t: 'p',
            c: 'Cada fila es un grupo de animales (paridas, vacas, terneros…), con su potrero y cuántas cabezas tiene. Más adelante, en el módulo de resumen, vas a poder escribir esa consulta tú mismo con `JOIN` y `GROUP BY`.',
          },
          { t: 'h', c: 'Cómo se organiza el curso' },
          {
            t: 'tabla',
            cabecera: ['Parte', 'Qué aprendes'],
            filas: [
              ['Fundamentos y filtrado', 'Leer datos: `SELECT`, `WHERE`, ordenar, valores nulos.'],
              ['Funciones y agregación', 'Transformar valores y resumir tablas enteras.'],
              ['Combinar tablas', '`JOIN`, subconsultas, CTE y funciones de ventana.'],
              ['Escribir y diseñar', '`INSERT`/`UPDATE`/`DELETE`, transacciones, `CREATE TABLE`, normalización.'],
              ['Avanzado y PostgreSQL', 'Índices, planes, vistas, disparadores y el resto del dialecto.'],
            ],
          },
          {
            t: 'nota',
            tipo: 'ojo',
            titulo: 'Puedes romper cosas (y arreglarlo)',
            c: 'En el laboratorio puedes hacer `UPDATE` o `DROP TABLE`. Si algo sale mal, abajo a la izquierda tienes **restablecer datos**: vuelve a cargar el esquema y los datos originales en segundos.',
          },
          {
            t: 'quiz',
            pregunta: '¿Contra qué motor de base de datos se ejecutan los ejemplos?',
            opciones: ['MySQL', 'PostgreSQL', 'SQLite', 'SQL Server'],
            correcta: 1,
            explicacion: 'Todo corre sobre PostgreSQL. Algunas cosas que verás (índices parciales, `FILTER`, `GENERATED ALWAYS AS ... STORED`, disparadores en PL/pgSQL) son específicas de este motor, y las señalamos cuando importa.',
          },
        ],
        clave: [
          'Tienes una base de datos PostgreSQL real con 26 tablas y 80 animales.',
          'Todos los ejemplos y ejercicios se ejecutan contra ella.',
          'Si te pierdes, el laboratorio y la chuleta siempre están a un clic.',
        ],
      },
    ],
  },

  // =========================================================================
  {
    id: 'm1',
    titulo: 'Fundamentos de SQL',
    emoji: '🧱',
    nivel: 'Principiante',
    resumen: 'Tablas, filas, columnas y las cuatro cosas que hace el 90 % de las consultas.',
    lecciones: [
      {
        id: 'm1-l1',
        titulo: 'Qué es SQL y cómo está organizado',
        minutos: 9,
        intro: 'SQL no es un lenguaje de programación como los demás: es un lenguaje declarativo. Tú describes el resultado que quieres y el motor decide cómo obtenerlo.',
        bloques: [
          {
            t: 'p',
            c: 'En un lenguaje imperativo le dices a la computadora **cómo** hacer algo: recorre esta lista, guarda un contador, compara. En SQL le dices **qué** quieres: "dame los animales que pesan más de 400 kilos". El planificador de PostgreSQL decide cómo leer las tablas, qué índices usar y en qué orden.',
          },
          {
            t: 'p',
            c: 'Ese cambio de mentalidad es la primera dificultad del curso. Al principio escribirás consultas de una línea y pensarás "esto es demasiado fácil". Después, cuando combines cinco tablas y calcules un promedio por grupo, verás por qué SQL tiene la fama que tiene.',
          },
          { t: 'h', c: 'Tablas, filas y columnas' },
          {
            t: 'p',
            c: 'Una **tabla** es una hoja de cálculo con nombre y reglas. Cada **columna** tiene un tipo fijo (`integer`, `text`, `date`…). Cada **fila** es un registro. En la tabla `animal` cada fila es una vaca, y las columnas son su arete, su raza, su fecha de nacimiento…',
          },
          {
            t: 'tabla',
            cabecera: ['id', 'numero_arete', 'nombre', 'sexo', 'estado'],
            filas: [
              ['1', 'A-101', 'Pequeña', 'H', 'Activo'],
              ['2', 'A-102', 'Canela', 'H', 'Activo'],
              ['3', 'A-103', 'Vainilla', 'H', 'Activo'],
              ['…', '…', '…', '…', '…'],
            ],
          },
          {
            t: 'nota',
            tipo: 'info',
            titulo: 'Una fila no tiene orden',
            c: 'A diferencia de una hoja de cálculo, una tabla **no** tiene filas "en orden". Si necesitas un orden concreto, lo pides con `ORDER BY`. El motor puede devolverte las filas como le convenga.',
          },
          { t: 'h', c: 'Las familias de sentencias' },
          {
            t: 'tabla',
            cabecera: ['Familia', 'Para qué', 'Órdenes'],
            filas: [
              ['DQL / DML de lectura', 'Leer datos', '`SELECT`'],
              ['DML', 'Modificar datos', '`INSERT`, `UPDATE`, `DELETE`'],
              ['DDL', 'Definir la estructura', '`CREATE`, `ALTER`, `DROP`'],
              ['DCL', 'Permisos', '`GRANT`, `REVOKE`'],
              ['TCL', 'Transacciones', '`BEGIN`, `COMMIT`, `ROLLBACK`'],
            ],
          },
          {
            t: 'p',
            c: 'En este curso verás las cinco familias. El 80 % del tiempo de trabajo real, sin embargo, se va en `SELECT`.',
          },
          { t: 'h', c: 'Conoce el catálogo más pequeño' },
          {
            t: 'sql',
            titulo: 'Las cuatro razas del hato',
            c: 'SELECT id, nombre, activo\nFROM raza\nORDER BY id;',
          },
          {
            t: 'p',
            c: 'Fíjate en la forma: `SELECT` (qué columnas), `FROM` (de qué tabla), `ORDER BY` (en qué orden). Esa estructura te va a acompañar hasta el final del curso.',
          },
          {
            t: 'sql',
            titulo: 'Un animal completo',
            c: "SELECT *\nFROM animal\nWHERE numero_arete = 'A-101';",
          },
          {
            t: 'p',
            c: 'El `*` significa "todas las columnas". En una exploración rápida va bien, pero en consultas de verdad conviene nombrar las columnas: es más claro y más rápido.',
          },
          {
            t: 'nota',
            tipo: 'tip',
            titulo: 'Sensible a mayúsculas? Depende',
            c: 'Las **palabras clave** (`SELECT`, `from`, `Order By`) no distinguen mayúsculas. Los **valores de texto** sí: `\'Nelore\'` no es lo mismo que `\'nelore\'`. Y los identificadores sin comillas se guardan en minúsculas, así que `FROM Animal` funciona y `FROM "Animal"` no.',
          },
          {
            t: 'quiz',
            pregunta: '¿Qué sentencia usarías para cambiar el nombre de un grupo de animales?',
            opciones: ['`SELECT`', '`UPDATE`', '`ALTER`', '`CREATE`'],
            correcta: 1,
            explicacion: 'Cambiar el **contenido** de una fila es DML: `UPDATE grupo SET nombre = ...`. `ALTER` cambiaría la **estructura** de la tabla, no los datos.',
          },
        ],
        clave: [
          'SQL es declarativo: describes el resultado, no el procedimiento.',
          'Tabla = filas + columnas con tipos; el orden de las filas no existe hasta que lo pides.',
          '`SELECT` para leer, `INSERT`/`UPDATE`/`DELETE` para escribir, `CREATE`/`ALTER`/`DROP` para estructurar.',
        ],
      },
      {
        id: 'm1-l2',
        titulo: 'Tu primera consulta: SELECT y FROM',
        minutos: 8,
        intro: 'SELECT decide qué columnas ves; FROM decide de dónde salen. Nada más. Y con eso ya puedes responder preguntas.',
        bloques: [
          {
            t: 'p',
            c: 'La forma mínima de una consulta es `SELECT columnas FROM tabla`. Las columnas se separan con comas y el orden en que las escribes es el orden en que aparecen en el resultado.',
          },
          {
            t: 'sql',
            titulo: 'Tres columnas de una tabla',
            c: 'SELECT numero_arete, nombre, sexo\nFROM animal;',
          },
          {
            t: 'p',
            c: 'Salen 80 filas (los 80 animales del hato, incluidos los vendidos y los muertos). En la lección de `ORDER BY` y `LIMIT` aprenderás a recortar esa lista.',
          },
          {
            t: 'sql',
            titulo: 'Columnas en otro orden',
            c: 'SELECT sexo, numero_arete, nombre\nFROM animal;',
          },
          {
            t: 'nota',
            tipo: 'ojo',
            titulo: '`SELECT *` en producción',
            c: 'Funciona, pero es una mala costumbre: si mañana alguien añade una columna `comentario` de 2 KB, todas tus consultas la traerán sin necesidad. Nombra las columnas que necesitas.',
          },
          { t: 'h', c: 'La coma que todo lo rompe' },
          {
            t: 'p',
            c: 'Una coma de más o de menos es el error de sintaxis número uno. PostgreSQL te dirá `syntax error at or near ...` y te señalará la posición. Compara estas dos:',
          },
          {
            t: 'tabla',
            cabecera: ['Correcto', 'Incorrecto'],
            filas: [
              ['`SELECT numero_arete, nombre`', '`SELECT numero_arete nombre,`'],
              ['`SELECT numero_arete,` (y `nombre` en la línea siguiente)', '`SELECT numero_arete nombre` (sin coma: es un alias)'],
            ],
          },
          {
            t: 'p',
            c: 'Ojo con el segundo caso: si olvidas la coma entre dos columnas, PostgreSQL no da error, interpreta la segunda como un **alias** de la primera. Es un error silencioso muy común.',
          },
          {
            t: 'sql',
            titulo: 'Error silencioso: alias accidental',
            c: 'SELECT numero_arete nombre\nFROM animal;',
          },
          {
            t: 'p',
            c: 'Devuelve una sola columna llamada `nombre` con los aretes dentro. Nada de lo que querías, y sin ningún error.',
          },
          { t: 'h', c: 'Preguntas de negocio' },
          {
            t: 'p',
            c: 'Ya puedes responder cosas útiles. Por ejemplo: ¿qué potreros tiene la hacienda y cuántas hectáreas son?',
          },
          {
            t: 'sql',
            titulo: 'Inventario de potreros',
            c: 'SELECT codigo, hectareas, cantidad_atajados, comentario\nFROM potrero;',
          },
          {
            t: 'quiz',
            pregunta: '¿Qué devuelve `SELECT nombre, id FROM raza;`?',
            opciones: [
              'Las columnas en el orden en que están definidas en la tabla',
              'La columna `nombre` y luego la columna `id`',
              'Un error: el `id` siempre va primero',
              'Todas las columnas de `raza`',
            ],
            correcta: 1,
            explicacion: 'El orden del resultado lo decide tu `SELECT`, no la definición de la tabla.',
          },
        ],
        clave: [
          '`SELECT` lista las columnas; `FROM` la tabla.',
          'El orden de las columnas en la salida es el de tu `SELECT`.',
          'Una coma olvidada se convierte en un alias silencioso: revisa siempre.',
        ],
      },
      {
        id: 'm1-l3',
        titulo: 'Columnas calculadas, alias y DISTINCT',
        minutos: 9,
        intro: 'Una consulta no solo copia columnas: puede calcular otras nuevas. Y los alias les ponen nombre.',
        bloques: [
          {
            t: 'p',
            c: 'Puedes usar operadores aritméticos (`+`, `-`, `*`, `/`) y funciones directamente en la lista de columnas. El resultado aparece como una columna más.',
          },
          {
            t: 'sql',
            titulo: 'Hectáreas en metros cuadrados',
            c: 'SELECT codigo,\n       hectareas,\n       hectareas * 10000 AS metros_cuadrados\nFROM potrero\nORDER BY hectareas DESC;',
          },
          {
            t: 'p',
            c: '`AS` nombra la columna resultante. Sin `AS` también funciona (`hectareas * 10000 metros_cuadrados`), pero es más legible con él. Si el alias lleva espacios o mayúsculas, va entre comillas dobles.',
          },
          {
            t: 'nota',
            tipo: 'info',
            titulo: 'El alias solo existe en la salida',
            c: 'No puedes usar un alias en `WHERE` para filtrar por él, porque `WHERE` se evalúa antes que la lista de columnas. Sí puedes usarlo en `ORDER BY`.',
          },
          { t: 'h', c: 'DISTINCT: quitar repetidos' },
          {
            t: 'p',
            c: '`SELECT DISTINCT` devuelve cada combinación de valores una sola vez. Sirve para hacerse una idea de qué valores existen.',
          },
          {
            t: 'sql',
            titulo: '¿Cuántos sexos hay registrados?',
            c: 'SELECT DISTINCT sexo\nFROM animal;',
          },
          {
            t: 'sql',
            titulo: 'Combinaciones distintas de origen y estado',
            c: 'SELECT DISTINCT origen, estado\nFROM animal\nORDER BY origen, estado;',
          },
          {
            t: 'p',
            c: 'Con dos columnas, `DISTINCT` se aplica al **par** de valores, no a cada columna por separado: `(Nacimiento, Activo)`, `(Compra, Vendido)`… Si quieres contar cuántas filas hay de cada combinación, eso ya es `GROUP BY`, que viene más adelante.',
          },
          {
            t: 'nota',
            tipo: 'ojo',
            titulo: 'DISTINCT no es un corrector de duplicados',
            c: 'Si tu consulta devuelve filas repetidas que no deberían estar ahí, `DISTINCT` las esconde. Casi siempre el problema real es un `JOIN` mal planteado. Úsalo cuando quieras saber qué valores existen, no para tapar un error.',
          },
          { t: 'h', c: 'Precedencia aritmética' },
          {
            t: 'p',
            c: '`*` y `/` se evalúan antes que `+` y `-`; los paréntesis mandan. Y cuidado con la división de enteros: `7 / 2` da `3`, no `3.5`.',
          },
          {
            t: 'sql',
            titulo: 'División entera frente a decimal',
            c: 'SELECT 7 / 2            AS entero,\n       7::numeric / 2  AS decimal,\n       7 % 2           AS resto;',
          },
          {
            t: 'quiz',
            pregunta: '¿Qué devuelve `SELECT 10 / 4;` en PostgreSQL?',
            opciones: ['2.5', '2', '3', 'Error'],
            correcta: 1,
            explicacion: 'Ambos son enteros, así que la división es entera: `2`. Para obtener `2.5` necesitas que al menos uno sea decimal: `10::numeric / 4` o `10 / 4.0`.',
          },
        ],
        clave: [
          'Puedes calcular columnas nuevas con operadores y funciones.',
          '`AS` da nombre a la columna resultante (y no se puede usar en `WHERE`).',
          '`DISTINCT` elimina filas repetidas; `7 / 2` es `3` en enteros.',
        ],
      },
      {
        id: 'm1-l4',
        titulo: 'Ordenar y recortar: ORDER BY, LIMIT, OFFSET',
        minutos: 10,
        intro: 'Sin ORDER BY no hay orden garantizado. Con LIMIT y OFFSET puedes quedarte con el principio, el final o una página intermedia.',
        bloques: [
          {
            t: 'p',
            c: '`ORDER BY` ordena el resultado. Puede ser ascendente (`ASC`, por defecto) o descendente (`DESC`), y puedes ordenar por varias columnas: la segunda desempata a la primera.',
          },
          {
            t: 'sql',
            titulo: 'Los potreros más grandes primero',
            c: 'SELECT codigo, hectareas\nFROM potrero\nORDER BY hectareas DESC;',
          },
          {
            t: 'sql',
            titulo: 'Dos criterios de orden',
            c: 'SELECT nombre, sexo, fecha_ingreso\nFROM animal\nORDER BY sexo ASC, fecha_ingreso DESC;',
          },
          {
            t: 'p',
            c: 'También puedes ordenar por una columna que no aparece en el `SELECT`, por un alias, o por posición (`ORDER BY 2` = segunda columna de la salida). Ordenar por posición se entiende mal rápido: mejor el nombre.',
          },
          { t: 'h', c: 'Recortar resultados' },
          {
            t: 'p',
            c: '`LIMIT n` devuelve como máximo `n` filas. `OFFSET m` se salta las `m` primeras. Juntos sirven para paginar.',
          },
          {
            t: 'sql',
            titulo: 'Los 5 animales más pesados al ingresar',
            c: 'SELECT numero_arete, nombre, peso_inicial_kg\nFROM animal\nWHERE origen = \'Compra\'\nORDER BY peso_inicial_kg DESC\nLIMIT 5;',
          },
          {
            t: 'nota',
            tipo: 'ojo',
            titulo: 'LIMIT sin ORDER BY es una trampa',
            c: '`SELECT ... LIMIT 5` sin `ORDER BY` devuelve cinco filas **cualesquiera**. Hoy pueden ser unas y mañana otras. Si el resultado importa, ordena siempre.',
          },
          {
            t: 'sql',
            titulo: 'Página 2: saltar 10 y traer 10',
            c: 'SELECT numero_arete, nombre\nFROM animal\nORDER BY numero_arete\nLIMIT 10 OFFSET 10;',
          },
          {
            t: 'p',
            c: 'La paginación con `OFFSET` se vuelve lenta en tablas enormes (el motor tiene que leer y descartar todo lo anterior). En el módulo de índices verás la alternativa profesional: la paginación por cursor.',
          },
          { t: 'h', c: 'Dónde van las cláusulas' },
          {
            t: 'p',
            c: 'El orden de escritura es fijo. Si te equivocas, PostgreSQL te lo dirá con un error de sintaxis.',
          },
          {
            t: 'tabla',
            cabecera: ['Orden', 'Cláusula', 'Qué hace'],
            filas: [
              ['1', '`SELECT`', 'Qué columnas'],
              ['2', '`FROM`', 'De qué tablas'],
              ['3', '`WHERE`', 'Qué filas'],
              ['4', '`GROUP BY`', 'Cómo agrupar'],
              ['5', '`HAVING`', 'Qué grupos'],
              ['6', '`ORDER BY`', 'En qué orden'],
              ['7', '`LIMIT` / `OFFSET`', 'Cuántas filas'],
            ],
          },
          {
            t: 'nota',
            tipo: 'tip',
            titulo: 'El orden de escritura no es el orden de ejecución',
            c: 'Aunque escribas `SELECT` primero, el motor evalúa `FROM`, luego `WHERE`, luego `GROUP BY`… y `SELECT` casi al final. Por eso un alias de `SELECT` no existe todavía en `WHERE`.',
          },
          {
            t: 'quiz',
            pregunta: 'Quieres los 3 potreros con menos hectáreas. ¿Cuál es la consulta correcta?',
            opciones: [
              '`SELECT codigo FROM potrero LIMIT 3 ORDER BY hectareas;`',
              '`SELECT codigo FROM potrero ORDER BY hectareas ASC LIMIT 3;`',
              '`SELECT codigo FROM potrero ORDER BY hectareas DESC LIMIT 3;`',
              '`SELECT TOP 3 codigo FROM potrero ORDER BY hectareas;`',
            ],
            correcta: 1,
            explicacion: 'Orden ascendente (el más pequeño primero) y luego recortar. `LIMIT` va siempre al final, y `TOP` es de SQL Server.',
          },
        ],
        clave: [
          '`ORDER BY columna ASC|DESC`, con varias columnas si hace falta desempatar.',
          '`LIMIT` recorta y `OFFSET` salta; sin `ORDER BY` no hay garantía de nada.',
          'El orden de escritura de las cláusulas es fijo y no coincide con el de ejecución.',
        ],
      },
    ],
  },

  // =========================================================================
  {
    id: 'm2',
    titulo: 'Filtrar filas',
    emoji: '🔎',
    nivel: 'Principiante',
    resumen: 'WHERE, operadores lógicos, patrones de texto y el escurridizo NULL.',
    lecciones: [
      {
        id: 'm2-l1',
        titulo: 'WHERE: quedarse con lo que importa',
        minutos: 8,
        intro: 'WHERE evalúa una condición fila por fila y solo deja pasar las que dan verdadero.',
        bloques: [
          {
            t: 'p',
            c: 'La condición se escribe después de `FROM` y puede usar cualquier columna de las tablas implicadas. Los operadores básicos son `=`, `<>` (o `!=`), `<`, `>`, `<=`, `>=`.',
          },
          {
            t: 'sql',
            titulo: 'Solo los animales activos',
            c: "SELECT numero_arete, nombre, estado\nFROM animal\nWHERE estado = 'Activo'\nORDER BY numero_arete;",
          },
          {
            t: 'p',
            c: 'Los textos van entre **comillas simples**. Las comillas dobles son para identificadores (nombres de tabla o columna), no para valores. Este es el error número uno de quien viene de otros lenguajes.',
          },
          {
            t: 'sql',
            titulo: 'Comparar números y fechas',
            c: "SELECT codigo, hectareas\nFROM potrero\nWHERE hectareas > 40\nORDER BY hectareas DESC;",
          },
          {
            t: 'sql',
            titulo: 'Fechas: comparar contra un literal',
            c: "SELECT numero_arete, fecha_ingreso\nFROM animal\nWHERE fecha_ingreso >= DATE '2026-01-01'\nORDER BY fecha_ingreso;",
          },
          {
            t: 'p',
            c: 'La forma `DATE \'2026-01-01\'` es un literal tipado y evita ambigüedades. También funciona `\'2026-01-01\'::date`.',
          },
          {
            t: 'nota',
            tipo: 'ojo',
            titulo: 'Comparar contra NULL no funciona',
            c: '`WHERE nombre = NULL` no devuelve nada, ni siquiera las filas con nombre nulo. Para eso existe `IS NULL`, que verás en la lección sobre valores nulos.',
          },
          { t: 'h', c: 'Combinar condiciones' },
          {
            t: 'p',
            c: 'Con `AND` y `OR` puedes encadenar condiciones. `AND` exige que se cumplan todas; `OR`, al menos una. En la próxima lección los desmenuzamos.',
          },
          {
            t: 'sql',
            titulo: 'Hembras activas compradas',
            c: "SELECT numero_arete, sexo, origen, procedencia\nFROM animal\nWHERE sexo = 'H'\n  AND estado = 'Activo'\n  AND origen = 'Compra';",
          },
          {
            t: 'quiz',
            pregunta: '¿Cuál de estas condiciones es incorrecta?',
            opciones: [
              "`WHERE nombre = 'Canela'`",
              '`WHERE peso_kg > 300`',
              "`WHERE 300 < peso_kg`",
              '`WHERE nombre = "Canela"`',
            ],
            correcta: 3,
            explicacion: 'Las comillas dobles buscan una **columna** llamada `Canela`, que no existe. Los valores de texto van siempre entre comillas simples.',
          },
        ],
        clave: [
          '`WHERE` filtra filas; se escribe después de `FROM`.',
          'Textos con comillas simples; fechas con `DATE \'...\'` o `::date`.',
          'Puedes comparar en cualquier sentido: `300 < peso_kg` es válido.',
        ],
      },
      {
        id: 'm2-l2',
        titulo: 'AND, OR, NOT y el orden de evaluación',
        minutos: 9,
        intro: 'AND se evalúa antes que OR. Eso convierte una condición aparentemente inocente en un resultado incorrecto.',
        bloques: [
          {
            t: 'p',
            c: 'La precedencia es la de las matemáticas: `NOT` primero, luego `AND`, luego `OR`. Cuando mezclas `AND` y `OR`, los paréntesis dejan de ser opcionales.',
          },
          {
            t: 'p',
            c: 'Supón que quieres "animales que son toros **o** vacas que están en el potrero 4". Escrito sin paréntesis:',
          },
          {
            t: 'sql',
            titulo: 'Sin paréntesis: probablemente no es lo que quieres',
            c: "SELECT numero_arete, sexo, id_grupo\nFROM animal\nWHERE sexo = 'H' OR sexo = 'M' AND id_grupo = 4;",
          },
          {
            t: 'p',
            c: 'Como `AND` gana, la condición real es `sexo = \'H\' OR (sexo = \'M\' AND id_grupo = 4)`: **todas** las hembras, estén donde estén. Los paréntesis arreglan la intención:',
          },
          {
            t: 'sql',
            titulo: 'Con paréntesis: la condición correcta',
            c: "SELECT numero_arete, sexo, id_grupo\nFROM animal\nWHERE (sexo = 'H' OR sexo = 'M') AND id_grupo = 4\nORDER BY numero_arete;",
          },
          {
            t: 'nota',
            tipo: 'tip',
            titulo: 'Regla de oro',
            c: 'Si tu `WHERE` mezcla `AND` y `OR`, ponle paréntesis a cada bloque lógico. No cuesta nada y evita errores silenciosos.',
          },
          { t: 'h', c: 'NOT' },
          {
            t: 'p',
            c: '`NOT` invierte una condición. Se usa poco porque casi siempre se puede escribir de forma más clara con el operador contrario. `NOT (estado = \'Activo\')` es lo mismo que `estado <> \'Activo\'`.',
          },
          {
            t: 'sql',
            titulo: 'Negar una condición compuesta',
            c: "SELECT numero_arete, estado, origen\nFROM animal\nWHERE NOT (origen = 'Compra' AND estado = 'Activo')\nORDER BY numero_arete;",
          },
          {
            t: 'p',
            c: 'Ojo: `NOT` aplica a todo lo que hay dentro del paréntesis, no a la primera condición solamente. Esa es otra razón para usar paréntesis siempre.',
          },
          { t: 'h', c: 'Condiciones redundantes' },
          {
            t: 'p',
            c: 'Si filtras `estado = \'Activo\'` en la tabla `animal`, la columna `activo` (booleana) ya es verdadera para esos registros en el 99 % de los casos, pero no es lo mismo: `estado` describe el ciclo de vida del animal y `activo` marca el borrado lógico del registro. Un animal puede estar `Vendido` y seguir con `activo = true` (para conservar su historial). Confundir las dos columnas es un error de negocio clásico.',
          },
          {
            t: 'sql',
            titulo: 'Estado frente a borrado lógico',
            c: "SELECT estado, activo, count(*)\nFROM animal\nGROUP BY estado, activo\nORDER BY estado;",
          },
          {
            t: 'quiz',
            pregunta: "¿Qué devuelve `WHERE sexo = 'H' AND peso_inicial_kg > 300 OR origen = 'Compra'`?",
            opciones: [
              'Hembras compradas de más de 300 kg',
              'Hembras de más de 300 kg, y además **cualquier** animal comprado',
              'Hembras de más de 300 kg que no fueron compradas',
              'Un error de sintaxis',
            ],
            correcta: 1,
            explicacion: 'Sin paréntesis, la condición es `(sexo = \'H\' AND peso > 300) OR origen = \'Compra\'`. La segunda parte se cumple para todo lo comprado, sin importar el sexo ni el peso.',
          },
        ],
        clave: [
          'Precedencia: `NOT` > `AND` > `OR`.',
          'Con `AND` y `OR` juntos, usa paréntesis siempre.',
          '`NOT (a AND b)` no es lo mismo que `NOT a AND b`.',
        ],
      },
      {
        id: 'm2-l3',
        titulo: 'IN, BETWEEN, LIKE e ILIKE',
        minutos: 9,
        intro: 'Tres atajos para escribir condiciones más cortas y una forma de buscar dentro del texto.',
        bloques: [
          { t: 'h', c: 'IN: una lista de valores' },
          {
            t: 'p',
            c: '`IN (a, b, c)` equivale a `= a OR = b OR = c`, pero se lee mucho mejor y no tiene problemas de precedencia.',
          },
          {
            t: 'sql',
            titulo: 'Animales en tres razas concretas',
            c: 'SELECT numero_arete, id_raza, nombre\nFROM animal\nWHERE id_raza IN (1, 2)\nORDER BY id_raza, numero_arete;',
          },
          {
            t: 'p',
            c: '`NOT IN` excluye la lista. Cuidado: si la lista contiene un `NULL`, `NOT IN` no devuelve **ninguna** fila, porque `x <> NULL` es `NULL` (desconocido) y no verdadero.',
          },
          { t: 'h', c: 'BETWEEN: un rango cerrado' },
          {
            t: 'p',
            c: '`BETWEEN a AND b` incluye los dos extremos. Funciona con números, fechas y texto.',
          },
          {
            t: 'sql',
            titulo: 'Pesajes de un rango de kilos',
            c: 'SELECT id_animal, fecha, peso_kg\nFROM pesaje\nWHERE peso_kg BETWEEN 300 AND 320\nORDER BY peso_kg DESC\nLIMIT 15;',
          },
          {
            t: 'nota',
            tipo: 'ojo',
            titulo: 'Fechas y BETWEEN',
            c: '`BETWEEN \'2026-01-01\' AND \'2026-12-31\'` sobre una columna `date` funciona. Sobre una columna `timestamp` deja fuera las 23:59:59.5 del último día. En ese caso es mejor `>= inicio AND < dia_siguiente`.',
          },
          { t: 'h', c: 'LIKE: buscar dentro del texto' },
          {
            t: 'p',
            c: '`LIKE` compara con un patrón donde `%` significa "cualquier cosa" (incluida nada) y `_` significa "exactamente un carácter". `ILIKE` es igual pero sin distinguir mayúsculas.',
          },
          {
            t: 'tabla',
            cabecera: ['Patrón', 'Encuentra'],
            filas: [
              ['`\'La%\'`', 'Todo lo que empieza por "La"'],
              ['`\'%ito\'`', 'Todo lo que termina en "ito"'],
              ['`\'%n%\'`', 'Todo lo que contiene una "n"'],
              ['`\'A-1__\'`', 'Cuatro caracteres: "A-1" y dos cualesquiera'],
            ],
          },
          {
            t: 'sql',
            titulo: 'Nombres que empiezan por "La"',
            c: "SELECT numero_arete, nombre\nFROM animal\nWHERE nombre LIKE 'La%'\nORDER BY nombre;",
          },
          {
            t: 'sql',
            titulo: 'Buscar sin distinguir mayúsculas',
            c: "SELECT nombre, procedencia\nFROM animal\nWHERE procedencia ILIKE '%feria%';",
          },
          {
            t: 'nota',
            tipo: 'tip',
            titulo: 'LIKE y los índices',
            c: 'Un patrón que empieza por `%` no puede usar un índice normal: el motor tiene que revisar todas las filas. Si necesitas búsquedas de texto serias, PostgreSQL tiene índices de texto completo y `pg_trgm`. Lo verás en el módulo de rendimiento.',
          },
          {
            t: 'quiz',
            pregunta: "¿Qué devuelve `WHERE nombre LIKE 'A%a'`?",
            opciones: [
              'Nombres que son exactamente "Aa"',
              'Nombres que empiezan por A y terminan en a',
              'Nombres que contienen una A y una a',
              'Nada, porque LIKE distingue mayúsculas y no encuentra coincidencias',
            ],
            correcta: 1,
            explicacion: 'El patrón ancla el inicio (`A`) y el final (`a`); el `%` del medio cubre cualquier texto intermedio. Como `LIKE` distingue mayúsculas, "Aurora" entra y "aurora" no.',
          },
        ],
        clave: [
          '`IN` para listas, `BETWEEN` para rangos inclusivos, `LIKE`/`ILIKE` para patrones.',
          '`%` es cualquier texto, `_` es un carácter.',
          'Evita patrones que empiezan por `%` en tablas grandes.',
        ],
      },
      {
        id: 'm2-l4',
        titulo: 'NULL: el valor que no es un valor',
        minutos: 11,
        intro: 'NULL significa "no lo sé" o "no aplica". No es cero, no es cadena vacía, y no es igual a nada, ni siquiera a otro NULL.',
        bloques: [
          {
            t: 'p',
            c: 'En la tabla `animal`, `nombre` puede ser `NULL` (un animal sin nombre), `fecha_nacimiento` es `NULL` para los comprados y `id_madre` es `NULL` para los huérfanos o para los animales que no nacieron en la hacienda. NULL es información ausente, no un valor.',
          },
          {
            t: 'p',
            c: 'La lógica de SQL es de **tres valores**: verdadero, falso y desconocido. Cualquier comparación con NULL da desconocido, y `WHERE` solo deja pasar lo verdadero.',
          },
          {
            t: 'tabla',
            cabecera: ['Expresión', 'Resultado'],
            filas: [
              ['`NULL = NULL`', '`NULL` (desconocido)'],
              ['`NULL <> NULL`', '`NULL` (desconocido)'],
              ['`NULL + 5`', '`NULL`'],
              ['`NULL AND false`', '`false`'],
              ['`NULL OR true`', '`true`'],
              ['`COALESCE(NULL, 0)`', '`0`'],
            ],
          },
          { t: 'h', c: 'IS NULL e IS NOT NULL' },
          {
            t: 'p',
            c: 'Para preguntar por la ausencia de valor se usan estos dos operadores, que sí devuelven verdadero o falso:',
          },
          {
            t: 'sql',
            titulo: 'Compras sin fecha de nacimiento',
            c: 'SELECT numero_arete, origen, fecha_nacimiento, procedencia\nFROM animal\nWHERE fecha_nacimiento IS NULL\nLIMIT 10;',
          },
          {
            t: 'sql',
            titulo: 'Animales con nombre registrado',
            c: 'SELECT count(*) AS con_nombre\nFROM animal\nWHERE nombre IS NOT NULL;',
          },
          {
            t: 'nota',
            tipo: 'error',
            titulo: 'El error clásico',
            c: '`WHERE nombre = NULL` no devuelve **ninguna** fila, y `WHERE nombre <> NULL` tampoco. No es un bug: es la lógica de tres valores. Siempre `IS NULL` / `IS NOT NULL`.',
          },
          { t: 'h', c: 'NULL en funciones y agregados' },
          {
            t: 'p',
            c: 'Casi todas las funciones devuelven NULL si un argumento es NULL. Los agregados (`SUM`, `AVG`, `COUNT(col)`) **ignoran** los NULL, mientras que `COUNT(*)` cuenta filas. Esa diferencia es fundamental y la verás en el módulo de agregación.',
          },
          {
            t: 'sql',
            titulo: 'Contar filas no es contar valores',
            c: 'SELECT count(*)          AS filas,\n       count(nombre)     AS con_nombre,\n       count(*) - count(nombre) AS sin_nombre\nFROM animal;',
          },
          { t: 'h', c: 'NULL y el orden' },
          {
            t: 'p',
            c: 'En PostgreSQL, `ORDER BY` coloca los NULL al final en orden ascendente y al principio en descendente. Puedes forzarlo con `NULLS FIRST` / `NULLS LAST`.',
          },
          {
            t: 'sql',
            titulo: 'Los sin nombre, al final',
            c: 'SELECT numero_arete, nombre\nFROM animal\nORDER BY nombre ASC NULLS LAST\nLIMIT 12;',
          },
          {
            t: 'quiz',
            pregunta: '¿Cuántas filas devuelve `SELECT * FROM animal WHERE id_madre = NULL;`?',
            opciones: ['Todas las que tienen madre', 'Ninguna', 'Todas', 'Un error de sintaxis'],
            correcta: 1,
            explicacion: '`id_madre = NULL` es desconocido para todas las filas, así que el `WHERE` no deja pasar ninguna. Lo correcto es `id_madre IS NULL`.',
          },
        ],
        clave: [
          'NULL no es cero ni cadena vacía: es ausencia de valor.',
          'Se compara con `IS NULL` / `IS NOT NULL`.',
          '`COUNT(col)` ignora NULL; `COUNT(*)` no.',
        ],
      },
    ],
  },

  // =========================================================================
  {
    id: 'm3',
    titulo: 'Funciones y tipos',
    emoji: '🧪',
    nivel: 'Principiante',
    resumen: 'Transformar texto, números y fechas, y tomar decisiones con CASE.',
    lecciones: [
      {
        id: 'm3-l1',
        titulo: 'Texto y números: las funciones del día a día',
        minutos: 10,
        intro: 'La mitad del trabajo real con SQL es limpiar y dar formato a los datos. Estas funciones son las que más vas a usar.',
        bloques: [
          { t: 'h', c: 'Texto' },
          {
            t: 'tabla',
            cabecera: ['Función', 'Qué hace', 'Ejemplo'],
            filas: [
              ['`||` o `concat()`', 'Concatenar', "`nombre || ' (' || numero_arete || ')'`"],
              ['`upper()`, `lower()`', 'Mayúsculas / minúsculas', '`upper(nombre)`'],
              ['`trim()`, `ltrim()`, `rtrim()`', 'Quitar espacios', '`trim(procedencia)`'],
              ['`length()`', 'Número de caracteres', '`length(nombre)`'],
              ['`substring(texto, ini, n)`', 'Cortar', '`substring(numero_arete, 3, 3)`'],
              ['`replace(t, viejo, nuevo)`', 'Sustituir', '`replace(nombre, \'La \', \'\')`'],
              ['`position(aguja in pajar)`', 'Posición de una subcadena', '`position(\'a\' in lower(nombre))`'],
              ['`initcap()`', 'Primera letra en mayúscula', '`initcap(\'juan perez\')`'],
            ],
          },
          {
            t: 'sql',
            titulo: 'Un identificador legible',
            c: "SELECT a.numero_arete || ' · ' || coalesce(a.nombre, 'sin nombre') AS ficha,\n       upper(r.nombre) AS raza,\n       length(coalesce(a.nombre, '')) AS largo_nombre\nFROM animal a\nJOIN raza r ON r.id = a.id_raza\nORDER BY a.numero_arete\nLIMIT 8;",
          },
          {
            t: 'nota',
            tipo: 'ojo',
            titulo: 'Concatenar con NULL',
            c: '`\'a\' || NULL` da `NULL`, no `\'a\'`. Si una columna puede ser nula, envuélvela en `coalesce(columna, \'\')`.',
          },
          { t: 'h', c: 'Números' },
          {
            t: 'tabla',
            cabecera: ['Función', 'Qué hace'],
            filas: [
              ['`round(x, n)`', 'Redondear a `n` decimales'],
              ['`ceil(x)` / `floor(x)`', 'Techo / suelo'],
              ['`abs(x)`', 'Valor absoluto'],
              ['`mod(a, b)` o `a % b`', 'Resto de la división'],
              ['`power(a, b)`', 'Potencia'],
              ['`sqrt(x)`', 'Raíz cuadrada'],
            ],
          },
          {
            t: 'sql',
            titulo: 'Redondeos y porcentajes',
            c: 'SELECT codigo,\n       hectareas,\n       round(hectareas * 0.35, 1) AS reserva_35pct,\n       ceil(hectareas / 2)          AS mitad_hacia_arriba\nFROM potrero\nORDER BY hectareas DESC;',
          },
          {
            t: 'p',
            c: 'El resultado de una operación entre enteros es entero; si quieres decimales, convierte alguno con `::numeric`. Y ojo con `round()` sobre `double precision`: para dinero usa siempre `numeric`.',
          },
          {
            t: 'sql',
            titulo: 'Entero frente a decimal',
            c: 'SELECT 10 / 3 AS entero,\n       10::numeric / 3 AS decimal,\n       round(10::numeric / 3, 2) AS dos_decimales;',
          },
          {
            t: 'quiz',
            pregunta: "¿Qué devuelve `SELECT 'A-101' || NULL;`?",
            opciones: ["'A-101'", 'NULL', "''", 'Un error'],
            correcta: 1,
            explicacion: 'Concatenar cualquier cosa con NULL da NULL. Usa `coalesce` si quieres un texto por defecto.',
          },
        ],
        clave: [
          'Concatena con `||` (y protege los NULL con `coalesce`).',
          '`round`, `ceil`, `floor` para números; `::numeric` para evitar la división entera.',
          '`upper`, `lower`, `trim`, `length`, `substring`, `replace` cubren casi todo el texto.',
        ],
      },
      {
        id: 'm3-l2',
        titulo: 'Fechas: edades, diferencias y truncados',
        minutos: 10,
        intro: 'Una hacienda vive de fechas: nacimientos, pesajes, vacunas, ventas. Saber restar fechas es saber leer el negocio.',
        bloques: [
          {
            t: 'p',
            c: 'PostgreSQL tiene un tipo `date` (solo fecha), `timestamp` (fecha y hora) y `timestamptz` (con zona horaria). En el esquema conviven: `fecha_ingreso` es `date`, `fecha_baja` es `timestamptz`.',
          },
          {
            t: 'sql',
            titulo: 'Hoy y dentro de un mes',
            c: "SELECT current_date                        AS hoy,\n       current_date + 30                   AS en_30_dias,\n       current_date - interval '1 year'    AS hace_un_ano,\n       age(current_date, DATE '2024-03-15') AS diferencia;",
          },
          {
            t: 'p',
            c: '`age(fin, inicio)` devuelve un intervalo "humano": "2 años 8 mons 6 días". Es la forma más legible de calcular una edad.',
          },
          {
            t: 'sql',
            titulo: 'Edad de cada animal nacido en la hacienda',
            c: "SELECT numero_arete,\n       fecha_nacimiento,\n       age(current_date, fecha_nacimiento) AS edad\nFROM animal\nWHERE fecha_nacimiento IS NOT NULL\nORDER BY fecha_nacimiento\nLIMIT 10;",
          },
          { t: 'h', c: 'Extraer partes' },
          {
            t: 'p',
            c: '`date_part(\'year\', intervalo)` o `extract(year from fecha)` sacan un componente. Con eso puedes calcular la edad en meses, que es lo que hace la vista `v_kardex`.',
          },
          {
            t: 'sql',
            titulo: 'Edad en meses, como en v_kardex',
            c: "SELECT numero_arete,\n       date_part('year', age(current_date, fecha_nacimiento)) * 12\n       + date_part('month', age(current_date, fecha_nacimiento)) AS edad_meses\nFROM animal\nWHERE fecha_nacimiento IS NOT NULL\nORDER BY edad_meses DESC\nLIMIT 8;",
          },
          {
            t: 'p',
            c: 'Ese cálculo aparece tal cual en la vista `v_kardex` del esquema. No es un truco de curso: es SQL de producción.',
          },
          { t: 'h', c: 'Truncar para agrupar' },
          {
            t: 'p',
            c: '`date_trunc(\'month\', fecha)` convierte cualquier fecha en el primer día de su mes. Es la herramienta para hacer informes mensuales.',
          },
          {
            t: 'sql',
            titulo: 'Pesajes por mes',
            c: "SELECT date_trunc('month', fecha)::date AS mes,\n       count(*) AS pesajes,\n       round(avg(peso_kg), 1) AS peso_promedio\nFROM pesaje\nGROUP BY 1\nORDER BY 1;",
          },
          {
            t: 'nota',
            tipo: 'info',
            titulo: 'Por qué date_trunc y no substring',
            c: 'Podrías cortar el año con `substring(fecha::text, 1, 7)`, pero es frágil y lento. `date_trunc` trabaja con el tipo fecha y permite agrupar correctamente aunque cambie el formato de salida.',
          },
          {
            t: 'quiz',
            pregunta: '¿Cuál calcula correctamente la edad en años de un animal?',
            opciones: [
              '`fecha_nacimiento - current_date`',
              "`date_part('year', age(current_date, fecha_nacimiento))`",
              "`extract(year from current_date) - extract(year from fecha_nacimiento)`",
              '`current_date + fecha_nacimiento`',
            ],
            correcta: 1,
            explicacion: 'La tercera opción falla si el animal aún no ha cumplido años este año: restar los años del calendario no es restar edades.',
          },
        ],
        clave: [
          '`current_date`, `age()`, `date_part()`/`extract()` y `date_trunc()` son el kit básico.',
          'Suma y resta intervalos: `+ interval \'30 days\'`.',
          '`date_trunc` es la base de todos los informes por mes.',
        ],
      },
      {
        id: 'm3-l3',
        titulo: 'CASE, COALESCE y NULLIF: decisiones y valores por defecto',
        minutos: 11,
        intro: 'CASE es el if/else de SQL; COALESCE elige el primer valor que existe. Juntos convierten datos crudos en información.',
        bloques: [
          { t: 'h', c: 'CASE' },
          {
            t: 'p',
            c: 'Hay dos formas. La **simple** compara una expresión contra varios valores; la **buscada** evalúa condiciones completas (mucho más flexible).',
          },
          {
            t: 'sql',
            titulo: 'Clasificar animales por edad',
            c: "SELECT numero_arete,\n       fecha_nacimiento,\n       CASE\n         WHEN fecha_nacimiento IS NULL THEN 'Sin dato'\n         WHEN age(current_date, fecha_nacimiento) < interval '1 year'  THEN 'Ternero'\n         WHEN age(current_date, fecha_nacimiento) < interval '2 years' THEN 'Novillo'\n         WHEN age(current_date, fecha_nacimiento) < interval '4 years' THEN 'Joven'\n         ELSE 'Adulto'\n       END AS categoria\nFROM animal\nORDER BY numero_arete\nLIMIT 12;",
          },
          {
            t: 'p',
            c: 'CASE evalúa las ramas en orden y se detiene en la primera que se cumple. El `ELSE` es opcional, pero si lo omites y ninguna rama coincide, el resultado es `NULL`.',
          },
          {
            t: 'sql',
            titulo: 'CASE simple con valores exactos',
            c: "SELECT sexo,\n       CASE sexo WHEN 'M' THEN 'Macho' WHEN 'H' THEN 'Hembra' END AS sexo_largo,\n       count(*) AS cuantos\nFROM animal\nGROUP BY sexo\nORDER BY sexo;",
          },
          { t: 'h', c: 'COALESCE: el primero que no sea NULL' },
          {
            t: 'p',
            c: '`coalesce(a, b, c)` devuelve el primer argumento que no sea NULL. Es la forma idiomática de poner un valor por defecto.',
          },
          {
            t: 'sql',
            titulo: 'Nombre o, si no hay, el arete',
            c: "SELECT coalesce(nombre, numero_arete) AS como_llamarlo,\n       coalesce(procedencia, 'Nacido en la hacienda') AS de_donde\nFROM animal\nORDER BY numero_arete\nLIMIT 10;",
          },
          {
            t: 'p',
            c: 'La vista `v_kardex` usa `COALESCE` con tres alternativas para el peso: último pesaje, peso inicial de compra, peso al nacer. Es exactamente el patrón que acabas de ver.',
          },
          { t: 'h', c: 'NULLIF: convertir un valor en NULL' },
          {
            t: 'p',
            c: '`nullif(a, b)` devuelve NULL si `a = b`; si no, devuelve `a`. Su uso estrella es **evitar la división por cero**:',
          },
          {
            t: 'sql',
            titulo: 'División segura',
            c: "SELECT codigo,\n       hectareas,\n       cantidad_atajados,\n       round(cantidad_atajados / nullif(hectareas, 0), 2) AS atajados_por_hectarea\nFROM potrero\nORDER BY codigo;",
          },
          {
            t: 'nota',
            tipo: 'tip',
            titulo: 'El patrón NULLIF en la vista de ganancia',
            c: 'En `v_ganancia_peso`, la ganancia diaria se calcula como `(peso - LAG(peso)) / NULLIF(dias, 0)`. Si dos pesajes cayeran el mismo día, el divisor sería 0 y sin `NULLIF` la consulta entera fallaría. Ese es el motivo real por el que está ahí.',
          },
          {
            t: 'quiz',
            pregunta: "¿Qué devuelve `coalesce(NULL, NULL, 'x', 'y')`?",
            opciones: ["'x'", "'y'", 'NULL', 'Un error'],
            correcta: 0,
            explicacion: 'Devuelve el primer argumento no nulo, en orden. Se detiene en `\'x\'`.',
          },
        ],
        clave: [
          '`CASE WHEN ... THEN ... ELSE ... END` para decidir; gana la primera rama cierta.',
          '`coalesce` da valores por defecto; `nullif(a, 0)` evita divisiones por cero.',
          'Sin `ELSE`, un CASE sin coincidencias devuelve NULL.',
        ],
      },
    ],
  }
);
