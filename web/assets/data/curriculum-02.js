/* ==========================================================================
   Currículo · parte 2 — Agregación, JOINs, subconsultas y ventanas
   ========================================================================== */
window.CURRICULO = window.CURRICULO || [];

window.CURRICULO.push(
  // =========================================================================
  {
    id: 'm4',
    titulo: 'Resumir datos',
    emoji: '📊',
    nivel: 'Intermedio',
    resumen: 'Contar, sumar y promediar: de 2.000 pesajes a una tabla de indicadores.',
    lecciones: [
      {
        id: 'm4-l1',
        titulo: 'COUNT, SUM, AVG, MIN y MAX',
        minutos: 9,
        intro: 'Los agregados convierten muchas filas en un solo valor. Son la base de todo informe.',
        bloques: [
          {
            t: 'p',
            c: 'Una función de agregación toma un conjunto de filas y devuelve un único valor. Si en el `SELECT` solo hay agregados, el resultado tiene **una sola fila**.',
          },
          {
            t: 'sql',
            titulo: 'El pulso del hato en una fila',
            c: 'SELECT count(*)        AS animales,\n       count(nombre)    AS con_nombre,\n       min(fecha_ingreso) AS primer_ingreso,\n       max(fecha_ingreso) AS ultimo_ingreso\nFROM animal;',
          },
          {
            t: 'p',
            c: '`count(*)` cuenta filas; `count(columna)` cuenta valores no nulos de esa columna. La diferencia entre ambas es la cantidad de NULL.',
          },
          {
            t: 'sql',
            titulo: 'Pesos: mínimo, máximo, promedio y suma',
            c: 'SELECT count(*)                  AS pesajes,\n       min(peso_kg)               AS minimo,\n       max(peso_kg)               AS maximo,\n       round(avg(peso_kg), 2)     AS promedio,\n       round(sum(peso_kg), 0)     AS suma_total\nFROM pesaje;',
          },
          {
            t: 'nota',
            tipo: 'ojo',
            titulo: 'AVG ignora los NULL',
            c: '`avg(peso_kg)` divide entre el número de pesos **no nulos**, no entre el total de filas. Si tienes 100 filas y 40 pesos nulos, el promedio se calcula sobre 60. Casi siempre es lo que quieres, pero conviene saberlo.',
          },
          { t: 'h', c: 'Agregados que no son números' },
          {
            t: 'p',
            c: '`min` y `max` funcionan con texto y fechas. `min(nombre)` devuelve el primero en orden alfabético; `max(fecha)` la más reciente.',
          },
          {
            t: 'sql',
            titulo: 'Extremos de texto y fecha',
            c: "SELECT min(nombre)        AS primer_nombre_alfabetico,\n       max(nombre)        AS ultimo_nombre_alfabetico,\n       min(fecha_ingreso) AS ingreso_mas_antiguo,\n       max(fecha_ingreso) AS ingreso_mas_reciente\nFROM animal\nWHERE nombre IS NOT NULL;",
          },
          {
            t: 'nota',
            tipo: 'info',
            titulo: 'Un agregado sin GROUP BY siempre devuelve una fila',
            c: 'Aunque no haya ninguna fila que cumpla el `WHERE`, `count(*)` devuelve `0` y los demás devuelven `NULL`. No devuelve "nada": devuelve una fila con ceros o nulos.',
          },
          {
            t: 'sql',
            titulo: 'Un agregado sobre cero filas',
            c: "SELECT count(*) AS cuantos,\n       round(avg(peso_kg), 2) AS promedio\nFROM pesaje\nWHERE peso_kg > 5000;",
          },
          {
            t: 'quiz',
            pregunta: 'La tabla `animal` tiene 80 filas y 27 de ellas tienen `nombre` NULL. ¿Cuánto devuelve `count(nombre)`?',
            opciones: ['80', '53', '27', '0'],
            correcta: 1,
            explicacion: '`count(columna)` cuenta solo los valores no nulos: 80 − 27 = 53.',
          },
        ],
        clave: [
          '`count(*)` cuenta filas; `count(col)` cuenta valores no nulos.',
          '`avg` divide entre los valores no nulos, no entre todas las filas.',
          'Sin `GROUP BY`, un agregado devuelve exactamente una fila.',
        ],
      },
      {
        id: 'm4-l2',
        titulo: 'GROUP BY: un resultado por grupo',
        minutos: 10,
        intro: 'Aquí empieza el SQL útil de verdad: dejar de mirar filas y empezar a mirar categorías.',
        bloques: [
          {
            t: 'p',
            c: '`GROUP BY` parte las filas en grupos según el valor de una o varias columnas y aplica los agregados **dentro de cada grupo**. El resultado tiene una fila por grupo.',
          },
          {
            t: 'sql',
            titulo: 'Cabezas por grupo',
            c: 'SELECT id_grupo, count(*) AS cabezas\nFROM animal\nWHERE estado = \'Activo\'\nGROUP BY id_grupo\nORDER BY cabezas DESC;',
          },
          {
            t: 'p',
            c: 'La regla de oro: **toda columna del `SELECT` que no esté dentro de un agregado debe aparecer en el `GROUP BY`**. PostgreSQL lo exige y te lo dirá con un error si lo olvidas.',
          },
          {
            t: 'sql',
            titulo: 'Cruzar dos columnas',
            c: "SELECT origen, sexo, count(*) AS cuantos\nFROM animal\nGROUP BY origen, sexo\nORDER BY origen, sexo;",
          },
          {
            t: 'p',
            c: 'Con dos columnas, cada combinación `(origen, sexo)` es un grupo. Es la forma manual de hacer una tabla de contingencia.',
          },
          { t: 'h', c: 'Agrupar por algo calculado' },
          {
            t: 'p',
            c: 'Puedes agrupar por una expresión, siempre que la repitas en el `SELECT`. También puedes agrupar por la **posición** de la columna (`GROUP BY 1`), cómodo pero frágil si reordenas.',
          },
          {
            t: 'sql',
            titulo: 'Pesajes por mes',
            c: "SELECT date_trunc('month', fecha)::date AS mes,\n       count(*)        AS pesajes,\n       round(avg(peso_kg), 1) AS promedio\nFROM pesaje\nGROUP BY date_trunc('month', fecha)\nORDER BY mes\nLIMIT 8;",
          },
          {
            t: 'nota',
            tipo: 'tip',
            titulo: 'GROUP BY 1 y ORDER BY 1',
            c: 'Se refieren a la **posición** en la lista del `SELECT`. Escribir `GROUP BY 1` ahorra repeticiones, pero si mañana reordenas las columnas el significado cambia sin avisar. En consultas que vas a mantener, repite el nombre.',
          },
          { t: 'h', c: 'Contar con JOIN' },
          {
            t: 'p',
            c: 'Cuando combinas tablas, cuenta la columna de la tabla "hija", no `*`, para no contar filas duplicadas por el join.',
          },
          {
            t: 'sql',
            titulo: 'Cada grupo con su nombre y su potrero',
            c: 'SELECT g.nombre AS grupo,\n       coalesce(p.codigo, \'sin potrero\') AS potrero,\n       count(a.id) AS cabezas\nFROM grupo g\nLEFT JOIN potrero p ON p.id = g.id_potrero\nLEFT JOIN animal a  ON a.id_grupo = g.id AND a.estado = \'Activo\'\nGROUP BY g.nombre, p.codigo\nORDER BY cabezas DESC, g.nombre;',
          },
          {
            t: 'p',
            c: 'Fíjate en dos detalles: `count(a.id)` (no `count(*)`) para que un grupo vacío cuente 0, y el filtro `a.estado = \'Activo\'` dentro del `ON` del `LEFT JOIN` para no eliminar los grupos sin animales. Esto último se explica a fondo en la lección de `LEFT JOIN`.',
          },
          {
            t: 'quiz',
            pregunta: '¿Cuál de estas consultas es válida?',
            opciones: [
              '`SELECT sexo, nombre, count(*) FROM animal GROUP BY sexo;`',
              '`SELECT sexo, count(*) FROM animal GROUP BY sexo;`',
              '`SELECT sexo, count(*) FROM animal;`',
              '`SELECT count(*) FROM animal GROUP BY sexo, nombre;`',
            ],
            correcta: 1,
            explicacion: 'La primera y la tercera fallan porque `nombre` (o `sexo`) no está agregada ni agrupada. La cuarta es válida pero devuelve un grupo por cada par (sexo, nombre), no lo que uno espera.',
          },
        ],
        clave: [
          '`GROUP BY` devuelve una fila por grupo.',
          'Todo lo que no sea agregado debe estar en el `GROUP BY`.',
          'Con `LEFT JOIN`, filtra en el `ON` si no quieres perder grupos vacíos.',
        ],
      },
      {
        id: 'm4-l3',
        titulo: 'HAVING, FILTER y agregados condicionales',
        minutos: 10,
        intro: 'HAVING filtra grupos (no filas). FILTER calcula varios agregados en una sola pasada.',
        bloques: [
          {
            t: 'p',
            c: '`WHERE` filtra filas **antes** de agrupar; `HAVING` filtra grupos **después**. Por eso `HAVING` puede usar agregados y `WHERE` no.',
          },
          {
            t: 'sql',
            titulo: 'Grupos con más de 10 cabezas',
            c: 'SELECT g.nombre AS grupo, count(a.id) AS cabezas\nFROM grupo g\nJOIN animal a ON a.id_grupo = g.id AND a.estado = \'Activo\'\nGROUP BY g.nombre\nHAVING count(a.id) > 10\nORDER BY cabezas DESC;',
          },
          {
            t: 'p',
            c: 'La secuencia lógica es: `FROM` → `WHERE` → `GROUP BY` → `HAVING` → `SELECT` → `ORDER BY` → `LIMIT`. Por eso un alias definido en `SELECT` no existe todavía en `HAVING` (aunque PostgreSQL te deja usar el alias en `ORDER BY`).',
          },
          {
            t: 'tabla',
            cabecera: ['Quiero filtrar…', 'Uso'],
            filas: [
              ['Filas individuales antes de agrupar', '`WHERE`'],
              ['Grupos según un agregado', '`HAVING`'],
              ['El resultado final, después de todo', '`ORDER BY` + `LIMIT`'],
            ],
          },
          { t: 'h', c: 'FILTER: varios agregados en una pasada' },
          {
            t: 'p',
            c: 'PostgreSQL permite añadir `FILTER (WHERE condición)` a un agregado. Es la forma más limpia de calcular "cuántos de cada tipo" sin subconsultas.',
          },
          {
            t: 'sql',
            titulo: 'Machos y hembras por grupo',
            c: 'SELECT g.nombre AS grupo,\n       count(a.id)                                  AS total,\n       count(a.id) FILTER (WHERE a.sexo = \'M\')    AS machos,\n       count(a.id) FILTER (WHERE a.sexo = \'H\')    AS hembras\nFROM grupo g\nLEFT JOIN animal a ON a.id_grupo = g.id AND a.estado = \'Activo\'\nGROUP BY g.nombre\nORDER BY total DESC;',
          },
          {
            t: 'p',
            c: 'Esta es exactamente la técnica que usa la vista `v_resumen_grupos` del esquema. Compárala:',
          },
          {
            t: 'sql',
            titulo: 'La vista oficial',
            c: 'SELECT nombre_grupo, potrero_actual, total_cabezas, total_machos, total_hembras\nFROM v_resumen_grupos;',
          },
          { t: 'h', c: 'La alternativa con CASE' },
          {
            t: 'p',
            c: 'Antes de que existiera `FILTER` (y en otros motores) se usaba `SUM(CASE WHEN ... THEN 1 ELSE 0 END)`. Sigue siendo válido y es portable a MySQL o SQL Server. Merece la pena reconocerlo cuando lo veas.',
          },
          {
            t: 'sql',
            titulo: 'Contar con SUM + CASE',
            c: "SELECT count(*) AS total,\n       sum(CASE WHEN sexo = 'M' THEN 1 ELSE 0 END) AS machos,\n       sum(CASE WHEN sexo = 'H' THEN 1 ELSE 0 END) AS hembras\nFROM animal\nWHERE estado = 'Activo';",
          },
          {
            t: 'nota',
            tipo: 'tip',
            titulo: 'Porcentajes con NULLIF',
            c: 'Para calcular un porcentaje sin arriesgar una división por cero: `round(100.0 * count(*) FILTER (WHERE sexo = \'H\') / nullif(count(*), 0), 1)`.',
          },
          {
            t: 'quiz',
            pregunta: '¿Dónde va la condición "solo animales activos"?',
            opciones: [
              'En `HAVING estado = \'Activo\'`',
              'En `WHERE estado = \'Activo\'`',
              'Es indistinto',
              'En `ORDER BY`',
            ],
            correcta: 1,
            explicacion: 'Es un filtro de filas, no de grupos: va en `WHERE`. Ponerlo en `HAVING` fallaría porque `estado` no es un agregado ni está en el `GROUP BY`.',
          },
        ],
        clave: [
          '`WHERE` filtra filas; `HAVING` filtra grupos y admite agregados.',
          '`FILTER (WHERE ...)` calcula varios agregados en una sola pasada.',
          '`SUM(CASE WHEN ...)` es la alternativa portable a `FILTER`.',
        ],
      },
    ],
  },

  // =========================================================================
  {
    id: 'm5',
    titulo: 'Combinar tablas',
    emoji: '🔗',
    nivel: 'Intermedio',
    resumen: 'INNER, LEFT, SELF y CROSS JOIN: el corazón del modelo relacional.',
    lecciones: [
      {
        id: 'm5-l1',
        titulo: 'La idea de JOIN y el producto cartesiano',
        minutos: 9,
        intro: 'Las tablas se relacionan por claves. JOIN es la operación que vuelve a juntarlas.',
        bloques: [
          {
            t: 'p',
            c: 'En el esquema, `animal.id_raza` guarda un número. Ese número no significa nada por sí solo: es una **llave foránea** que apunta a `raza.id`. Para ver "Nelore" en lugar de "1" hay que combinar las dos tablas.',
          },
          {
            t: 'p',
            c: 'Un `JOIN` empareja cada fila de una tabla con las filas de otra según una condición. Si no pones condición, obtienes el **producto cartesiano**: cada fila con cada fila.',
          },
          {
            t: 'sql',
            titulo: 'Producto cartesiano (¡cuidado!)',
            c: 'SELECT count(*) AS filas\nFROM animal\nCROSS JOIN raza;',
          },
          {
            t: 'p',
            c: '80 animales × 4 razas = 320 filas, la mayoría sin sentido. Es lo que pasa cuando olvidas la condición de unión: la consulta "funciona" pero devuelve basura multiplicada. Si un `JOIN` te devuelve muchísimas más filas de las esperadas, busca una condición que falta.',
          },
          {
            t: 'nota',
            tipo: 'ojo',
            titulo: 'El join olvidado',
            c: 'Escribir `FROM animal, raza WHERE animal.id_raza = raza.id` es la sintaxis antigua (join implícito). Funciona, pero mezcla la condición de unión con los filtros y se vuelve ilegible con tres o cuatro tablas. Usa `JOIN ... ON` siempre.',
          },
          { t: 'h', c: 'Anatomía de un JOIN' },
          {
            t: 'tabla',
            cabecera: ['Parte', 'Significado'],
            filas: [
              ['`FROM animal a`', 'Tabla izquierda, con alias `a`'],
              ['`JOIN raza r`', 'Tabla derecha, con alias `r`'],
              ['`ON a.id_raza = r.id`', 'Condición de emparejamiento'],
              ['`SELECT a.numero_arete, r.nombre`', 'Columnas de ambas, calificadas'],
            ],
          },
          {
            t: 'p',
            c: 'Los alias (`a`, `r`) son casi obligatorios cuando hay varias tablas: sin ellos acabas escribiendo `animal.numero_arete` y el SQL se vuelve un muro. Cuando dos tablas tienen una columna con el mismo nombre (`id`), el alias es la única forma de distinguirlas.',
          },
          {
            t: 'quiz',
            pregunta: '¿Qué pasa si olvidas la condición `ON` en un `JOIN` normal?',
            opciones: [
              'PostgreSQL da un error de sintaxis',
              'Devuelve el producto cartesiano de ambas tablas',
              'Devuelve solo las filas que coinciden',
              'Devuelve cero filas',
            ],
            correcta: 1,
            explicacion: 'Sin condición, cada fila se empareja con todas las de la otra tabla. Es un error lógico silencioso y muy caro en tablas grandes.',
          },
        ],
        clave: [
          'Las tablas se unen por llaves primarias y foráneas.',
          '`JOIN ... ON` es la forma moderna y legible.',
          'Sin condición de unión obtienes el producto cartesiano.',
        ],
      },
      {
        id: 'm5-l2',
        titulo: 'INNER JOIN: solo lo que coincide',
        minutos: 10,
        intro: 'INNER JOIN se queda únicamente con las filas que encuentran pareja en ambas tablas.',
        bloques: [
          {
            t: 'p',
            c: '`INNER JOIN` (o simplemente `JOIN`) devuelve las combinaciones donde la condición se cumple. Si un animal no tuviera raza, no aparecería.',
          },
          {
            t: 'sql',
            titulo: 'Animales con el nombre de su raza',
            c: 'SELECT a.numero_arete, a.nombre, r.nombre AS raza\nFROM animal a\nJOIN raza r ON r.id = a.id_raza\nORDER BY a.numero_arete\nLIMIT 10;',
          },
          {
            t: 'p',
            c: 'Puedes encadenar tantos joins como necesites. Cada uno añade una tabla y su condición.',
          },
          {
            t: 'sql',
            titulo: 'Tres tablas: animal, grupo y potrero',
            c: 'SELECT a.numero_arete, g.nombre AS grupo, p.codigo AS potrero, p.hectareas\nFROM animal a\nJOIN grupo g   ON g.id = a.id_grupo\nJOIN potrero p ON p.id = g.id_potrero\nWHERE a.estado = \'Activo\'\nORDER BY p.codigo, a.numero_arete\nLIMIT 12;',
          },
          {
            t: 'p',
            c: 'Ese patrón —animal → grupo → potrero— es el que responde "¿dónde está cada animal?". La vista `v_kardex` lo hace con `LEFT JOIN` porque un animal vendido ya no tiene grupo actual.',
          },
          { t: 'h', c: 'Joins con tablas intermedias' },
          {
            t: 'p',
            c: 'Las relaciones muchos-a-muchos usan una tabla puente. `animal_caracteristica` une animales con características físicas (mocha, pintada, chuta). Para verlas hay que pasar por ella.',
          },
          {
            t: 'sql',
            titulo: 'Características de cada animal',
            c: 'SELECT a.numero_arete, cf.nombre AS caracteristica\nFROM animal a\nJOIN animal_caracteristica ac ON ac.id_animal = a.id\nJOIN caracteristica_fisica cf ON cf.id = ac.id_caracteristica\nORDER BY a.numero_arete, cf.nombre\nLIMIT 15;',
          },
          {
            t: 'nota',
            tipo: 'info',
            titulo: 'El join multiplica filas',
            c: 'Si un animal tiene dos características, aparece dos veces. Eso no es un error: es la forma correcta de representar una relación uno-a-muchos. Si quieres una fila por animal con las características juntas, usa `string_agg(cf.nombre, \', \')` con `GROUP BY`.',
          },
          {
            t: 'sql',
            titulo: 'Una fila por animal, características juntas',
            c: 'SELECT a.numero_arete,\n       string_agg(cf.nombre, \', \' ORDER BY cf.nombre) AS caracteristicas\nFROM animal a\nJOIN animal_caracteristica ac ON ac.id_animal = a.id\nJOIN caracteristica_fisica cf ON cf.id = ac.id_caracteristica\nGROUP BY a.numero_arete\nORDER BY a.numero_arete\nLIMIT 10;',
          },
          {
            t: 'quiz',
            pregunta: 'Un animal con tres características, ¿cuántas filas produce en el join de tres tablas del ejemplo?',
            opciones: ['Una', 'Tres', 'Ninguna', 'Depende del orden de las tablas'],
            correcta: 1,
            explicacion: 'Cada característica es una fila de `animal_caracteristica`, así que el animal se repite tres veces.',
          },
        ],
        clave: [
          '`INNER JOIN` = solo las filas con pareja en ambas tablas.',
          'Encadena joins para recorrer relaciones: animal → grupo → potrero.',
          'Las tablas puente multiplican filas; `GROUP BY` + `string_agg` las reúne.',
        ],
      },
      {
        id: 'm5-l3',
        titulo: 'LEFT JOIN: incluir a los que no tienen pareja',
        minutos: 11,
        intro: 'El JOIN más importante después del INNER. Sirve para encontrar lo que falta, que suele ser la pregunta interesante.',
        bloques: [
          {
            t: 'p',
            c: '`LEFT JOIN` devuelve **todas** las filas de la tabla izquierda. Si no hay pareja a la derecha, rellena las columnas derechas con `NULL`.',
          },
          {
            t: 'sql',
            titulo: 'Todos los grupos, tengan o no animales',
            c: 'SELECT g.nombre AS grupo, count(a.id) AS animales\nFROM grupo g\nLEFT JOIN animal a ON a.id_grupo = g.id AND a.estado = \'Activo\'\nGROUP BY g.nombre\nORDER BY g.nombre;',
          },
          {
            t: 'p',
            c: 'El grupo `Vacas Lecheras` no tiene animales y aparece con 0. Con un `INNER JOIN` habría desaparecido de la lista, y ese hueco es precisamente el dato que te interesa.',
          },
          {
            t: 'nota',
            tipo: 'error',
            titulo: 'El error del LEFT JOIN que se convierte en INNER',
            c: 'Si pones `WHERE a.estado = \'Activo\'` en lugar de ponerlo en el `ON`, eliminas las filas donde `a` es NULL (porque `NULL = \'Activo\'` no es verdadero) y el `LEFT JOIN` se comporta como un `INNER`. La condición de la tabla derecha va **en el ON**.',
          },
          { t: 'h', c: 'Buscar lo que falta (anti-join)' },
          {
            t: 'p',
            c: 'El patrón `LEFT JOIN ... WHERE derecha.id IS NULL` encuentra filas sin correspondencia. Sirve para responder "¿qué potreros no tienen ningún grupo asignado?".',
          },
          {
            t: 'sql',
            titulo: 'Potreros vacíos',
            c: 'SELECT p.codigo, p.hectareas\nFROM potrero p\nLEFT JOIN grupo g ON g.id_potrero = p.id AND g.activo\nWHERE g.id IS NULL\nORDER BY p.codigo;',
          },
          {
            t: 'sql',
            titulo: 'Animales sin ningún pesaje',
            c: 'SELECT a.numero_arete, a.estado\nFROM animal a\nLEFT JOIN pesaje p ON p.id_animal = a.id\nWHERE p.id IS NULL\nORDER BY a.numero_arete;',
          },
          {
            t: 'nota',
            tipo: 'tip',
            titulo: 'LEFT JOIN frente a NOT IN',
            c: 'El anti-join con `LEFT JOIN` funciona siempre. `NOT IN (subconsulta)` se rompe si la subconsulta devuelve algún NULL: no devuelve nada. En la lección de subconsultas verás `NOT EXISTS`, que es la tercera alternativa.',
          },
          { t: 'h', c: 'RIGHT y FULL' },
          {
            t: 'p',
            c: '`RIGHT JOIN` es el espejo: conserva todas las filas de la derecha. Se usa poco porque casi siempre se puede reescribir como `LEFT` cambiando el orden de las tablas, lo que además se lee mejor. `FULL JOIN` conserva las de ambos lados; sirve para comparar dos conjuntos.',
          },
          {
            t: 'sql',
            titulo: 'FULL JOIN: comparar dos conjuntos',
            c: 'SELECT coalesce(a.numero_arete, \'—\') AS arete,\n       a.id IS NOT NULL AS esta_en_animal,\n       d.id IS NOT NULL AS esta_en_detalle_venta\nFROM animal a\nFULL JOIN detalle_venta d ON d.id_animal = a.id\nWHERE a.id IS NULL OR d.id IS NULL\nLIMIT 10;',
          },
          {
            t: 'quiz',
            pregunta: 'Quieres los grupos que **no** tienen animales. ¿Cuál es la mejor opción?',
            opciones: [
              '`SELECT ... FROM grupo g LEFT JOIN animal a ON a.id_grupo = g.id WHERE a.id IS NULL`',
              '`SELECT ... FROM grupo g JOIN animal a ON a.id_grupo = g.id`',
              '`SELECT ... FROM grupo g, animal a WHERE g.id <> a.id_grupo`',
              '`SELECT ... FROM grupo WHERE count(*) = 0`',
            ],
            correcta: 0,
            explicacion: 'El anti-join. La tercera opción es un producto cartesiano filtrado: devuelve muchísimas filas sin sentido. La cuarta es inválida: no se puede usar un agregado en `WHERE`.',
          },
        ],
        clave: [
          '`LEFT JOIN` conserva la tabla izquierda y rellena con NULL.',
          'La condición de la tabla derecha va en el `ON`, no en el `WHERE`.',
          '`LEFT JOIN ... WHERE der.id IS NULL` es el patrón anti-join.',
        ],
      },
      {
        id: 'm5-l4',
        titulo: 'SELF JOIN: una tabla consigo misma',
        minutos: 8,
        intro: 'Cuando una fila apunta a otra fila de la misma tabla, necesitas dos alias de la misma tabla.',
        bloques: [
          {
            t: 'p',
            c: '`animal.id_madre` apunta a `animal.id`. Es una relación reflexiva: la tabla se referencia a sí misma. Para resolverla se usan dos alias distintos, como si fueran dos tablas.',
          },
          {
            t: 'sql',
            titulo: 'Cada cría con el arete de su madre',
            c: 'SELECT cria.numero_arete AS cria,\n       madre.numero_arete AS madre,\n       madre.nombre AS nombre_madre\nFROM animal cria\nJOIN animal madre ON madre.id = cria.id_madre\nORDER BY cria.numero_arete\nLIMIT 12;',
          },
          {
            t: 'p',
            c: 'El alias es imprescindible: sin él, `animal.id = animal.id_madre` compararía cada fila consigo misma y no devolvería nada útil.',
          },
          {
            t: 'sql',
            titulo: 'Madres con cuántas crías registradas',
            c: 'SELECT madre.numero_arete AS madre,\n       count(cria.id) AS crias\nFROM animal madre\nJOIN animal cria ON cria.id_madre = madre.id\nGROUP BY madre.numero_arete\nORDER BY crias DESC, madre\nLIMIT 10;',
          },
          {
            t: 'nota',
            tipo: 'info',
            titulo: 'Un self join también puede ser LEFT',
            c: 'Si quieres ver **todas** las crías, incluidas las huérfanas sin madre registrada, usa `LEFT JOIN animal madre`. Con `INNER` las huérfanas desaparecen.',
          },
          {
            t: 'sql',
            titulo: 'Crías, incluidas las huérfanas',
            c: 'SELECT cria.numero_arete AS cria,\n       coalesce(madre.numero_arete, \'(sin madre registrada)\') AS madre\nFROM animal cria\nLEFT JOIN animal madre ON madre.id = cria.id_madre\nWHERE cria.origen = \'Nacimiento\'\nORDER BY cria.numero_arete\nLIMIT 12;',
          },
          {
            t: 'p',
            c: 'Este mismo patrón se usa para jerarquías de empleados (jefe → empleado), categorías de productos (padre → hijo) y estructuras de carpetas. Es el self join de manual.',
          },
          {
            t: 'quiz',
            pregunta: '¿Por qué hacen falta dos alias en un self join?',
            opciones: [
              'Porque PostgreSQL no permite repetir un nombre de tabla',
              'Para distinguir el papel de cada fila (cría frente a madre)',
              'Por velocidad',
              'No hacen falta, es opcional',
            ],
            correcta: 1,
            explicacion: 'Sin alias, ambas referencias apuntan a la misma fila y la comparación no tiene sentido. Los alias permiten tratar la misma tabla como dos conjuntos distintos.',
          },
        ],
        clave: [
          'Un self join une una tabla consigo misma con dos alias.',
          'Útil para jerarquías: madre/cría, jefe/empleado, categoría/subcategoría.',
          'Con `LEFT` incluyes las filas sin relación (huérfanas).',
        ],
      },
    ],
  },

  // =========================================================================
  {
    id: 'm6',
    titulo: 'Subconsultas y CTE',
    emoji: '🪆',
    nivel: 'Intermedio',
    resumen: 'Consultas dentro de consultas, tablas derivadas y el WITH que hace legible lo complejo.',
    lecciones: [
      {
        id: 'm6-l1',
        titulo: 'Subconsultas escalares, IN y EXISTS',
        minutos: 11,
        intro: 'Una subconsulta es una consulta que vive dentro de otra. Puede devolver un valor, una lista o simplemente comprobar si existe algo.',
        bloques: [
          { t: 'h', c: 'Escalar: un solo valor' },
          {
            t: 'p',
            c: 'Si la subconsulta devuelve exactamente una fila y una columna, puedes usarla como si fuera un número o un texto.',
          },
          {
            t: 'sql',
            titulo: 'Comparar contra el promedio general',
            c: 'SELECT a.numero_arete, p.peso_kg\nFROM pesaje p\nJOIN animal a ON a.id = p.id_animal\nWHERE p.peso_kg > (SELECT avg(peso_kg) FROM pesaje)\nORDER BY p.peso_kg DESC\nLIMIT 10;',
          },
          {
            t: 'p',
            c: 'La subconsulta se evalúa una vez y su resultado se usa como constante. Si devolviera más de una fila, PostgreSQL daría el error `more than one row returned by a subquery`.',
          },
          { t: 'h', c: 'IN: pertenencia a una lista' },
          {
            t: 'sql',
            titulo: 'Animales que alguna vez pesaron más de 500 kg',
            c: 'SELECT numero_arete, raza\nFROM v_kardex\nWHERE id IN (SELECT id_animal FROM pesaje WHERE peso_kg > 500)\nORDER BY numero_arete\nLIMIT 10;',
          },
          {
            t: 'nota',
            tipo: 'ojo',
            titulo: 'NOT IN con NULL',
            c: 'Si la subconsulta devuelve un solo NULL, `NOT IN` no devuelve ninguna fila. Es un comportamiento correcto según la lógica de tres valores, pero sorprende. Para "los que no están", usa `NOT EXISTS` o un anti-join.',
          },
          { t: 'h', c: 'EXISTS: ¿existe al menos una?' },
          {
            t: 'p',
            c: '`EXISTS (subconsulta)` es verdadero si la subconsulta devuelve al menos una fila. Lo importante: **puede ser correlacionada**, es decir, referirse a la fila actual de la consulta externa.',
          },
          {
            t: 'sql',
            titulo: 'Animales con al menos un pesaje alto',
            c: 'SELECT a.numero_arete\nFROM animal a\nWHERE EXISTS (\n  SELECT 1 FROM pesaje p\n  WHERE p.id_animal = a.id AND p.peso_kg > 500\n)\nORDER BY a.numero_arete\nLIMIT 10;',
          },
          {
            t: 'p',
            c: '`EXISTS` se detiene en la primera coincidencia: no le importa cuántas haya, solo si hay. Por eso se escribe `SELECT 1` dentro: el contenido no se usa. Es el patrón idiomático.',
          },
          {
            t: 'sql',
            titulo: 'El contrario: NOT EXISTS',
            c: 'SELECT a.numero_arete, a.estado\nFROM animal a\nWHERE NOT EXISTS (\n  SELECT 1 FROM pesaje p WHERE p.id_animal = a.id\n)\nORDER BY a.numero_arete;',
          },
          {
            t: 'tabla',
            cabecera: ['Quiero…', 'Mejor opción'],
            filas: [
              ['Un valor único para comparar', 'Subconsulta escalar'],
              ['Pertenencia a una lista corta', '`IN`'],
              ['Pertenencia a una lista que puede tener NULL', '`EXISTS` / `NOT EXISTS`'],
              ['Comprobar existencia con correlación', '`EXISTS`'],
            ],
          },
          {
            t: 'quiz',
            pregunta: '¿Qué diferencia clave hay entre `IN` y `EXISTS`?',
            opciones: [
              '`EXISTS` es más moderno, `IN` está obsoleto',
              '`EXISTS` puede correlacionarse con la consulta externa y no le afectan los NULL',
              '`IN` solo funciona con números',
              'Son exactamente iguales',
            ],
            correcta: 1,
            explicacion: '`EXISTS` se evalúa por fila externa y no tiene el problema de los NULL de `NOT IN`. Muchas veces el planificador los convierte al mismo plan, pero la semántica con NULL es distinta.',
          },
        ],
        clave: [
          'Subconsulta escalar: una fila, una columna, se usa como valor.',
          '`IN` para listas; `NOT IN` es peligroso con NULL.',
          '`EXISTS` / `NOT EXISTS` para comprobar existencia, con correlación.',
        ],
      },
      {
        id: 'm6-l2',
        titulo: 'Tablas derivadas: subconsultas en el FROM',
        minutos: 9,
        intro: 'Una subconsulta puede hacer de tabla. Se llama tabla derivada y necesita un alias.',
        bloques: [
          {
            t: 'p',
            c: 'Cuando pones una consulta en el `FROM`, el resultado se trata como una tabla temporal durante la ejecución. Es la forma de filtrar por un valor agregado, algo que `WHERE` no permite directamente.',
          },
          {
            t: 'sql',
            titulo: 'El pesaje más alto de cada animal',
            c: 'SELECT t.id_animal, t.max_peso\nFROM (\n  SELECT id_animal, max(peso_kg) AS max_peso\n  FROM pesaje\n  GROUP BY id_animal\n) t\nORDER BY t.max_peso DESC\nLIMIT 10;',
          },
          {
            t: 'p',
            c: 'No puedes escribir `WHERE max(peso_kg) > 500` directamente: los agregados no funcionan en `WHERE`. Pero sí puedes calcularlos en una tabla derivada y filtrar fuera.',
          },
          {
            t: 'sql',
            titulo: 'Filtrar sobre el agregado',
            c: 'SELECT a.numero_arete, t.max_peso\nFROM (\n  SELECT id_animal, max(peso_kg) AS max_peso\n  FROM pesaje\n  GROUP BY id_animal\n) t\nJOIN animal a ON a.id = t.id_animal\nWHERE t.max_peso > 500\nORDER BY t.max_peso DESC\nLIMIT 10;',
          },
          {
            t: 'nota',
            tipo: 'ojo',
            titulo: 'El alias es obligatorio',
            c: 'En PostgreSQL, toda tabla derivada necesita un alias (`AS t`). Sin él, la consulta falla. Es el error más común al empezar con subconsultas en el `FROM`.',
          },
          { t: 'h', c: 'Cuándo usar tabla derivada y cuándo CTE' },
          {
            t: 'p',
            c: 'Una tabla derivada es perfecta para un paso intermedio pequeño. Cuando encadenas tres o necesitas reutilizar el resultado, el `WITH` de la próxima lección es más legible. En rendimiento suelen ser equivalentes en PostgreSQL moderno.',
          },
          {
            t: 'sql',
            titulo: 'Dos niveles: pesajes por animal y luego por raza',
            c: 'SELECT r.nombre AS raza,\n       round(avg(t.max_peso), 1) AS peso_max_promedio\nFROM (\n  SELECT p.id_animal, max(p.peso_kg) AS max_peso\n  FROM pesaje p\n  GROUP BY p.id_animal\n) t\nJOIN animal a ON a.id = t.id_animal\nJOIN raza r   ON r.id = a.id_raza\nGROUP BY r.nombre\nORDER BY peso_max_promedio DESC;',
          },
          {
            t: 'quiz',
            pregunta: '¿Por qué no puedes escribir `WHERE count(*) > 5` sin agrupar?',
            opciones: [
              'Porque `WHERE` se evalúa antes que los agregados',
              'Porque `count` no existe en `WHERE`',
              'Porque hace falta `HAVING` sólo con `GROUP BY`',
              'Sí se puede, es válido',
            ],
            correcta: 0,
            explicacion: 'El orden lógico es `FROM` → `WHERE` → `GROUP BY` → `HAVING`. Cuando se evalúa `WHERE` todavía no hay grupos ni agregados. Para eso existe `HAVING`.',
          },
        ],
        clave: [
          'Una subconsulta en `FROM` es una tabla derivada y necesita alias.',
          'Sirve para filtrar por valores agregados.',
          'Si se complica, pásate al `WITH`.',
        ],
      },
      {
        id: 'm6-l3',
        titulo: 'CTE: WITH para escribir consultas legibles',
        minutos: 11,
        intro: 'WITH pone nombre a los pasos intermedios. Es la diferencia entre una consulta que se entiende y una que se sufre.',
        bloques: [
          {
            t: 'p',
            c: 'Una **CTE** (Common Table Expression) es una consulta con nombre que vive al principio de la sentencia. Se puede usar como si fuera una tabla y, sobre todo, se lee de arriba abajo como una receta.',
          },
          {
            t: 'sql',
            titulo: 'Ventas por comprador',
            c: 'WITH totales AS (\n  SELECT id_comprador, count(*) AS ventas, sum(precio_total) AS monto\n  FROM venta\n  GROUP BY id_comprador\n)\nSELECT c.nombre, t.ventas, round(t.monto, 2) AS monto_total\nFROM totales t\nJOIN comprador c ON c.id = t.id_comprador\nORDER BY t.monto DESC;',
          },
          {
            t: 'p',
            c: 'Puedes encadenar varias CTE separadas por comas. Cada una puede referirse a las anteriores.',
          },
          {
            t: 'sql',
            titulo: 'Tres pasos con nombre',
            c: 'WITH pesajes_por_animal AS (\n  SELECT id_animal, max(peso_kg) AS max_peso, count(*) AS tomas\n  FROM pesaje\n  GROUP BY id_animal\n),\nresumen AS (\n  SELECT a.id_raza, pp.max_peso, pp.tomas\n  FROM pesajes_por_animal pp\n  JOIN animal a ON a.id = pp.id_animal\n)\nSELECT r.nombre AS raza,\n       count(*) AS animales,\n       round(avg(resumen.max_peso), 1) AS peso_max_promedio,\n       sum(resumen.tomas) AS pesajes\nFROM resumen\nJOIN raza r ON r.id = resumen.id_raza\nGROUP BY r.nombre\nORDER BY animales DESC;',
          },
          {
            t: 'nota',
            tipo: 'tip',
            titulo: 'CTE frente a subconsulta',
            c: 'Si la consulta cabe en una línea, usa subconsulta. Si necesitas tres pasos o vas a repetir un cálculo, usa CTE. El planificador de PostgreSQL 12+ puede "inline" las CTE simples, así que no hay penalización automática.',
          },
          { t: 'h', c: 'WITH RECURSIVE' },
          {
            t: 'p',
            c: 'Una CTE puede referirse a sí misma. Es la forma de recorrer jerarquías: árboles, organigramas o el linaje de una vaca.',
          },
          {
            t: 'sql',
            titulo: 'Toda la descendencia de una madre',
            c: 'WITH RECURSIVE descendencia AS (\n  SELECT id, numero_arete, id_madre, 1 AS nivel\n  FROM animal\n  WHERE id = 1\n\n  UNION ALL\n\n  SELECT a.id, a.numero_arete, a.id_madre, d.nivel + 1\n  FROM animal a\n  JOIN descendencia d ON a.id_madre = d.id\n)\nSELECT nivel, numero_arete\nFROM descendencia\nORDER BY nivel, numero_arete;',
          },
          {
            t: 'p',
            c: 'La estructura es siempre la misma: un caso base (la raíz), `UNION ALL` y un caso recursivo que se une consigo mismo. La condición de parada es que la unión no produzca filas nuevas. Si la jerarquía tuviera un ciclo, la consulta no terminaría: por eso se añaden columnas de control o límites.',
          },
          {
            t: 'sql',
            titulo: 'Linaje hacia arriba: de una cría a su madre',
            c: 'WITH RECURSIVE linaje AS (\n  SELECT id, numero_arete, id_madre, 0 AS generacion\n  FROM animal\n  WHERE id = 45\n\n  UNION ALL\n\n  SELECT a.id, a.numero_arete, a.id_madre, l.generacion + 1\n  FROM animal a\n  JOIN linaje l ON a.id = l.id_madre\n)\nSELECT generacion, numero_arete\nFROM linaje\nORDER BY generacion;',
          },
          {
            t: 'quiz',
            pregunta: '¿Qué devuelve una CTE recursiva si no hay condición de parada natural?',
            opciones: [
              'Solo la raíz',
              'Un error de sintaxis',
              'Puede no terminar nunca',
              'Devuelve NULL',
            ],
            correcta: 2,
            explicacion: 'La recursión se detiene cuando el caso recursivo deja de producir filas. Si los datos tienen un ciclo (A es madre de B y B de A), la consulta se ejecuta indefinidamente.',
          },
        ],
        clave: [
          '`WITH nombre AS (...)` da nombre a un paso intermedio.',
          'Encadena CTE con comas; cada una ve a las anteriores.',
          '`WITH RECURSIVE` para jerarquías y grafos.',
        ],
      },
    ],
  },

  // =========================================================================
  {
    id: 'm7',
    titulo: 'Funciones de ventana',
    emoji: '🪟',
    nivel: 'Avanzado',
    resumen: 'Calcular rankings y comparar cada fila con su vecina, sin perder las filas.',
    lecciones: [
      {
        id: 'm7-l1',
        titulo: 'Qué es una ventana (OVER)',
        minutos: 9,
        intro: 'GROUP BY colapsa las filas. Una función de ventana calcula sobre un grupo de filas pero deja cada fila en su sitio.',
        bloques: [
          {
            t: 'p',
            c: 'La diferencia esencial: con `GROUP BY` pierdes las filas individuales. Con `OVER` las conservas y añades un cálculo que "mira" a un conjunto de filas relacionadas.',
          },
          {
            t: 'sql',
            titulo: 'El peso medio de su grupo, en cada fila',
            c: 'SELECT numero_arete,\n       grupo_actual,\n       peso_actual_kg,\n       round(avg(peso_actual_kg) OVER (PARTITION BY grupo_actual), 1) AS promedio_grupo\nFROM v_kardex\nORDER BY grupo_actual, peso_actual_kg DESC\nLIMIT 15;',
          },
          {
            t: 'p',
            c: '`PARTITION BY` define los grupos (como un `GROUP BY` interno) y `OVER` indica que es una ventana. Cada fila ve el promedio de **su** grupo, sin perder su identidad.',
          },
          {
            t: 'tabla',
            cabecera: ['Pieza', 'Qué hace'],
            filas: [
              ['`OVER ()`', 'Ventana sobre todas las filas'],
              ['`PARTITION BY col`', 'Divide en grupos independientes'],
              ['`ORDER BY col`', 'Ordena dentro de la ventana (necesario para ranking y acumulados)'],
              ['`ROWS BETWEEN ...`', 'Limita el marco de filas que ve la función'],
            ],
          },
          {
            t: 'nota',
            tipo: 'info',
            titulo: 'Se evalúan al final',
            c: 'Las funciones de ventana se calculan después de `WHERE`, `GROUP BY` y `HAVING`, pero antes de `ORDER BY` final. Por eso no puedes filtrar por su resultado en el mismo nivel: hay que envolver la consulta en una tabla derivada.',
          },
          {
            t: 'quiz',
            pregunta: '¿Cuál es la diferencia principal entre `GROUP BY` y `OVER (PARTITION BY ...)`?',
            opciones: [
              'Ninguna, son sinónimos',
              '`GROUP BY` reduce filas; `OVER` las conserva',
              '`OVER` es más lento siempre',
              '`OVER` solo funciona con `COUNT`',
            ],
            correcta: 1,
            explicacion: '`GROUP BY` agrupa y colapsa; la ventana calcula por grupo y mantiene todas las filas originales.',
          },
        ],
        clave: [
          '`OVER (PARTITION BY ... ORDER BY ...)` define la ventana.',
          'Conservas las filas: añades columnas calculadas.',
          'No puedes filtrar por el resultado de una ventana sin una subconsulta.',
        ],
      },
      {
        id: 'm7-l2',
        titulo: 'ROW_NUMBER, RANK y DENSE_RANK',
        minutos: 10,
        intro: 'Tres formas de numerar filas, con tres comportamientos distintos ante los empates.',
        bloques: [
          {
            t: 'p',
            c: 'Sirven para responder "el más… de cada…". La diferencia está en cómo tratan los empates.',
          },
          {
            t: 'tabla',
            cabecera: ['Función', 'Con empates', 'Ejemplo (90, 90, 80)'],
            filas: [
              ['`row_number()`', 'Nunca empata: 1, 2, 3', '1, 2, 3'],
              ['`rank()`', 'Empatan y salta números', '1, 1, 3'],
              ['`dense_rank()`', 'Empatan sin saltar', '1, 1, 2'],
            ],
          },
          {
            t: 'sql',
            titulo: 'Los tres rankings, lado a lado',
            c: 'SELECT numero_arete,\n       peso_actual_kg,\n       row_number() OVER (ORDER BY peso_actual_kg DESC) AS fila,\n       rank()       OVER (ORDER BY peso_actual_kg DESC) AS rango,\n       dense_rank() OVER (ORDER BY peso_actual_kg DESC) AS denso\nFROM v_kardex\nORDER BY peso_actual_kg DESC\nLIMIT 12;',
          },
          { t: 'h', c: 'El más pesado de cada grupo' },
          {
            t: 'p',
            c: 'El patrón clásico: numerar dentro de cada partición y quedarse con el número 1. Como no se puede filtrar directamente por `row_number()`, se usa una tabla derivada.',
          },
          {
            t: 'sql',
            titulo: 'Top 1 por grupo',
            c: 'SELECT grupo_actual, numero_arete, peso_actual_kg\nFROM (\n  SELECT grupo_actual, numero_arete, peso_actual_kg,\n         row_number() OVER (PARTITION BY grupo_actual ORDER BY peso_actual_kg DESC) AS rn\n  FROM v_kardex\n) t\nWHERE rn = 1\nORDER BY grupo_actual;',
          },
          {
            t: 'p',
            c: 'Cambia `rn = 1` por `rn <= 3` y tienes el top 3 de cada grupo. Es una de las consultas más útiles que existen y una pregunta de entrevista clásica.',
          },
          {
            t: 'sql',
            titulo: 'Top 2 pesajes por animal',
            c: 'SELECT numero_arete, fecha, peso_kg\nFROM (\n  SELECT a.numero_arete, p.fecha, p.peso_kg,\n         row_number() OVER (PARTITION BY p.id_animal ORDER BY p.peso_kg DESC) AS rn\n  FROM pesaje p\n  JOIN animal a ON a.id = p.id_animal\n) t\nWHERE rn <= 2\nORDER BY numero_arete, rn\nLIMIT 20;',
          },
          {
            t: 'nota',
            tipo: 'tip',
            titulo: 'Por qué no usar MAX',
            c: 'Para "el máximo por grupo" puedes usar `MAX` con `GROUP BY`, pero entonces pierdes las demás columnas de esa fila (o necesitas un join extra). `row_number()` te da la fila completa, con todas sus columnas.',
          },
          {
            t: 'quiz',
            pregunta: 'Pesos ordenados: 500, 500, 480. ¿Qué devuelve `rank()`?',
            opciones: ['1, 2, 3', '1, 1, 2', '1, 1, 3', '1, 2, 2'],
            correcta: 2,
            explicacion: '`rank()` comparte el 1 entre los empatados y salta el 2, así que el siguiente es 3. `dense_rank()` daría 1, 1, 2.',
          },
        ],
        clave: [
          '`row_number` nunca empata; `rank` salta; `dense_rank` no salta.',
          'El patrón top-N por grupo es `row_number() ... WHERE rn <= N`.',
          'Necesitas una subconsulta para filtrar por la ventana.',
        ],
      },
      {
        id: 'm7-l3',
        titulo: 'LAG, LEAD y acumulados',
        minutos: 11,
        intro: 'Comparar cada pesaje con el anterior es la base de la ganancia diaria de peso. Y el acumulado es la base de los informes.',
        bloques: [
          {
            t: 'p',
            c: '`lag(col)` devuelve el valor de la fila anterior en la ventana; `lead(col)`, el de la siguiente. El orden lo define el `ORDER BY` dentro del `OVER`.',
          },
          {
            t: 'sql',
            titulo: 'Peso anterior y diferencia',
            c: 'SELECT fecha,\n       peso_kg,\n       lag(peso_kg) OVER (ORDER BY fecha) AS peso_anterior,\n       peso_kg - lag(peso_kg) OVER (ORDER BY fecha) AS diferencia\nFROM pesaje\nWHERE id_animal = 1\nORDER BY fecha\nLIMIT 12;',
          },
          {
            t: 'p',
            c: 'La primera fila no tiene anterior: `lag` devuelve `NULL`. Es lo correcto, y puedes cambiar el valor por defecto con `lag(peso_kg, 1, 0)`.',
          },
          { t: 'h', c: 'La vista v_ganancia_peso' },
          {
            t: 'p',
            c: 'El esquema ya trae esta lógica encapsulada en una vista. La ganancia diaria es la diferencia de peso dividida entre los días transcurridos, con `NULLIF` para evitar dividir por cero.',
          },
          {
            t: 'sql',
            titulo: 'Ganancia diaria de un animal',
            c: 'SELECT fecha, peso_kg, ganancia_kg, dias, ganancia_diaria_kg\nFROM v_ganancia_peso\nWHERE id_animal = 1\nORDER BY fecha\nLIMIT 12;',
          },
          {
            t: 'p',
            c: 'Ese `ganancia_diaria_kg` es el indicador que mira cualquier ganadero: cuántos kilos gana el animal por día. Menos de 0,4 kg/día es un problema; más de 0,7 kg/día es un buen engorde.',
          },
          { t: 'h', c: 'Acumulados con ROWS BETWEEN' },
          {
            t: 'p',
            c: 'El **marco** (`frame`) limita qué filas ve la función. `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` significa "desde el principio hasta esta fila": el acumulado clásico.',
          },
          {
            t: 'sql',
            titulo: 'Suma acumulada de pesajes',
            c: 'SELECT fecha,\n       peso_kg,\n       sum(peso_kg) OVER (\n         ORDER BY fecha\n         ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW\n       ) AS acumulado\nFROM pesaje\nWHERE id_animal = 1\nORDER BY fecha\nLIMIT 12;',
          },
          {
            t: 'p',
            c: 'También existe `ROWS BETWEEN 2 PRECEDING AND CURRENT ROW` (media móvil de 3) y `UNBOUNDED FOLLOWING`. Es la base de las medias móviles en series temporales.',
          },
          {
            t: 'nota',
            tipo: 'ojo',
            titulo: 'ROWS frente a RANGE',
            c: '`ROWS` cuenta filas físicas; `RANGE` cuenta valores y agrupa los empates. Con fechas repetidas, `RANGE` puede dar resultados distintos. Para acumulados con empates, `ROWS` suele ser lo que esperas.',
          },
          {
            t: 'quiz',
            pregunta: 'Quieres el acumulado de pesajes día a día. ¿Qué marco usarías?',
            opciones: [
              '`ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`',
              '`ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING`',
              '`ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING`',
              'No hace falta marco',
            ],
            correcta: 0,
            explicacion: 'El acumulado necesita ver desde la primera fila hasta la actual. Sin marco explícito, el comportamiento por defecto con `ORDER BY` es equivalente, pero ser explícito es más claro y seguro.',
          },
        ],
        clave: [
          '`lag`/`lead` acceden a la fila anterior/siguiente de la ventana.',
          '`v_ganancia_peso` es la aplicación real de esta técnica.',
          '`ROWS BETWEEN ...` define el marco de un acumulado o media móvil.',
        ],
      },
    ],
  }
);
