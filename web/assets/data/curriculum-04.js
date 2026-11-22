/* ==========================================================================
   Currículo · parte 4 — Lógica en la base, PostgreSQL real y proyecto final
   ========================================================================== */
window.CURRICULO = window.CURRICULO || [];

window.CURRICULO.push(
  // =========================================================================
  {
    id: 'm11',
    titulo: 'Lógica en la base de datos',
    emoji: '⚙️',
    nivel: 'Avanzado',
    resumen: 'Funciones y disparadores: reglas que se ejecutan solas, incluso si la aplicación se olvida.',
    lecciones: [
      {
        id: 'm11-l1',
        titulo: 'Funciones en PL/pgSQL',
        minutos: 11,
        intro: 'PostgreSQL permite escribir funciones propias y usarlas como si fueran nativas. El esquema trae dos, y son las que hacen cumplir las reglas.',
        bloques: [
          {
            t: 'p',
            c: 'PL/pgSQL es el lenguaje procedural de PostgreSQL: una mezcla de SQL con variables, `IF`, bucles y manejo de errores. Una función se declara con `CREATE FUNCTION` y se invoca como `mi_funcion(args)`.',
          },
          {
            t: 'sql',
            titulo: 'Una función que calcula la edad en meses',
            c: "CREATE OR REPLACE FUNCTION fn_edad_meses(p_fecha date)\nRETURNS integer\nLANGUAGE plpgsql\nAS $$\nBEGIN\n    IF p_fecha IS NULL THEN\n        RETURN NULL;\n    END IF;\n\n    RETURN (\n        date_part('year', age(current_date, p_fecha)) * 12\n        + date_part('month', age(current_date, p_fecha))\n    )::integer;\nEND;\n$$;\n\nSELECT numero_arete, fn_edad_meses(fecha_nacimiento) AS edad_meses\nFROM animal\nWHERE fecha_nacimiento IS NOT NULL\nORDER BY edad_meses DESC\nLIMIT 5;",
          },
          {
            t: 'p',
            c: 'Las piezas: `RETURNS integer` declara el tipo de retorno, `LANGUAGE plpgsql` el lenguaje y el cuerpo va entre `$$` para que las comillas simples del SQL interno no se escapen. `p_fecha` lleva prefijo `p_` por convención, para no confundir parámetros con columnas.',
          },
          {
            t: 'nota',
            tipo: 'info',
            titulo: 'Funciones SQL frente a PL/pgSQL',
            c: 'Si el cuerpo es una sola consulta, puedes escribir `LANGUAGE sql` y ahorrarte el `BEGIN`/`END` y las comillas. Es más simple y el planificador puede optimizarla mejor. Usa PL/pgSQL solo cuando necesites lógica (condiciones, bucles, excepciones).',
          },
          {
            t: 'sql',
            titulo: 'La misma idea, en una función SQL',
            c: "CREATE OR REPLACE FUNCTION fn_mitad(p_numero numeric)\nRETURNS numeric\nLANGUAGE sql\nIMMUTABLE\nAS $$ SELECT round(p_numero / 2, 2) $$;\n\nSELECT codigo, hectareas, fn_mitad(hectareas) AS mitad\nFROM potrero\nORDER BY hectareas DESC\nLIMIT 5;",
          },
          { t: 'h', c: 'Categorías de volatilidad' },
          {
            t: 'tabla',
            cabecera: ['Etiqueta', 'Significado', 'Ejemplo'],
            filas: [
              ['`IMMUTABLE`', 'Mismos argumentos, mismo resultado, siempre.', '`fn_mitad`'],
              ['`STABLE`', 'Dentro de una misma consulta no cambia, pero depende de la base.', 'Leer una tabla'],
              ['`VOLATILE` (por defecto)', 'Puede cambiar en cada llamada.', '`random()`, `now()`'],
            ],
          },
          {
            t: 'p',
            c: 'Marcar una función como `IMMUTABLE` cuando lo es permite al planificador evaluarla una sola vez y usarla en índices. Marcarla mal (como `IMMUTABLE` cuando lee una tabla) puede dar resultados incorrectos.',
          },
          { t: 'h', c: 'Manejo de errores y avisos' },
          {
            t: 'p',
            c: '`RAISE NOTICE \'texto\'` escribe un mensaje sin abortar. `RAISE EXCEPTION` aborta la transacción con un error. El esquema usa `RAISE EXCEPTION` para impedir operaciones sobre animales no activos.',
          },
          {
            t: 'codigo',
            lenguaje: 'sql',
            titulo: 'La función del esquema',
            c: "CREATE OR REPLACE FUNCTION fn_bloquear_animal_inactivo()\nRETURNS TRIGGER AS $$\nDECLARE\n    v_estado VARCHAR(10);\n    v_arete  VARCHAR(20);\nBEGIN\n    SELECT estado, numero_arete INTO v_estado, v_arete\n    FROM animal WHERE id = NEW.id_animal;\n\n    IF v_estado <> 'Activo' THEN\n        RAISE EXCEPTION 'Operación denegada: el animal % tiene estado \"%\".',\n                        v_arete, v_estado;\n    END IF;\n\n    RETURN NEW;\nEND;\n$$ LANGUAGE plpgsql;",
          },
          {
            t: 'p',
            c: 'Lee eso con calma: declara variables, consulta el estado del animal y aborta con un mensaje claro. `NEW` es la fila que se está insertando. La función devuelve `NEW` para que la operación continúe.',
          },
          {
            t: 'quiz',
            pregunta: '¿Cuándo marcarías una función como `IMMUTABLE`?',
            opciones: [
              'Siempre, para que sea más rápida',
              'Cuando el resultado depende solo de los argumentos',
              'Cuando lee una tabla',
              'Cuando usa `now()`',
            ],
            correcta: 1,
            explicacion: '`IMMUTABLE` promete que el resultado no cambia nunca para los mismos argumentos. Si lee una tabla o usa `now()`, debe ser `STABLE` o `VOLATILE`.',
          },
        ],
        clave: [
          '`CREATE FUNCTION ... RETURNS ... LANGUAGE plpgsql` con cuerpo entre `$$`.',
          '`IMMUTABLE`/`STABLE`/`VOLATILE` describen la volatilidad y afectan a la optimización.',
          '`RAISE EXCEPTION` aborta con un mensaje propio.',
        ],
      },
      {
        id: 'm11-l2',
        titulo: 'Triggers: reglas que se ejecutan solas',
        minutos: 12,
        intro: 'Un disparador es código que la base ejecuta cuando alguien inserta, actualiza o borra. Nadie se lo salta.',
        bloques: [
          {
            t: 'p',
            c: 'Un trigger asocia una función a un evento de una tabla. Se dispara **antes** (`BEFORE`) o **después** (`AFTER`) de `INSERT`, `UPDATE` o `DELETE`, y puede ser por fila (`FOR EACH ROW`) o por sentencia.',
          },
          {
            t: 'codigo',
            lenguaje: 'sql',
            titulo: 'El trigger de fecha_baja del esquema',
            c: "CREATE OR REPLACE FUNCTION fn_auto_fecha_baja()\nRETURNS TRIGGER AS $$\nBEGIN\n    IF NEW.activo = FALSE AND OLD.activo = TRUE THEN\n        NEW.fecha_baja = CURRENT_TIMESTAMP;\n    ELSIF NEW.activo = TRUE AND OLD.activo = FALSE THEN\n        NEW.fecha_baja = NULL;\n    END IF;\n    RETURN NEW;\nEND;\n$$ LANGUAGE plpgsql;\n\nCREATE TRIGGER tg_animal_fecha_baja\nBEFORE UPDATE ON animal\nFOR EACH ROW EXECUTE FUNCTION fn_auto_fecha_baja();",
          },
          {
            t: 'p',
            c: 'Traducido: cuando alguien da de baja lógica a un animal (`activo = false`), el trigger escribe la fecha. Cuando lo reactiva, la borra. La aplicación no tiene que acordarse; la base lo garantiza.',
          },
          {
            t: 'nota',
            tipo: 'info',
            titulo: 'BEFORE puede modificar la fila',
            c: 'En un trigger `BEFORE`, `NEW` es mutable: lo que cambies en la función es lo que se guardará. En un `AFTER` ya no puedes cambiar la fila (tendrías que hacer otro `UPDATE`), pero sí puedes auditar o notificar.',
          },
          { t: 'h', c: 'Un trigger de auditoría' },
          {
            t: 'p',
            c: 'El caso de uso clásico: registrar quién cambió qué. Esta es una versión mínima, ejecutable ahora mismo en una transacción que se deshace.',
          },
          {
            t: 'sql',
            titulo: 'Auditar cambios de peso',
            c: "CREATE TABLE auditoria_peso (\n  id         SERIAL PRIMARY KEY,\n  id_pesaje  INT,\n  peso_viejo NUMERIC(6,2),\n  peso_nuevo NUMERIC(6,2),\n  cambiado   TIMESTAMPTZ DEFAULT now()\n);\n\nCREATE OR REPLACE FUNCTION fn_auditar_peso()\nRETURNS TRIGGER AS $$\nBEGIN\n  IF NEW.peso_kg IS DISTINCT FROM OLD.peso_kg THEN\n    INSERT INTO auditoria_peso (id_pesaje, peso_viejo, peso_nuevo)\n    VALUES (OLD.id, OLD.peso_kg, NEW.peso_kg);\n  END IF;\n  RETURN NEW;\nEND;\n$$ LANGUAGE plpgsql;\n\nCREATE TRIGGER tg_auditar_peso\nAFTER UPDATE ON pesaje\nFOR EACH ROW EXECUTE FUNCTION fn_auditar_peso();\n\nUPDATE pesaje SET peso_kg = peso_kg + 5 WHERE id = 1;\n\nSELECT * FROM auditoria_peso;",
          },
          {
            t: 'p',
            c: 'Fíjate en `IS DISTINCT FROM`: es la comparación que trata `NULL` como un valor más. `NULL = NULL` da desconocido; `NULL IS NOT DISTINCT FROM NULL` da verdadero. Imprescindible en auditoría.',
          },
          { t: 'h', c: 'Trigger que impide operaciones' },
          {
            t: 'p',
            c: 'El otro trigger del esquema bloquea pesajes o tratamientos sobre animales que no están activos. Es una regla de negocio en la base, no en la aplicación:',
          },
          {
            t: 'sql',
            titulo: 'Intentar pesar un animal vendido',
            c: "SELECT id, numero_arete, estado FROM animal WHERE estado = 'Vendido' ORDER BY id LIMIT 1;",
          },
          {
            t: 'p',
            c: 'Ahora intenta insertar un pesaje para ese `id`. Sustituye el número que te haya salido:',
          },
          {
            t: 'sql',
            titulo: 'El trigger deniega la operación',
            falla: true,
            c: "INSERT INTO pesaje (id_animal, fecha, peso_kg)\nVALUES (9, CURRENT_DATE, 300);",
          },
          {
            t: 'nota',
            tipo: 'ojo',
            titulo: 'Los triggers tienen coste y sorpresas',
            c: 'Se ejecutan en cada fila afectada, pueden hacer la escritura lenta y, si abusan, convierten la base en una caja negra difícil de depurar. Úsalos para invariantes fuertes (auditoría, fechas automáticas, validaciones críticas), no para toda la lógica del negocio.',
          },
          {
            t: 'quiz',
            pregunta: '¿Qué trigger usarías para calcular un campo derivado antes de guardar la fila?',
            opciones: [
              '`AFTER INSERT`',
              '`BEFORE INSERT` o `BEFORE UPDATE`, modificando `NEW`',
              '`AFTER UPDATE`',
              'Ninguno: usa una aplicación',
            ],
            correcta: 1,
            explicacion: 'Solo en `BEFORE` puedes modificar `NEW` y que el cambio se guarde. En `AFTER` la fila ya está escrita.',
          },
        ],
        clave: [
          'Un trigger ejecuta una función ante `INSERT`/`UPDATE`/`DELETE`.',
          '`BEFORE` puede modificar `NEW`; `AFTER` sirve para auditar.',
          '`IS DISTINCT FROM` compara tratando NULL como valor.',
        ],
      },
    ],
  },

  // =========================================================================
  {
    id: 'm12',
    titulo: 'PostgreSQL en la práctica',
    emoji: '🐘',
    nivel: 'Avanzado',
    resumen: 'Qué cambia entre motores, cómo usar psql y cómo no dejar la puerta abierta.',
    lecciones: [
      {
        id: 'm12-l1',
        titulo: 'Dialectos: lo que cambia entre motores',
        minutos: 10,
        intro: 'El 80 % de SQL es igual en todas partes. El otro 20 % es el que te hace perder una tarde.',
        bloques: [
          {
            t: 'p',
            c: 'Casi todo lo que has aprendido funciona en MySQL, SQL Server u Oracle. Pero hay diferencias que conviene reconocer para no quedarte bloqueado al cambiar de proyecto.',
          },
          {
            t: 'tabla',
            cabecera: ['Necesitas…', 'PostgreSQL', 'MySQL', 'SQL Server'],
            filas: [
              ['Limitar filas', '`LIMIT 10`', '`LIMIT 10`', '`TOP 10`'],
              ['Autoincremental', '`SERIAL` / `IDENTITY`', '`AUTO_INCREMENT`', '`IDENTITY(1,1)`'],
              ['Concatenar texto', '`||` o `concat()`', '`concat()` o `+` no', '`+` o `concat()`'],
              ['Booleano', '`BOOLEAN` nativo', '`TINYINT(1)`', '`BIT`'],
              ['Fechas', "`now()`, `current_date`", '`NOW()`, `CURDATE()`', '`GETDATE()`'],
              ['Truncar fecha', "`date_trunc('month', f)`", '`DATE_FORMAT(f, \'%Y-%m-01\')`', '`DATETRUNC(month, f)`'],
              ['Comillas para texto', 'simples', 'simples', 'simples'],
              ['Identificadores', '`"columna"`', '`` `columna` ``', '`[columna]`'],
              ['Upsert', '`ON CONFLICT DO UPDATE`', '`ON DUPLICATE KEY UPDATE`', '`MERGE`'],
              ['Devolver filas afectadas', '`RETURNING`', 'No (usa `LAST_INSERT_ID()`)', '`OUTPUT`'],
              ['Filtrar agregados', '`FILTER (WHERE ...)`', '`SUM(CASE ...)`', '`SUM(CASE ...)`'],
            ],
          },
          {
            t: 'nota',
            tipo: 'info',
            titulo: 'SQLite, el motor más extendido',
            c: 'SQLite es un archivo con SQL dentro, sin servidor. Tiene `LIMIT`, ventanas y `FILTER`, pero no tipos estrictos ni `SERIAL` (usa `INTEGER PRIMARY KEY AUTOINCREMENT`). Es lo que llevan dentro los móviles y muchas aplicaciones de escritorio.',
          },
          { t: 'h', c: 'Cosas de PostgreSQL que no encontrarás fuera' },
          {
            t: 'lista',
            items: [
              'Índices parciales (`... WHERE activo`), que este esquema usa a fondo.',
              '`FILTER` en agregados y `DISTINCT ON`.',
              'Tipos `JSONB`, `ARRAY`, `RANGE` e índices `GIN`.',
              '`RETURNING` en `INSERT`/`UPDATE`/`DELETE`.',
              'Herencia de tablas y extensiones (`pg_trgm`, `PostGIS`, `pgvector`).',
              '`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` con detalle de buffers.',
            ],
          },
          {
            t: 'sql',
            titulo: 'DISTINCT ON: el más reciente por animal',
            c: 'SELECT DISTINCT ON (id_animal) id_animal, fecha, peso_kg\nFROM pesaje\nORDER BY id_animal, fecha DESC\nLIMIT 10;',
          },
          {
            t: 'p',
            c: '`DISTINCT ON` es una extensión de PostgreSQL que devuelve la primera fila de cada grupo según el `ORDER BY`. Es una alternativa compacta a `row_number()`.',
          },
          {
            t: 'quiz',
            pregunta: '¿Qué sentencia de SQL Server equivale a `SELECT ... LIMIT 10`?',
            opciones: ['`SELECT TOP 10 ...`', '`SELECT ... FETCH 10`', '`SELECT ... ROWNUM <= 10`', '`SELECT ... FIRST 10`'],
            correcta: 0,
            explicacion: 'SQL Server usa `TOP`. Oracle usa `FETCH FIRST 10 ROWS ONLY` (moderno) o `ROWNUM` (antiguo), y PostgreSQL también acepta `FETCH FIRST` como sintaxis estándar.',
          },
        ],
        clave: [
          'El núcleo de SQL es portable; los detalles del dialecto no.',
          '`LIMIT`/`TOP`, `SERIAL`/`AUTO_INCREMENT` y los booleanos son las diferencias más frecuentes.',
          'PostgreSQL tiene extras muy útiles: `RETURNING`, `FILTER`, índices parciales, `JSONB`.',
        ],
      },
      {
        id: 'm12-l2',
        titulo: 'psql, respaldos y seguridad',
        minutos: 11,
        intro: 'Lo que necesitas saber para manejar una base de datos fuera del navegador, sin romper nada.',
        bloques: [
          { t: 'h', c: 'psql, la consola' },
          {
            t: 'p',
            c: '`psql` es el cliente de línea de comandos de PostgreSQL. Es feo y es la herramienta más potente que vas a tener.',
          },
          {
            t: 'tabla',
            cabecera: ['Comando', 'Qué hace'],
            filas: [
              ['`\\l`', 'Lista las bases de datos'],
              ['`\\dt`', 'Lista las tablas'],
              ['`\\d animal`', 'Describe la estructura de una tabla'],
              ['`\\d+ animal`', 'Como `\\d` pero con comentarios y almacenamiento'],
              ['`\\df`', 'Lista las funciones'],
              ['`\\x`', 'Activa la salida expandida (vertical)'],
              ['`\\timing`', 'Muestra el tiempo de cada consulta'],
              ['`\\i archivo.sql`', 'Ejecuta un archivo'],
              ['`\\q`', 'Salir'],
            ],
          },
          {
            t: 'codigo',
            lenguaje: 'bash',
            titulo: 'Conectar y explorar',
            c: "psql -U postgres -d hacienda_practica\n\n\\dt\n\\d animal\nSELECT count(*) FROM animal;\n\\q",
          },
          { t: 'h', c: 'Respaldos' },
          {
            t: 'p',
            c: '`pg_dump` exporta una base a un archivo SQL (o a un formato comprimido). `pg_restore` lo recupera. Es lo mínimo que debes saber antes de tocar datos de producción.',
          },
          {
            t: 'codigo',
            lenguaje: 'bash',
            titulo: 'Copia de seguridad y restauración',
            c: "# copia en SQL plano\npg_dump -U postgres -d hacienda_practica -f hacienda.sql\n\n# copia comprimida (formato custom)\npg_dump -U postgres -d hacienda_practica -Fc -f hacienda.dump\n\n# restaurar en una base nueva\ncreatedb -U postgres hacienda_copia\npg_restore -U postgres -d hacienda_copia hacienda.dump",
          },
          {
            t: 'nota',
            tipo: 'ojo',
            titulo: 'Un respaldo que no se ha restaurado no es un respaldo',
            c: 'Comprueba periódicamente que tus copias se restauran. Es la diferencia entre tener un archivo y tener un seguro.',
          },
          { t: 'h', c: 'Roles y permisos' },
          {
            t: 'p',
            c: 'En PostgreSQL los usuarios se llaman **roles**. Un rol puede tener `LOGIN` (puede conectarse) y pertenecer a grupos. Los permisos se dan sobre objetos con `GRANT` y se quitan con `REVOKE`.',
          },
          {
            t: 'codigo',
            lenguaje: 'sql',
            titulo: 'Un usuario de solo lectura para el veterinario',
            c: "CREATE ROLE vet_lectura LOGIN PASSWORD 'cambiar_esto';\nGRANT CONNECT ON DATABASE hacienda_practica TO vet_lectura;\nGRANT USAGE ON SCHEMA public TO vet_lectura;\nGRANT SELECT ON ALL TABLES IN SCHEMA public TO vet_lectura;\nALTER DEFAULT PRIVILEGES IN SCHEMA public\n  GRANT SELECT ON TABLES TO vet_lectura;",
          },
          { t: 'h', c: 'Inyección SQL' },
          {
            t: 'p',
            c: 'El error de seguridad más famoso. Si tu aplicación construye SQL concatenando texto del usuario, alguien puede colar una sentencia completa.',
          },
          {
            t: 'codigo',
            lenguaje: 'python',
            titulo: 'Nunca hagas esto',
            c: "# MAL: el texto del usuario se interpreta como SQL\ndb.execute(\"SELECT * FROM animal WHERE numero_arete = '\" + arete + \"'\")\n\n# BIEN: parámetros vinculados (prepared statements)\ndb.execute(\"SELECT * FROM animal WHERE numero_arete = %s\", [arete])",
          },
          {
            t: 'p',
            c: 'Con un parámetro, PostgreSQL recibe el valor **aparte** de la sentencia y jamás lo interpreta como código. Es la única defensa que funciona siempre. Y en el navegador, la API de este curso también recibe el SQL como texto: por eso solo escucha en `127.0.0.1` y no debe exponerse a internet.',
          },
          {
            t: 'quiz',
            pregunta: '¿Cuál es la forma correcta de evitar la inyección SQL?',
            opciones: [
              'Escapar las comillas a mano',
              'Usar parámetros vinculados (consultas preparadas)',
              'Confiar en el frontend',
              'Usar `LIKE` en lugar de `=`',
            ],
            correcta: 1,
            explicacion: 'Los parámetros vinculados separan código y datos. Escapar a mano funciona hasta que se te olvida un caso (comillas, barras, codificaciones).',
          },
        ],
        clave: [
          '`\\d`, `\\dt`, `\\df` y `\\timing` hacen la vida fácil en `psql`.',
          '`pg_dump` / `pg_restore` para copias; pruébalas de vez en cuando.',
          '`GRANT`/`REVOKE` para permisos; parámetros vinculados contra la inyección.',
        ],
      },
    ],
  },

  // =========================================================================
  {
    id: 'm13',
    titulo: 'Proyecto final',
    emoji: '🏁',
    nivel: 'Integrador',
    resumen: 'Preguntas reales del hato resueltas con todo lo aprendido, y qué hacer después.',
    lecciones: [
      {
        id: 'm13-l1',
        titulo: 'Ocho preguntas de negocio',
        minutos: 14,
        intro: 'Esto es lo que te pediría el dueño de la hacienda un lunes por la mañana. Cada pregunta combina varias técnicas del curso.',
        bloques: [
          {
            t: 'p',
            c: 'No hay una única respuesta correcta para cada pregunta, pero sí consultas que funcionan y se entienden. Compara las tuyas con estas después de intentarlo.',
          },
          { t: 'h', c: '1. ¿Cuántas cabezas hay realmente en cada potrero?' },
          {
            t: 'sql',
            titulo: 'Ocupación por potrero',
            c: "SELECT p.codigo AS potrero,\n       p.hectareas,\n       count(a.id) AS cabezas,\n       round(count(a.id) / p.hectareas, 2) AS cabezas_por_hectarea\nFROM potrero p\nLEFT JOIN grupo g   ON g.id_potrero = p.id AND g.activo\nLEFT JOIN animal a  ON a.id_grupo = g.id AND a.estado = 'Activo'\nGROUP BY p.codigo, p.hectareas\nORDER BY cabezas_por_hectarea DESC;",
          },
          {
            t: 'p',
            c: 'La carga animal (cabezas por hectárea) es el indicador que decide si un potrero está sobrepastoreado. Fíjate en el `LEFT JOIN` doble: los potreros sin grupos deben aparecer con 0.',
          },
          { t: 'h', c: '2. ¿Qué animales no se pesan hace más de 45 días?' },
          {
            t: 'sql',
            titulo: 'Pesajes atrasados',
            c: "SELECT a.numero_arete,\n       max(p.fecha) AS ultimo_pesaje,\n       current_date - max(p.fecha) AS dias_sin_pesar\nFROM animal a\nLEFT JOIN pesaje p ON p.id_animal = a.id\nWHERE a.estado = 'Activo'\nGROUP BY a.numero_arete\nHAVING max(p.fecha) IS NULL OR max(p.fecha) < current_date - 45\nORDER BY dias_sin_pesar DESC NULLS FIRST\nLIMIT 10;",
          },
          {
            t: 'p',
            c: 'Truco: los animales que nunca se pesaron tienen `max(p.fecha) IS NULL`. `NULLS FIRST` los pone arriba porque son los más urgentes.',
          },
          { t: 'h', c: '3. ¿Cuál es la ganancia diaria promedio por raza?' },
          {
            t: 'sql',
            titulo: 'Eficiencia por raza',
            c: "SELECT r.nombre AS raza,\n       count(DISTINCT g.id_animal) AS animales,\n       round(avg(g.ganancia_diaria_kg), 3) AS gdp_promedio,\n       round(max(g.ganancia_diaria_kg), 3) AS gdp_maxima\nFROM v_ganancia_peso g\nJOIN animal a ON a.id = g.id_animal\nJOIN raza r   ON r.id = a.id_raza\nWHERE g.ganancia_diaria_kg IS NOT NULL\nGROUP BY r.nombre\nORDER BY gdp_promedio DESC;",
          },
          { t: 'h', c: '4. ¿Qué vacunas están pendientes y para qué grupo?' },
          {
            t: 'sql',
            titulo: 'Agenda sanitaria',
            c: "SELECT ps.fecha_programada,\n       ts.nombre AS actividad,\n       coalesce(g.nombre, 'Todo el hato') AS grupo,\n       ps.estado\nFROM programacion_sanitaria ps\nJOIN tipo_sanidad ts ON ts.id = ps.id_tipo_sanidad\nLEFT JOIN grupo g    ON g.id = ps.id_grupo\nWHERE ps.activo AND ps.estado = 'Pendiente'\nORDER BY ps.fecha_programada;",
          },
          { t: 'h', c: '5. ¿Cuál fue el ingreso total por comprador?' },
          {
            t: 'sql',
            titulo: 'Ranking de compradores',
            c: "SELECT c.nombre,\n       count(v.id) AS ventas,\n       sum(v.precio_total) AS ingreso,\n       round(avg(v.precio_total), 2) AS ticket_promedio,\n       rank() OVER (ORDER BY sum(v.precio_total) DESC) AS posicion\nFROM comprador c\nJOIN venta v ON v.id_comprador = c.id\nGROUP BY c.nombre\nORDER BY ingreso DESC;",
          },
          { t: 'h', c: '6. ¿Qué animales se vendieron por debajo del promedio?' },
          {
            t: 'sql',
            titulo: 'Ventas flojas',
            c: "SELECT a.numero_arete, v.fecha, dv.precio_unitario,\n       round(avg(dv.precio_unitario) OVER (), 2) AS promedio_general,\n       round(avg(dv.precio_unitario) OVER () - dv.precio_unitario, 2) AS bajo_promedio\nFROM detalle_venta dv\nJOIN venta v  ON v.id = dv.id_venta\nJOIN animal a ON a.id = dv.id_animal\nORDER BY bajo_promedio DESC;",
          },
          { t: 'h', c: '7. ¿Cómo evolucionó el peso promedio del hato mes a mes?' },
          {
            t: 'sql',
            titulo: 'Serie mensual con variación',
            c: "WITH mensual AS (\n  SELECT date_trunc('month', fecha)::date AS mes,\n         round(avg(peso_kg), 1) AS promedio\n  FROM pesaje\n  GROUP BY 1\n)\nSELECT mes,\n       promedio,\n       lag(promedio) OVER (ORDER BY mes) AS mes_anterior,\n       round(promedio - lag(promedio) OVER (ORDER BY mes), 1) AS variacion\nFROM mensual\nORDER BY mes;",
          },
          {
            t: 'p',
            c: 'CTE + `LAG`: el patrón de cualquier informe de evolución. Cambia la tabla y tienes el mismo informe para ventas, nacimientos o mortalidad.',
          },
          { t: 'h', c: '8. ¿Hay incoherencias entre el sistema y el campo?' },
          {
            t: 'sql',
            titulo: 'Cuadres de inventario',
            c: "SELECT fecha_cuadre,\n       total_sistema,\n       total_contado,\n       diferencia,\n       CASE\n         WHEN diferencia = 0 THEN 'Cuadra'\n         WHEN diferencia < 0 THEN 'Faltan animales'\n         ELSE 'Sobran animales'\n       END AS diagnostico,\n       observaciones\nFROM cuadre_inventario\nORDER BY fecha_cuadre;",
          },
          {
            t: 'nota',
            tipo: 'tip',
            titulo: 'Tu turno',
            c: 'Intenta resolver estas ocho preguntas en el laboratorio antes de mirar las soluciones. Y después invéntate dos más: "¿qué potrero necesita más mantenimiento?" o "¿qué vaca tiene la mejor descendencia?". Ese es el siguiente nivel.',
          },
          {
            t: 'quiz',
            pregunta: 'En la pregunta 2, ¿por qué `NULLS FIRST` es lo correcto?',
            opciones: [
              'Porque los NULL son los animales que nunca se pesaron y son los más urgentes',
              'Porque PostgreSQL lo exige',
              'Porque así ordena más rápido',
              'Porque los NULL siempre van primero',
            ],
            correcta: 0,
            explicacion: 'Un animal sin ningún pesaje tiene prioridad sobre uno pesado hace 60 días. Ordenar por `dias_sin_pesar DESC NULLS FIRST` los coloca arriba.',
          },
        ],
        clave: [
          'Los informes reales combinan CTE, ventanas, `LEFT JOIN` y `CASE`.',
          'La carga animal y la GDP son los dos indicadores clave del negocio.',
          'Siempre hay más de una consulta correcta: prioriza la que se entiende.',
        ],
      },
      {
        id: 'm13-l2',
        titulo: 'Cierre: qué hacer ahora',
        minutos: 6,
        intro: 'Has cubierto más SQL del que usa la mayoría de la gente en su trabajo. Esto es lo que viene después.',
        bloques: [
          {
            t: 'p',
            c: 'Si has llegado hasta aquí ejecutando los ejemplos y resolviendo ejercicios, ya sabes más SQL que mucha gente que lleva años tocando bases de datos. Repasemos el recorrido.',
          },
          {
            t: 'lista',
            items: [
              'Leer y filtrar datos con `SELECT`, `WHERE`, `ORDER BY` y `LIMIT`.',
              'Manejar NULL, funciones de texto, números y fechas.',
              'Resumir con agregados, `GROUP BY`, `HAVING` y `FILTER`.',
              'Combinar tablas con `INNER`, `LEFT`, self joins y anti-joins.',
              'Escribir subconsultas, CTE y recursión.',
              'Calcular rankings y comparaciones con funciones de ventana.',
              'Modificar datos con `INSERT`/`UPDATE`/`DELETE` y transacciones.',
              'Diseñar tablas con restricciones e índices, y entender la normalización.',
              'Leer un plan de ejecución y saber por dónde optimizar.',
              'Escribir funciones y disparadores en PL/pgSQL.',
            ],
          },
          { t: 'h', c: 'Ejercicios que te faltan' },
          {
            t: 'p',
            c: 'La sección de **Ejercicios** tiene 80 retos ordenados por dificultad. Si has hecho las lecciones, empieza por los de nivel 2 y sube. Los de nivel 3 y 4 son los que de verdad consolidan.',
          },
          { t: 'h', c: 'Siguientes pasos, por orden de utilidad' },
          {
            t: 'tabla',
            cabecera: ['Tema', 'Por qué'],
            filas: [
              ['Modelado avanzado', 'Cuándo desnormalizar, tablas de hechos, star schema.'],
              ['Índices especializados', '`GIN`, `GiST`, búsqueda de texto completo.'],
              ['Ventanas avanzadas', '`percentile_cont`, `FILTER` con ventanas, `GROUPS`.'],
              ['Optimización', 'Leer planes complejos, `pg_stat_statements`, conexiones.'],
              ['Migraciones', '`ALTER TABLE` sin bloquear, versionado del esquema.'],
              ['PostgreSQL como servidor', 'Réplicas, particionado, `VACUUM`, backups.'],
            ],
          },
          {
            t: 'nota',
            tipo: 'info',
            titulo: 'La práctica manda',
            c: 'El SQL se aprende escribiendo consultas contra datos que no controlas del todo. Esta hacienda es un buen campo de pruebas: tiene 26 tablas, datos sucios (NULL, duplicados posibles, ventas sin pesaje) y preguntas que no tienen una respuesta obvia. Sigue haciéndote preguntas.',
          },
          {
            t: 'p',
            c: 'Y cuando quieras volver a empezar: el botón **restablecer datos** de la barra lateral devuelve la base a su estado original. Nada de lo que hagas aquí es irreversible.',
          },
          {
            t: 'quiz',
            pregunta: '¿Cuál es la mejor forma de consolidar lo aprendido?',
            opciones: [
              'Leer otro tutorial de principio a fin',
              'Escribir consultas propias contra datos reales y equivocarse',
              'Memorizar la sintaxis',
              'Ver vídeos sin practicar',
            ],
            correcta: 1,
            explicacion: 'El SQL es una habilidad práctica. Equivocarse, leer el error y corregir es el bucle de aprendizaje que funciona.',
          },
        ],
        clave: [
          'Has recorrido el lenguaje completo, de `SELECT` a triggers.',
          'Consolida con los 80 ejercicios, sobre todo los de nivel alto.',
          'Sigue practicando con preguntas propias: el SQL se aprende escribiendo.',
        ],
      },
    ],
  }
);
