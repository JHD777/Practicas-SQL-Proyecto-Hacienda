/* ==========================================================================
   Editor SQL: resaltado de sintaxis, numeración de líneas y tabla de
   resultados reutilizable (lecciones, ejercicios y laboratorio).
   ========================================================================== */
(function () {
  'use strict';

  const { h, escapar } = window.Nucleo;

  // ------------------------------- Resaltado -------------------------------

  const PALABRAS = new Set((
    'select from where group by order having limit offset join inner left right full outer cross on using as ' +
    'and or not null is in between like ilike similar distinct union intersect except all any some exists ' +
    'case when then else end with recursive insert into values update set delete returning create table view ' +
    'index alter add drop constraint primary key foreign references unique check default cascade restrict ' +
    'trigger function returns language begin declare if elsif else loop for while raise exception perform ' +
    'over partition rows range groups preceding following unbounded current row filter within materialized ' +
    'explain analyze vacuum grant revoke to public role user database schema sequence type domain replace ' +
    'temporary temp if exists only lateral asc desc nulls first last do instead before after each statement ' +
    'execute procedure call commit rollback savepoint transaction read write concurrency conflict nothing ' +
    'generated always stored identity start increment minvalue maxvalue cycle owned rename column table ' +
    'truncate comment owner search_path work isolation level serializable repeatable snapshot ' +
    'returning window qualify '
  ).split(/\s+/).filter(Boolean));

  const FUNCIONES = new Set((
    'count sum avg min max round ceil floor abs mod power sqrt coalesce nullif cast lower upper trim btrim ltrim rtrim ' +
    'length char_length substring substr concat concat_ws replace split_part position strpos left right lpad rpad ' +
    'now current_date current_time current_timestamp localtimestamp age date_trunc date_part extract to_char to_date ' +
    'to_timestamp make_date make_interval interval justify_days row_number rank dense_rank percent_rank cume_dist ' +
    'ntile lag lead first_value last_value nth_value string_agg array_agg json_agg jsonb_agg jsonb_build_object ' +
    'bool_and bool_or every greatest least generate_series date_series random md5 gen_random_uuid setval nextval ' +
    'currval pg_get_serial_sequence pg_typeof format query_to_xml xpath xmlagg array_position array_length ' +
    'unnest cardinality regexp_replace regexp_matches starts_with width_bucket trunc sign exp ln log pi degrees ' +
    'radians ascii chr repeat reverse translate initcap quote_ident quote_literal pg_catalog count_big sum_big ' +
    'stddev variance percentile_cont mode percentile_disc '
  ).split(/\s+/).filter(Boolean));

  const TIPOS = new Set((
    'int integer bigint smallint serial bigserial text varchar char character numeric decimal real double precision ' +
    'boolean bool date timestamp timestamptz time timetz interval json jsonb uuid bytea money inet cidr macaddr ' +
    'smallserial float8 float4 int2 int4 int8 oid regclass '
  ).split(/\s+/).filter(Boolean));

  const RE_TOKEN = new RegExp(
    [
      '(--[^\\n]*)',                        // 1 comentario de línea
      '(/\\*[\\s\\S]*?\\*/)',               // 2 comentario de bloque
      "('(?:[^']|'')*')",                   // 3 cadena
      '("(?:[^"]|"")*")',                   // 4 identificador entrecomillado
      '(\\$[A-Za-z_0-9]*\\$[\\s\\S]*?\\$[A-Za-z_0-9]*\\$)', // 5 dollar quoting
      '(\\b\\d+(?:\\.\\d+)?\\b)',           // 6 número
      '([A-Za-z_][A-Za-z_0-9$]*)',          // 7 palabra
      '([^\\sA-Za-z0-9_$\'"]+)',            // 8 resto
    ].join('|'),
    'g'
  );

  function resaltar(sql) {
    let salida = '';
    let ultimo = 0;
    let m;
    RE_TOKEN.lastIndex = 0;
    while ((m = RE_TOKEN.exec(sql)) !== null) {
      if (m.index > ultimo) salida += escapar(sql.slice(ultimo, m.index));
      const t = m[0];
      let clase = '';
      if (m[1] || m[2]) clase = 'tk-c';
      else if (m[3] || m[4] || m[5]) clase = 'tk-s';
      else if (m[6]) clase = 'tk-n';
      else if (m[7]) {
        const baja = t.toLowerCase();
        if (PALABRAS.has(baja)) clase = 'tk-k';
        else if (TIPOS.has(baja)) clase = 'tk-t';
        else if (FUNCIONES.has(baja)) clase = 'tk-f';
      } else if (m[8]) clase = 'tk-p';
      salida += clase ? '<span class="' + clase + '">' + escapar(t) + '</span>' : escapar(t);
      ultimo = RE_TOKEN.lastIndex;
    }
    salida += escapar(sql.slice(ultimo));
    return salida;
  }

  // --------------------------- Tabla de resultados --------------------------

  function valorCelda(valor, numerico) {
    if (valor === null || valor === undefined) return '<span class="nulo">NULL</span>';
    if (typeof valor === 'boolean') {
      return valor ? '<span class="bool-t">true</span>' : '<span class="bool-f">false</span>';
    }
    if (typeof valor === 'number') {
      if (Number.isInteger(valor)) return valor.toLocaleString('es-BO');
      return valor.toLocaleString('es-BO', { maximumFractionDigits: 4 });
    }
    const texto = escapar(String(valor));
    if (numerico) return texto;
    return texto;
  }

  function tablaResultado(conjunto, opciones) {
    const opts = opciones || {};
    if (!conjunto || !conjunto.columnas) return h('div', { class: 'pie-tabla', texto: 'Sin resultados.' });
    if (!conjunto.filas.length) {
      return h('div', { class: 'salida__estado ok' }, '✅ La consulta se ejecutó correctamente y no devolvió filas.');
    }
    const tabla = h('table', { class: 'tabla-res' });
    const thead = h('thead');
    const fila = h('tr');
    conjunto.columnas.forEach((c) => {
      fila.appendChild(
        h('th', { html: escapar(c.nombre) + '<span class="tipo">' + escapar(c.tipo || '') + '</span>' })
      );
    });
    thead.appendChild(fila);
    tabla.appendChild(thead);
    const tbody = h('tbody');
    conjunto.filas.forEach((f) => {
      const tr = h('tr');
      f.forEach((v, i) => {
        const col = conjunto.columnas[i] || {};
        tr.appendChild(
          h('td', { class: col.numerico || typeof v === 'number' ? 'num' : '', html: valorCelda(v, col.numerico) })
        );
      });
      tbody.appendChild(tr);
    });
    tabla.appendChild(tbody);

    const caja = h('div');
    caja.appendChild(h('div', { class: 'tabla-envoltura' }, tabla));
    const pie = h('div', { class: 'pie-tabla' });
    pie.appendChild(h('span', { texto: conjunto.filas.length + (conjunto.filas.length === 1 ? ' fila' : ' filas') }));
    if (opts.tiempo !== undefined) {
      pie.appendChild(h('span', { class: 'sep', texto: '·' }));
      pie.appendChild(h('span', { texto: opts.tiempo + ' ms' }));
    }
    if (opts.truncado) {
      pie.appendChild(h('span', { class: 'chip chip--trigo', texto: 'vista parcial' }));
    }
    const copiar = h('button', {
      class: 'btn btn--fantasma btn--pequeno',
      texto: 'Copiar CSV',
      onclick: () => {
        const csv = [conjunto.columnas.map((c) => c.nombre).join(',')]
          .concat(
            conjunto.filas.map((f) =>
              f.map((v) => {
                const s = v === null ? '' : String(v);
                return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
              }).join(',')
            )
          )
          .join('\n');
        copiarTexto(csv);
      },
    });
    pie.appendChild(copiar);
    caja.appendChild(pie);
    return caja;
  }

  function copiarTexto(texto) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texto).then(
        () => window.Nucleo.aviso('Copiado al portapapeles', 'ok'),
        () => window.Nucleo.aviso('No se pudo copiar', 'mal')
      );
    } else {
      const ta = document.createElement('textarea');
      ta.value = texto;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); window.Nucleo.aviso('Copiado al portapapeles', 'ok'); } catch (_) {}
      ta.remove();
    }
  }

  // --------------------------- Caja de error SQL ----------------------------

  function cajaError(error, sql) {
    const caja = h('div', { class: 'error-caja' });
    caja.appendChild(
      h('div', { class: 'error-caja__titulo' }, [h('span', { texto: '✕' }), h('span', { texto: 'Error de PostgreSQL' })])
    );
    caja.appendChild(h('div', { class: 'error-caja__msg', texto: error.mensaje || 'Error desconocido' }));

    if (error.detalle) {
      caja.appendChild(h('div', { class: 'error-caja__msg', texto: 'Detalle: ' + error.detalle }));
    }
    if (error.pista) {
      caja.appendChild(h('div', { class: 'error-caja__msg', texto: 'Pista: ' + error.pista }));
    }
    if (sql && error.posicion) {
      const hasta = sql.slice(0, error.posicion - 1);
      const linea = hasta.split('\n').length;
      const columna = hasta.length - hasta.lastIndexOf('\n');
      const lineas = sql.split('\n');
      const textoLinea = lineas[linea - 1] || '';
      const puntero = ' '.repeat(Math.max(0, columna - 1)) + '^';
      caja.appendChild(
        h('div', { class: 'error-caja__puntero', html: escapar(textoLinea) + '\n<span class="linea-mala">' + escapar(puntero) + '</span>' })
      );
    }
    const meta = h('div', { class: 'error-caja__meta' });
    if (error.codigo) meta.appendChild(h('span', { texto: 'SQLSTATE ' + error.codigo }));
    if (error.restriccion) meta.appendChild(h('span', { texto: 'restricción ' + error.restriccion }));
    if (error.posicion) meta.appendChild(h('span', { texto: 'posición ' + error.posicion }));
    caja.appendChild(meta);
    return caja;
  }

  function mensajeAmable(error) {
    const porCodigo = {
      '42601': 'Hay un error de sintaxis. Revisa comas, paréntesis y palabras clave.',
      '42P01': 'Esa tabla no existe. Comprueba el nombre (o usa el panel de esquema).',
      '42703': 'Esa columna no existe en las tablas que estás consultando.',
      '42883': 'Esa función no existe o los tipos de sus argumentos no coinciden.',
      '22P02': 'Un valor no se puede convertir al tipo esperado (por ejemplo, texto a número).',
      '23505': 'Estás intentando insertar un valor duplicado en una columna UNIQUE.',
      '23503': 'Una llave foránea no encuentra su referencia, o intentas borrar algo en uso.',
      '23514': 'Se violó una regla de validación (CHECK) de la tabla.',
      '22012': 'División por cero.',
      '42P07': 'Ese objeto ya existe.',
      '42501': 'No tienes permisos para esa operación.',
      '25P02': 'La transacción quedó abortada por un error anterior.',
    };
    if (porCodigo[error.codigo]) return porCodigo[error.codigo];
    if (/permission denied/i.test(error.mensaje || '')) return 'No hay permisos suficientes para esa operación.';
    if (/does not exist|no existe/i.test(error.mensaje || '')) return 'El objeto que mencionas no existe. Revisa los nombres.';
    if (/syntax/i.test(error.mensaje || '')) return 'Revisa la sintaxis de la consulta.';
    return null;
  }

  // ------------------------------- Editor ----------------------------------

  let contadorEditor = 0;

  function crearEditor(opciones) {
    const opts = Object.assign({ valor: '', filas: 3, onEjecutar: null, placeholder: '-- Escribe tu consulta aquí' }, opciones || {});
    const id = 'ed' + ++contadorEditor;

    const numeros = h('div', { class: 'editor__gutter-in' });
    const gutter = h('div', { class: 'editor__gutter' }, numeros);
    const pre = h('pre', { class: 'editor__pre', 'aria-hidden': 'true' });
    const codigo = h('code');
    pre.appendChild(codigo);
    const textarea = h('textarea', {
      class: 'editor__textarea',
      spellcheck: 'false',
      autocapitalize: 'off',
      autocomplete: 'off',
      autocorrect: 'off',
      wrap: 'off',
      placeholder: opts.placeholder,
      'aria-label': 'Editor de SQL',
    });
    const area = h('div', { class: 'editor__area' }, [pre, textarea]);
    const el = h('div', { class: 'editor' + (opts.filas <= 3 ? ' editor--chico' : '') }, [gutter, area]);
    el.dataset.id = id;

    let valorActual = '';

    function pintar() {
      codigo.innerHTML = resaltar(valorActual) + '\n';
      const lineas = valorActual.split('\n').length;
      const total = Math.max(opts.filas || 3, lineas);
      let nums = '';
      for (let i = 1; i <= total; i++) nums += i + '\n';
      numeros.textContent = nums;
      // altura
      const alto = Math.max((opts.filas || 3) * 21 + 26, lineas * 21 + 26);
      textarea.style.height = alto + 'px';
      pre.style.height = alto + 'px';
    }

    function sincronizar() {
      pre.scrollTop = textarea.scrollTop;
      pre.scrollLeft = textarea.scrollLeft;
      numeros.style.transform = 'translateY(' + -textarea.scrollTop + 'px)';
    }

    function poner(v) {
      valorActual = v == null ? '' : String(v);
      textarea.value = valorActual;
      pintar();
      sincronizar();
    }

    textarea.addEventListener('input', () => {
      valorActual = textarea.value;
      pintar();
      sincronizar();
    });
    textarea.addEventListener('scroll', sincronizar);
    textarea.addEventListener('keydown', (ev) => {
      if ((ev.ctrlKey || ev.metaKey) && ev.key === 'Enter') {
        ev.preventDefault();
        if (opts.onEjecutar) opts.onEjecutar(obtener());
        return;
      }
      if (ev.key === 'Tab') {
        ev.preventDefault();
        const ini = textarea.selectionStart;
        const fin = textarea.selectionEnd;
        const v = textarea.value;
        if (ev.shiftKey) {
          const antes = v.lastIndexOf('\n', ini - 1) + 1;
          if (v.slice(antes, antes + 2) === '  ') {
            textarea.value = v.slice(0, antes) + v.slice(antes + 2);
            textarea.selectionStart = textarea.selectionEnd = Math.max(antes, ini - 2);
          }
        } else {
          textarea.value = v.slice(0, ini) + '  ' + v.slice(fin);
          textarea.selectionStart = textarea.selectionEnd = ini + 2;
        }
        valorActual = textarea.value;
        pintar();
        sincronizar();
      }
    });

    function obtener() {
      return textarea.value;
    }

    poner(opts.valor);

    return {
      el,
      textarea,
      obtener,
      poner,
      enfocar: () => textarea.focus(),
      enfocarFinal: () => {
        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = textarea.value.length;
      },
      insertar(texto) {
        const ini = textarea.selectionStart;
        const fin = textarea.selectionEnd;
        textarea.value = textarea.value.slice(0, ini) + texto + textarea.value.slice(fin);
        textarea.selectionStart = textarea.selectionEnd = ini + texto.length;
        valorActual = textarea.value;
        pintar();
        sincronizar();
        textarea.focus();
      },
      marcarError(activo) {
        el.classList.toggle('editor--error', Boolean(activo));
      },
      setAlturaFilas(n) {
        opts.filas = n;
        pintar();
      },
    };
  }

  // --------------------- Bloque de ejemplo ejecutable ----------------------

  function bloqueEjemplo(bloque) {
    const envoltura = h('div', { class: 'codigo' });
    const cab = h('div', { class: 'codigo__cab' });
    cab.appendChild(h('span', { class: 'puntos' }, [h('i'), h('i'), h('i')]));
    cab.appendChild(h('span', { class: 'codigo__titulo', texto: bloque.titulo || 'Ejemplo' }));
    const acciones = h('div', { class: 'codigo__acciones' });

    const btnCopiar = h('button', {
      class: 'codigo__btn',
      html: '⧉ Copiar',
      title: 'Copiar el código',
      onclick: () => copiarTexto(bloque.c),
    });
    const btnLab = h('button', {
      class: 'codigo__btn',
      html: '↗ Laboratorio',
      title: 'Abrir este ejemplo en el laboratorio',
      onclick: () => {
        location.hash = '#/playground?sql=' + encodeURIComponent(bloque.c);
      },
    });
    const btnEjecutar = h('button', {
      class: 'codigo__btn',
      html: '▶ Ejecutar',
      title: 'Ejecutar contra la base de datos',
    });
    acciones.append(btnCopiar, btnLab, btnEjecutar);
    cab.appendChild(acciones);

    const pre = h('pre');
    pre.appendChild(h('code', { html: resaltar(bloque.c) }));
    envoltura.append(cab, pre);

    const salida = h('div', { class: 'salida', hidden: true });
    envoltura.appendChild(salida);

    let ejecutado = false;
    btnEjecutar.addEventListener('click', async () => {
      salida.hidden = false;
      if (ejecutado) {
        ejecutado = false;
        salida.innerHTML = '';
        salida.hidden = true;
        btnEjecutar.innerHTML = '▶ Ejecutar';
        return;
      }
      salida.innerHTML = '';
      salida.appendChild(h('div', { class: 'salida__estado' }, [h('span', { class: 'salida__cargando' }), h('span', { texto: 'Ejecutando…' })]));
      const r = await window.Nucleo.api.ensayo(bloque.c);
      salida.innerHTML = '';
      if (!r.ok) {
        const est = h('div', { class: 'salida__estado error' }, '✕ La consulta falló');
        salida.append(est, cajaError(r.error, bloque.c));
        const amable = mensajeAmable(r.error);
        if (amable) salida.appendChild(h('div', { class: 'pie-tabla', texto: amable }));
        return;
      }
      const ultimo = r.resultados[r.resultados.length - 1];
      if (!ultimo) {
        salida.appendChild(h('div', { class: 'salida__estado ok' }, '✅ Sentencia ejecutada (' + r.tiempo + ' ms) · sin cambios permanentes'));
        return;
      }
      salida.appendChild(tablaResultado(ultimo, { tiempo: r.tiempo, truncado: r.truncado }));
      if (r.revertido) salida.appendChild(h('div', { class: 'pie-tabla', texto: '↺ Ejecutado en una transacción que se deshizo: la base quedó igual.' }));
      ejecutado = true;
      btnEjecutar.innerHTML = '✕ Ocultar';
    });

    return envoltura;
  }

  window.EditorSQL = {
    resaltar,
    crearEditor,
    tablaResultado,
    cajaError,
    mensajeAmable,
    bloqueEjemplo,
    copiarTexto,
  };
})();
