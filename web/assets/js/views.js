/* ==========================================================================
   Vistas de la aplicación. Cada función devuelve un elemento DOM listo para
   insertarse en <main id="vista">.
   ========================================================================== */
(function () {
  'use strict';

  const { $, h, escapar, inline, estado, progreso, marcarLeccion, desmarcarLeccion, marcarEjercicio, api, aviso, confirmar } = window.Nucleo;
  const { crearEditor, tablaResultado, cajaError, mensajeAmable, resaltar, copiarTexto } = window.EditorSQL;

  const CURRICULO = () => window.CURRICULO || [];
  const EJERCICIOS = () => window.EJERCICIOS || [];

  const buscarLeccion = (id) => {
    for (const m of CURRICULO()) {
      const l = m.lecciones.find((x) => x.id === id);
      if (l) return { modulo: m, leccion: l };
    }
    return null;
  };

  const leccionesPlanas = () => {
    const out = [];
    CURRICULO().forEach((m) => m.lecciones.forEach((l) => out.push({ modulo: m, leccion: l })));
    return out;
  };

  const puntos = (n) => {
    const caja = h('span', { class: 'puntos-dif', title: 'Dificultad ' + n + ' de 5' });
    for (let i = 1; i <= 5; i++) caja.appendChild(h('i', { class: i <= n ? 'on' : '' }));
    return caja;
  };

  // -------------------------------------------------------------------------
  // Bloques de contenido
  // -------------------------------------------------------------------------
  function renderBloque(b, ctx) {
    switch (b.t) {
      case 'p':
        return h('p', { html: inline(b.c) });
      case 'h':
        return h('h3', { html: inline(b.c) });
      case 'lista': {
        const lista = h(b.ordenada ? 'ol' : 'ul');
        (b.items || []).forEach((i) => lista.appendChild(h('li', { html: inline(i) })));
        return lista;
      }
      case 'cita':
        return h('blockquote', { html: inline(b.c) });
      case 'nota':
        return h('div', { class: 'nota nota--' + (b.tipo || 'info') }, [
          h('div', { class: 'nota__icono', texto: b.tipo === 'ojo' ? '⚠️' : b.tipo === 'error' ? '✕' : b.tipo === 'tip' ? '💡' : 'ℹ️' }),
          h('div', {}, [
            b.titulo ? h('div', { class: 'nota__titulo', texto: b.titulo }) : null,
            h('p', { html: inline(b.c) }),
          ]),
        ]);
      case 'tabla': {
        const t = h('table', { class: 'tabla' });
        const thead = h('thead');
        const tr = h('tr');
        (b.cabecera || []).forEach((c) => tr.appendChild(h('th', { html: inline(c) })));
        thead.appendChild(tr);
        t.appendChild(thead);
        const tbody = h('tbody');
        (b.filas || []).forEach((fila) => {
          const tr2 = h('tr');
          fila.forEach((c) => tr2.appendChild(h('td', { html: inline(c) })));
          tbody.appendChild(tr2);
        });
        t.appendChild(tbody);
        return h('div', { class: 'tabla-envoltura' }, t);
      }
      case 'codigo': {
        const caja = h('div', { class: 'codigo' });
        const cab = h('div', { class: 'codigo__cab' }, [
          h('span', { class: 'puntos' }, [h('i'), h('i'), h('i')]),
          h('span', { class: 'codigo__titulo', texto: b.titulo || b.lenguaje || 'código' }),
        ]);
        const acciones = h('div', { class: 'codigo__acciones' });
        acciones.appendChild(
          h('button', {
            class: 'codigo__btn',
            html: '⧉ Copiar',
            onclick: () => copiarTexto(b.c),
          })
        );
        cab.appendChild(acciones);
        const pre = h('pre');
        pre.appendChild(h('code', { html: b.lenguaje === 'sql' ? resaltar(b.c) : escapar(b.c) }));
        caja.append(cab, pre);
        return caja;
      }
      case 'sql':
        return window.EditorSQL.bloqueEjemplo(b);
      case 'quiz':
        return renderQuiz(b, ctx);
      case 'ejercicio': {
        const ej = EJERCICIOS().find((e) => e.id === b.id);
        if (!ej) return null;
        return h('a', { class: 'tarjeta tarjeta--enlace', href: '#/ejercicio/' + ej.id }, [
          h('div', { class: 'fila', style: 'justify-content:space-between' }, [
            h('span', { class: 'chip chip--acento', texto: 'Ejercicio' }),
            puntos(ej.dificultad),
          ]),
          h('h3', { class: 'mt-1', style: 'margin-bottom:4px', texto: ej.titulo }),
          h('p', { class: 'texto-tenue', style: 'font-size:13.5px;margin:0', texto: ej.enunciado.replace(/`/g, '') }),
        ]);
      }
      default:
        return null;
    }
  }

  function renderQuiz(b, ctx) {
    const clave = (ctx && ctx.claveQuiz) || 'quiz';
    const caja = h('div', { class: 'tarjeta', style: 'border-color:var(--linea-2)' });
    caja.appendChild(h('div', { class: 'chip chip--info mb-1', texto: 'Comprueba que lo entendiste' }));
    caja.appendChild(h('h3', { style: 'font-size:1.06rem;margin-bottom:14px', html: inline(b.pregunta) }));
    const opciones = h('div', { class: 'rejilla', style: 'gap:7px' });
    const explicacion = h('div', { class: 'nota nota--tip', hidden: true, style: 'margin:14px 0 0' });
    if (b.explicacion) {
      explicacion.append(
        h('div', { class: 'nota__icono', texto: '💡' }),
        h('div', {}, [h('div', { class: 'nota__titulo', texto: 'Por qué' }), h('p', { html: inline(b.explicacion) })])
      );
    }
    let respondido = false;
    (b.opciones || []).forEach((op, i) => {
      const boton = h('button', {
        class: 'btn btn--fantasma',
        style: 'justify-content:flex-start;text-align:left;white-space:normal;line-height:1.45;padding:10px 13px',
        html: '<span class="mono" style="opacity:.55;margin-right:8px">' + String.fromCharCode(65 + i) + '</span>' + inline(op),
      });
      boton.addEventListener('click', () => {
        if (respondido) return;
        respondido = true;
        const acierto = i === b.correcta;
        Array.from(opciones.children).forEach((c, j) => {
          c.disabled = true;
          if (j === b.correcta) {
            c.style.borderColor = 'var(--acento)';
            c.style.background = 'var(--acento-suave)';
            c.style.color = 'var(--acento)';
          } else if (j === i) {
            c.style.borderColor = 'var(--peligro)';
            c.style.background = 'var(--peligro-suave)';
            c.style.color = 'var(--peligro)';
          }
        });
        explicacion.hidden = false;
        if (acierto) aviso('Correcto', 'ok');
        const st = estado();
        st.quizzes[clave] = acierto;
        window.Nucleo.guardar();
      });
      opciones.appendChild(boton);
    });
    caja.appendChild(opciones);
    caja.appendChild(explicacion);
    return caja;
  }

  // -------------------------------------------------------------------------
  // Inicio
  // -------------------------------------------------------------------------
  function inicio() {
    const p = progreso();
    const raiz = h('div');
    const st = estado();

    const hero = h('section', { class: 'hero' });
    hero.appendChild(h('span', { class: 'chip chip--acento hero__etiqueta', texto: '● Curso interactivo · PostgreSQL' }));
    hero.appendChild(h('h1', { texto: 'Aprende SQL con una hacienda de verdad' }));
    hero.appendChild(
      h('p', {
        html:
          'Sin ejemplos de <em>clientes</em> y <em>pedidos</em>: aquí hay <strong>80 animales</strong>, 10 potreros, 2.000 pesajes y 26 tablas relacionadas. ' +
          'Escribe consultas, ejecútalas contra PostgreSQL y comprueba si acertaste.',
      })
    );
    const acciones = h('div', { class: 'hero__acciones' });
    const siguiente = siguienteLeccionPendiente();
    if (siguiente) {
      acciones.appendChild(h('a', { class: 'btn btn--primario', href: '#/leccion/' + siguiente.leccion.id }, [texto('▶ Continuar: ' + recortar(siguiente.leccion.titulo, 34))]));
    } else {
      acciones.appendChild(h('a', { class: 'btn btn--primario', href: '#/lecciones' }, '▶ Empezar el curso'));
    }
    acciones.appendChild(h('a', { class: 'btn btn--fantasma', href: '#/playground' }, 'Abrir el laboratorio'));
    acciones.appendChild(h('a', { class: 'btn btn--fantasma', href: '#/ejercicios' }, 'Ver los 80 ejercicios'));
    hero.appendChild(acciones);

    const meta = h('div', { class: 'hero__meta' });
    [
      ['14', 'módulos'],
      ['40', 'lecciones'],
      ['80', 'ejercicios'],
      ['26', 'tablas reales'],
    ].forEach(([n, t]) => meta.appendChild(h('div', { class: 'hero__dato' }, [h('strong', { texto: n }), h('span', { texto: t })])));
    const metaProg = h('div', { class: 'hero__dato' }, [
      h('strong', { texto: p.pct + '%' }),
      h('span', { texto: p.hechas + ' lecciones · ' + p.resueltos + ' ejercicios' }),
    ]);
    meta.appendChild(metaProg);
    hero.appendChild(meta);
    raiz.appendChild(hero);

    // --- Ruta de módulos ---
    raiz.appendChild(
      h('div', { class: 'seccion__cab' }, [
        h('div', {}, [h('h2', { texto: 'La ruta' }), h('p', { texto: 'De la primera consulta a los disparadores. Tú marcas el ritmo.' })]),
        h('a', { class: 'btn btn--fantasma btn--pequeno', href: '#/lecciones', texto: 'Ver todas' }),
      ])
    );
    const rejilla = h('div', { class: 'rejilla rejilla--3' });
    CURRICULO().forEach((m, idx) => {
      const hechas = m.lecciones.filter((l) => st.leccionesCompletadas[l.id]).length;
      const completa = hechas === m.lecciones.length;
      const card = h('a', { class: 'tarjeta tarjeta--enlace', href: '#/lecciones' }, [
        h('div', { class: 'entre' }, [
          h('span', { style: 'font-size:22px', texto: m.emoji }),
          completa ? h('span', { class: 'chip chip--acento', texto: '✓ completo' }) : h('span', { class: 'chip', texto: String(idx).padStart(2, '0') }),
        ]),
        h('h3', { style: 'margin:10px 0 4px;font-size:1.02rem', texto: m.titulo }),
        h('p', { class: 'texto-tenue', style: 'font-size:12.8px;margin:0;line-height:1.5', texto: m.resumen }),
        h('div', { class: 'fila mt-2', style: 'gap:8px' }, [
          h('span', { class: 'chip', texto: m.nivel }),
          h('span', { class: 'chip', texto: m.lecciones.length + ' lecc.' }),
          hechas ? h('span', { class: 'chip chip--acento', texto: hechas + '/' + m.lecciones.length }) : null,
        ]),
      ]);
      rejilla.appendChild(card);
    });
    raiz.appendChild(rejilla);

    // --- Primeras consultas ---
    raiz.appendChild(
      h('div', { class: 'seccion' }, [
        h('div', { class: 'seccion__cab' }, [
          h('div', {}, [h('h2', { texto: 'Prueba ahora' }), h('p', { texto: 'Tres consultas para comprobar que todo funciona.' })]),
        ]),
      ])
    );
    const ejemplos = h('div', { class: 'rejilla' });
    ejemplos.appendChild(
      window.EditorSQL.bloqueEjemplo({
        titulo: '¿Cuántos animales hay de cada estado?',
        c: 'SELECT estado, count(*) AS animales\nFROM animal\nGROUP BY estado\nORDER BY animales DESC;',
      })
    );
    ejemplos.appendChild(
      window.EditorSQL.bloqueEjemplo({
        titulo: 'El resumen oficial del hato',
        c: 'SELECT * FROM v_resumen_grupos;',
      })
    );
    ejemplos.appendChild(
      window.EditorSQL.bloqueEjemplo({
        titulo: 'Los 5 potreros más grandes',
        c: 'SELECT codigo, hectareas, cantidad_atajados\nFROM potrero\nORDER BY hectareas DESC\nLIMIT 5;',
      })
    );
    raiz.appendChild(ejemplos);

    // --- Sigue donde ibas ---
    if (st.ultimaLeccion) {
      const ult = buscarLeccion(st.ultimaLeccion);
      if (ult) {
        raiz.appendChild(
          h('div', { class: 'seccion' }, [
            h('a', { class: 'tarjeta tarjeta--enlace', href: '#/leccion/' + ult.leccion.id }, [
              h('div', { class: 'entre' }, [
                h('div', {}, [
                  h('span', { class: 'chip', texto: ult.modulo.titulo }),
                  h('h3', { style: 'margin:8px 0 2px', texto: ult.leccion.titulo }),
                  h('p', { class: 'texto-tenue', style: 'margin:0;font-size:13px', texto: 'Última lección que abriste' }),
                ]),
                h('span', { class: 'btn btn--fantasma btn--pequeno', texto: 'Retomar →' }),
              ]),
            ]),
          ])
        );
      }
    }

    return raiz;
  }

  function texto(t) {
    return h('span', { texto: t });
  }

  function recortar(t, n) {
    return t.length > n ? t.slice(0, n - 1) + '…' : t;
  }

  function siguienteLeccionPendiente() {
    const st = estado();
    const planas = leccionesPlanas();
    if (st.ultimaLeccion) {
      const i = planas.findIndex((x) => x.leccion.id === st.ultimaLeccion);
      // si la última abierta está sin terminar, seguimos ahí
      if (i >= 0 && !st.leccionesCompletadas[st.ultimaLeccion]) return planas[i];
      // si ya la terminó, buscamos la siguiente pendiente a partir de ahí
      if (i >= 0) {
        const despues = planas.slice(i + 1).find((x) => !st.leccionesCompletadas[x.leccion.id]);
        if (despues) return despues;
      }
    }
    return planas.find((x) => !st.leccionesCompletadas[x.leccion.id]) || planas[0];
  }

  // -------------------------------------------------------------------------
  // Lista de lecciones
  // -------------------------------------------------------------------------
  function lecciones() {
    const raiz = h('div');
    const st = estado();
    raiz.appendChild(
      h('div', { class: 'leccion-cab' }, [
        h('span', { class: 'chip chip--acento', texto: '40 lecciones · 14 módulos' }),
        h('h1', { class: 'mt-1', texto: 'El curso completo' }),
        h('p', { class: 'leccion-cab__intro', texto: 'Cada lección dura entre 6 y 12 minutos, trae ejemplos que puedes ejecutar y termina con una idea que te llevas. El orden importa, pero nada te impide saltar.' }),
      ])
    );

    CURRICULO().forEach((m, idx) => {
      const hechas = m.lecciones.filter((l) => st.leccionesCompletadas[l.id]).length;
      const seccion = h('section', { class: 'seccion' });
      seccion.appendChild(
        h('div', { class: 'seccion__cab' }, [
          h('div', { class: 'fila' }, [
            h('span', { style: 'font-size:24px', texto: m.emoji }),
            h('div', {}, [
              h('h2', { style: 'font-size:1.35rem;margin:0', texto: m.titulo }),
              h('p', { style: 'margin:2px 0 0', texto: m.resumen }),
            ]),
          ]),
          h('span', { class: 'chip', texto: hechas + ' / ' + m.lecciones.length }),
        ])
      );
      const lista = h('div', { class: 'lista-ejercicios' });
      m.lecciones.forEach((l, i) => {
        const hecha = Boolean(st.leccionesCompletadas[l.id]);
        lista.appendChild(
          h('a', { class: 'ejercicio-fila' + (hecha ? ' resuelto' : ''), href: '#/leccion/' + l.id }, [
            h('span', { class: 'ejercicio-fila__estado', texto: hecha ? '✓' : String(i + 1) }),
            h('div', { class: 'ejercicio-fila__cuerpo' }, [
              h('div', { class: 'ejercicio-fila__titulo', texto: l.titulo }),
              h('div', { class: 'ejercicio-fila__meta' }, [
                h('span', { texto: 'Módulo ' + idx + ' · ' + l.minutos + ' min' }),
                l.bloques.some((b) => b.t === 'quiz') ? h('span', { texto: '· incluye quiz' }) : null,
              ]),
            ]),
            h('span', { class: 'texto-tenue', texto: '→' }),
          ])
        );
      });
      seccion.appendChild(lista);
      raiz.appendChild(seccion);
    });
    return raiz;
  }

  // -------------------------------------------------------------------------
  // Lección
  // -------------------------------------------------------------------------
  function leccion(id) {
    const encontrada = buscarLeccion(id);
    if (!encontrada) return noEncontrado('Esa lección no existe.');
    const { modulo, leccion: l } = encontrada;
    const st = estado();
    st.ultimaLeccion = l.id;
    window.Nucleo.guardar();

    const planas = leccionesPlanas();
    const indice = planas.findIndex((x) => x.leccion.id === l.id);
    const anterior = indice > 0 ? planas[indice - 1] : null;
    const siguiente = indice < planas.length - 1 ? planas[indice + 1] : null;

    const raiz = h('article');
    const cab = h('header', { class: 'leccion-cab' });
    cab.appendChild(
      h('div', { class: 'leccion-cab__meta' }, [
        h('span', { class: 'chip', texto: modulo.emoji + ' ' + modulo.titulo }),
        h('span', { texto: l.minutos + ' min de lectura' }),
        h('span', { texto: '·' }),
        h('span', { texto: 'Lección ' + (indice + 1) + ' de ' + planas.length }),
        st.leccionesCompletadas[l.id] ? h('span', { class: 'chip chip--acento', texto: '✓ completada' }) : null,
      ])
    );
    cab.appendChild(h('h1', { texto: l.titulo }));
    if (l.intro) cab.appendChild(h('p', { class: 'leccion-cab__intro', html: inline(l.intro) }));
    raiz.appendChild(cab);

    const cuerpo = h('div', { class: 'prosa' });
    (l.bloques || []).forEach((b, i) => {
      const el = renderBloque(b, { claveQuiz: l.id + '-q' + i });
      if (el) {
        const envoltura = h('div', { class: 'bloque' }, el);
        cuerpo.appendChild(envoltura);
      }
    });
    raiz.appendChild(cuerpo);

    // --- lo que te llevas ---
    if (l.clave && l.clave.length) {
      const caja = h('div', { class: 'tarjeta mt-3', style: 'border-color:var(--linea-2);background:var(--panel)' });
      caja.appendChild(h('div', { class: 'chip chip--acento mb-1', texto: 'Lo que te llevas' }));
      const ul = h('ul', { style: 'margin:6px 0 0;padding-left:18px' });
      l.clave.forEach((c) => ul.appendChild(h('li', { style: 'margin-bottom:4px', html: inline(c) })));
      caja.appendChild(ul);
      raiz.appendChild(caja);
    }

    // --- completar ---
    const completa = Boolean(st.leccionesCompletadas[l.id]);
    const marca = h('div', { class: 'marca-completada' + (completa ? ' completa' : '') });
    marca.appendChild(
      h('div', {}, [
        h('strong', { texto: completa ? 'Lección completada' : '¿Terminaste esta lección?' }),
        h('p', { class: 'texto-tenue', style: 'margin:2px 0 0;font-size:13px', texto: completa ? 'Puedes desmarcarla si quieres repasarla.' : 'Marcarla guarda tu progreso en este navegador.' }),
      ])
    );
    const btnMarca = h('button', {
      class: complejaBoton(completa),
      texto: completa ? 'Desmarcar' : 'Marcar como completada',
    });
    btnMarca.addEventListener('click', () => {
      if (estado().leccionesCompletadas[l.id]) desmarcarLeccion(l.id);
      else marcarLeccion(l.id);
      window.app.actualizarProgreso();
      window.app.refrescar();
    });
    marca.appendChild(btnMarca);
    raiz.appendChild(marca);

    // --- navegación ---
    const nav = h('div', { class: 'navegacion-leccion' });
    if (anterior) {
      nav.appendChild(h('a', { class: 'nav-siguiente', href: '#/leccion/' + anterior.leccion.id }, [h('small', { texto: '← Anterior' }), h('strong', { texto: anterior.leccion.titulo })]));
    } else {
      nav.appendChild(h('span', { class: 'nav-siguiente nav-siguiente--vacio' }));
    }
    if (siguiente) {
      nav.appendChild(h('a', { class: 'nav-siguiente nav-siguiente--der', href: '#/leccion/' + siguiente.leccion.id }, [h('small', { texto: 'Siguiente →' }), h('strong', { texto: siguiente.leccion.titulo })]));
    }
    raiz.appendChild(nav);

    return raiz;
  }

  function complejaBoton(completa) {
    return 'btn ' + (completa ? 'btn--fantasma' : 'btn--primario');
  }

  // -------------------------------------------------------------------------
  // Ejercicios (lista)
  // -------------------------------------------------------------------------
  const filtro = { modulo: 'todos', dificultad: 0, estado: 'todos' };

  function ejercicios() {
    const raiz = h('div');
    const st = estado();
    const total = EJERCICIOS().length;
    const resueltos = EJERCICIOS().filter((e) => st.ejerciciosResueltos[e.id]).length;

    raiz.appendChild(
      h('div', { class: 'leccion-cab' }, [
        h('span', { class: 'chip chip--acento', texto: resueltos + ' / ' + total + ' resueltos' }),
        h('h1', { class: 'mt-1', texto: 'Ejercicios' }),
        h('p', { class: 'leccion-cab__intro', texto: 'Cada ejercicio se corrige comparando tu resultado con el correcto, no tu texto. Puedes llegar por otro camino y aun así acertar.' }),
      ])
    );

    // filtros
    const barra = h('div', { class: 'fila mb-2', style: 'gap:8px' });
    const selModulo = h('select', { class: 'entrada', style: 'width:auto;padding:7px 11px;font-size:13px' });
    selModulo.appendChild(h('option', { value: 'todos', texto: 'Todos los módulos' }));
    CURRICULO().forEach((m) => selModulo.appendChild(h('option', { value: m.id, texto: m.emoji + ' ' + m.titulo })));
    selModulo.value = filtro.modulo;
    selModulo.addEventListener('change', () => { filtro.modulo = selModulo.value; window.app.refrescar(); });

    const selDif = h('select', { class: 'entrada', style: 'width:auto;padding:7px 11px;font-size:13px' });
    [['0', 'Toda dificultad'], ['1', 'Nivel 1'], ['2', 'Nivel 2'], ['3', 'Nivel 3'], ['4', 'Nivel 4'], ['5', 'Nivel 5']].forEach(([v, t]) =>
      selDif.appendChild(h('option', { value: v, texto: t }))
    );
    selDif.value = String(filtro.dificultad);
    selDif.addEventListener('change', () => { filtro.dificultad = Number(selDif.value); window.app.refrescar(); });

    const selEstado = h('select', { class: 'entrada', style: 'width:auto;padding:7px 11px;font-size:13px' });
    [['todos', 'Todos'], ['pendientes', 'Pendientes'], ['resueltos', 'Resueltos']].forEach(([v, t]) =>
      selEstado.appendChild(h('option', { value: v, texto: t }))
    );
    selEstado.value = filtro.estado;
    selEstado.addEventListener('change', () => { filtro.estado = selEstado.value; window.app.refrescar(); });

    barra.append(selModulo, selDif, selEstado);
    raiz.appendChild(barra);

    const lista = EJERCICIOS().filter((e) => {
      if (filtro.modulo !== 'todos' && e.modulo !== filtro.modulo) return false;
      if (filtro.dificultad && e.dificultad !== filtro.dificultad) return false;
      const hecho = Boolean(st.ejerciciosResueltos[e.id]);
      if (filtro.estado === 'pendientes' && hecho) return false;
      if (filtro.estado === 'resueltos' && !hecho) return false;
      return true;
    });

    if (!lista.length) {
      raiz.appendChild(h('div', { class: 'tarjeta centro texto-tenue', texto: 'No hay ejercicios con esos filtros.' }));
      return raiz;
    }

    const contenedor = h('div', { class: 'lista-ejercicios' });
    lista.forEach((e) => {
      const hecho = Boolean(st.ejerciciosResueltos[e.id]);
      const m = CURRICULO().find((x) => x.id === e.modulo);
      contenedor.appendChild(
        h('a', { class: 'ejercicio-fila' + (hecho ? ' resuelto' : ''), href: '#/ejercicio/' + e.id }, [
          h('span', { class: 'ejercicio-fila__estado', texto: hecho ? '✓' : '' }),
          h('div', { class: 'ejercicio-fila__cuerpo' }, [
            h('div', { class: 'ejercicio-fila__titulo', texto: e.titulo }),
            h('div', { class: 'ejercicio-fila__meta' }, [
              h('span', { texto: m ? m.titulo : '' }),
              h('span', { texto: '·' }),
              puntos(e.dificultad),
              h('span', { class: 'chip', texto: e.tipo === 'escritura' ? 'escribe datos' : 'consulta' }),
            ]),
          ]),
          h('span', { class: 'texto-tenue', texto: '→' }),
        ])
      );
    });
    raiz.appendChild(contenedor);
    return raiz;
  }

  // -------------------------------------------------------------------------
  // Ejercicio (detalle)
  // -------------------------------------------------------------------------
  function ejercicio(id) {
    const e = EJERCICIOS().find((x) => x.id === id);
    if (!e) return noEncontrado('Ese ejercicio no existe.');
    const st = estado();
    const indice = EJERCICIOS().findIndex((x) => x.id === id);
    const anterior = indice > 0 ? EJERCICIOS()[indice - 1] : null;
    const siguiente = indice < EJERCICIOS().length - 1 ? EJERCICIOS()[indice + 1] : null;
    const modulo = CURRICULO().find((m) => m.id === e.modulo);
    const hecho = Boolean(st.ejerciciosResueltos[e.id]);

    const raiz = h('div');
    const cab = h('header', { class: 'leccion-cab' });
    cab.appendChild(
      h('div', { class: 'leccion-cab__meta' }, [
        h('a', { class: 'chip', href: '#/ejercicios', texto: modulo ? modulo.titulo : 'Ejercicio' }),
        puntos(e.dificultad),
        h('span', { texto: e.tipo === 'escritura' ? 'Escribe datos (se deshace)' : 'Consulta' }),
        hecho ? h('span', { class: 'chip chip--acento', texto: '✓ resuelto' }) : null,
      ])
    );
    cab.appendChild(h('h1', { texto: e.titulo }));
    raiz.appendChild(cab);

    const consigna = h('div', { class: 'consigna' });
    consigna.appendChild(h('div', { class: 'prosa', html: inline(e.enunciado) }));
    if (e.tablas && e.tablas.length) {
      const chips = h('div', { class: 'fila mt-2', style: 'gap:6px' });
      chips.appendChild(h('span', { class: 'texto-tenue', style: 'font-size:12px', texto: 'Tablas:' }));
      e.tablas.forEach((t) => {
        const existe = ((window.MODELO && window.MODELO.tablas) || []).some((x) => x.nombre === t);
        chips.appendChild(existe ? h('a', { class: 'chip', href: '#/modelo/' + t, texto: t }) : h('span', { class: 'chip', texto: t }));
      });
      consigna.appendChild(chips);
    }
    raiz.appendChild(consigna);

    // pistas
    if (e.pistas && e.pistas.length) {
      const caja = h('div', { class: 'pistas' });
      e.pistas.forEach((p, i) => {
        const d = h('details', { class: 'pista' });
        d.appendChild(h('summary', { texto: 'Pista ' + (i + 1) }));
        d.appendChild(h('div', { html: inline(p) }));
        caja.appendChild(d);
      });
      raiz.appendChild(caja);
    }

    // editor
    const consola = h('div', { class: 'consola mt-3' });
    const cabConsola = h('div', { class: 'consola__cab' }, [
      h('span', { class: 'chip', texto: 'Tu consulta' }),
      h('span', { class: 'texto-tenue', style: 'font-size:11.5px', texto: e.tipo === 'escritura' ? 'se ejecuta y se deshace' : 'PostgreSQL en vivo' }),
    ]);
    const cuerpoConsola = h('div', { class: 'consola__cuerpo' });
    const editor = crearEditor({ valor: '', filas: 7, onEjecutar: () => comprobar() });
    cuerpoConsola.appendChild(editor.el);

    const salida = h('div', { class: 'resultado-ejercicio' });
    const pie = h('div', { class: 'consola__pie' });
    const btnComprobar = h('button', { class: 'btn btn--primario btn--pequeno', texto: '✓ Comprobar' });
    const btnSolucion = h('button', { class: 'btn btn--fantasma btn--pequeno', texto: 'Ver solución' });
    const btnLimpiar = h('button', { class: 'btn btn--fantasma btn--pequeno', texto: 'Limpiar' });
    const atajo = h('span', { class: 'atajo' }, [h('kbd', { texto: 'Ctrl' }), h('span', { texto: '+' }), h('kbd', { texto: '↵' })]);
    pie.append(btnComprobar, btnSolucion, btnLimpiar, atajo);
    consola.append(cabConsola, cuerpoConsola, pie);
    raiz.appendChild(consola);
    raiz.appendChild(salida);

    let solucionVisible = false;
    btnLimpiar.addEventListener('click', () => {
      editor.poner('');
      salida.innerHTML = '';
      editor.marcarError(false);
      editor.enfocar();
    });
    btnSolucion.addEventListener('click', () => {
      if (!solucionVisible) {
        confirmar('Ver la solución', 'Verla antes de intentarlo no te enseña nada. ¿Seguro?', () => {
          solucionVisible = true;
          salida.innerHTML = '';
          const caja = h('div', { class: 'tarjeta mt-2', style: 'border-color:var(--linea-2)' });
          caja.appendChild(h('div', { class: 'chip chip--trigo mb-1', texto: 'Una solución posible' }));
          const pre = h('pre', { style: 'margin:0;overflow-x:auto' });
          pre.appendChild(h('code', { html: resaltar(e.solucion) }));
          caja.appendChild(pre);
          const acciones = h('div', { class: 'fila mt-2' });
          acciones.appendChild(
            h('button', {
              class: 'btn btn--fantasma btn--pequeno',
              texto: 'Copiar al editor',
              onclick: () => { editor.poner(e.solucion); editor.enfocar(); },
            })
          );
          caja.appendChild(acciones);
          salida.appendChild(caja);
        });
      }
    });

    async function comprobar() {
      const sql = editor.obtener().trim();
      if (!sql) {
        aviso('Escribe una consulta primero', 'mal');
        editor.enfocar();
        return;
      }
      btnComprobar.disabled = true;
      btnComprobar.innerHTML = '<span class="salida__cargando"></span> Comprobando…';
      salida.innerHTML = '';
      editor.marcarError(false);
      let r;
      try {
        r = await api.verificar({ sql, solucion: e.solucion, check: e.check || null });
      } catch (err) {
        r = { ok: false, error: { mensaje: 'No se pudo contactar con el servidor.' } };
      }
      btnComprobar.disabled = false;
      btnComprobar.innerHTML = '✓ Comprobar';

      if (!r.ok) {
        salida.appendChild(h('div', { class: 'veredicto veredicto--mal' }, [
          h('span', { class: 'veredicto__icono', texto: '⚠️' }),
          h('div', {}, [h('div', { class: 'veredicto__titulo', texto: 'No se pudo comprobar' }), h('p', { texto: (r.error && r.error.mensaje) || 'Error desconocido.' })]),
        ]));
        return;
      }

      if (r.error) {
        editor.marcarError(true);
        const caja = h('div', { class: 'tarjeta mt-2' });
        caja.appendChild(h('div', { class: 'chip chip--peligro mb-1', texto: 'Tu consulta falló' }));
        caja.appendChild(cajaError(r.error, sql));
        const amable = mensajeAmable(r.error);
        if (amable) caja.appendChild(h('p', { class: 'texto-tenue', style: 'font-size:13px;margin:10px 0 0', texto: amable }));
        salida.appendChild(caja);
        return;
      }

      if (r.coincide) {
        const nuevo = marcarEjercicio(e.id, e.dificultad);
        window.app.actualizarProgreso();
        salida.appendChild(h('div', { class: 'veredicto veredicto--ok' }, [
          h('span', { class: 'veredicto__icono', texto: '🎉' }),
          h('div', {}, [
            h('div', { class: 'veredicto__titulo', texto: '¡Correcto!' + (nuevo ? ' +' + e.dificultad * 10 + ' XP' : '') }),
            h('p', { texto: 'El resultado coincide con el esperado (' + (r.diagnostico ? r.diagnostico.filasEsperadas : '?') + ' filas).' }),
          ]),
        ]));
        if (r.obtenido) {
          const caja = h('div', { class: 'tarjeta mt-2' });
          caja.appendChild(tablaResultado({ columnas: r.obtenido.columnas.map((c) => ({ nombre: c.nombre, tipo: c.tipo })), filas: r.obtenido.filas }));
          salida.appendChild(caja);
        }
        return;
      }

      // incorrecto
      const d = r.diagnostico || {};
      const motivos = {
        'numero-filas': 'Tu consulta devolvió ' + d.filasObtenidas + ' filas y se esperaban ' + d.filasEsperadas + '.',
        'numero-columnas': 'Tu consulta devolvió ' + d.columnasObtenidas + ' columnas y se esperaban ' + d.columnasEsperadas + '.',
        valor: 'Las filas no coinciden con el resultado esperado.',
      };
      salida.appendChild(h('div', { class: 'veredicto veredicto--mal' }, [
        h('span', { class: 'veredicto__icono', texto: '🤔' }),
        h('div', {}, [
          h('div', { class: 'veredicto__titulo', texto: 'Todavía no' }),
          h('p', { texto: motivos[r.motivo] || 'El resultado no coincide.' }),
          r.ordenado ? h('p', { texto: 'Ojo: se esperaba un orden concreto (la solución usa ORDER BY).' }) : null,
        ]),
      ]));

      if (r.esperado) {
        const caja = h('div', { class: 'tarjeta mt-2' });
        caja.appendChild(h('div', { class: 'chip mb-1', texto: 'Resultado esperado (primeras filas)' }));
        caja.appendChild(tablaResultado({ columnas: r.esperado.columnas.map((c) => ({ nombre: c.nombre, tipo: c.tipo })), filas: r.esperado.filas }));
        salida.appendChild(caja);
      }
    }

    btnComprobar.addEventListener('click', comprobar);

    // navegación entre ejercicios
    const nav = h('div', { class: 'navegacion-leccion' });
    if (anterior) nav.appendChild(h('a', { class: 'nav-siguiente', href: '#/ejercicio/' + anterior.id }, [h('small', { texto: '← Anterior' }), h('strong', { texto: anterior.titulo })]));
    else nav.appendChild(h('span', { class: 'nav-siguiente nav-siguiente--vacio' }));
    if (siguiente) nav.appendChild(h('a', { class: 'nav-siguiente nav-siguiente--der', href: '#/ejercicio/' + siguiente.id }, [h('small', { texto: 'Siguiente →' }), h('strong', { texto: siguiente.titulo })]));
    raiz.appendChild(nav);

    return raiz;
  }

  // -------------------------------------------------------------------------
  // Laboratorio
  // -------------------------------------------------------------------------
  async function playground(sqlInicial) {
    const raiz = h('div');
    const st = estado();

    raiz.appendChild(
      h('div', { class: 'leccion-cab' }, [
        h('span', { class: 'chip chip--acento', texto: 'Laboratorio' }),
        h('h1', { class: 'mt-1', texto: 'Tu campo de pruebas' }),
        h('p', { class: 'leccion-cab__intro', texto: 'Aquí las consultas se ejecutan de verdad. Puedes modificar datos y crear tablas: si algo sale mal, restablece los datos.' }),
      ])
    );

    const lab = h('div', { class: 'lab' });
    const lateral = h('div', { class: 'lab__esquema' });
    lateral.appendChild(h('h4', { texto: 'Esquema' }));
    const listaTablas = h('div', { class: 'esquema-lista', id: 'esquema-lista' });
    listaTablas.appendChild(h('div', { class: 'texto-tenue', style: 'font-size:12px;padding:6px', texto: 'Cargando…' }));
    lateral.appendChild(listaTablas);
    lateral.appendChild(h('h4', { texto: 'Historial' }));
    const hist = h('div', { class: 'historial' });
    lateral.appendChild(hist);

    const derecha = h('div');
    const consola = h('div', { class: 'consola' });
    consola.appendChild(
      h('div', { class: 'consola__cab' }, [
        h('span', { class: 'chip', texto: 'SQL libre' }),
        h('span', { class: 'texto-tenue', style: 'font-size:11.5px', texto: 'Ctrl+Enter para ejecutar' }),
      ])
    );
    const cuerpoConsola = h('div', { class: 'consola__cuerpo' });
    const editor = crearEditor({ valor: sqlInicial || 'SELECT numero_arete, nombre, sexo\nFROM animal\nORDER BY numero_arete\nLIMIT 20;', filas: 8, onEjecutar: () => ejecutar() });
    cuerpoConsola.appendChild(editor.el);
    consola.appendChild(cuerpoConsola);
    const pie = h('div', { class: 'consola__pie' });
    const btnEjecutar = h('button', { class: 'btn btn--primario btn--pequeno', texto: '▶ Ejecutar' });
    const btnLimpiar = h('button', { class: 'btn btn--fantasma btn--pequeno', texto: 'Limpiar resultados' });
    pie.append(btnEjecutar, btnLimpiar, h('span', { class: 'atajo' }, [h('kbd', { texto: 'Ctrl' }), h('span', { texto: '+' }), h('kbd', { texto: '↵' })]));
    consola.appendChild(pie);
    derecha.appendChild(consola);

    const salida = h('div', { class: 'mt-2' });
    derecha.appendChild(salida);
    lab.append(lateral, derecha);
    raiz.appendChild(lab);

    function pintarHistorial() {
      hist.innerHTML = '';
      const items = (estado().historial || []).slice(0, 12);
      if (!items.length) {
        hist.appendChild(h('div', { class: 'texto-tenue', style: 'font-size:11.5px;padding:4px 7px', texto: 'Aún no hay consultas.' }));
        return;
      }
      items.forEach((q) => {
        hist.appendChild(
          h('button', {
            texto: q.replace(/\s+/g, ' ').slice(0, 40) + (q.length > 40 ? '…' : ''),
            title: q,
            onclick: () => { editor.poner(q); editor.enfocar(); },
          })
        );
      });
    }
    pintarHistorial();

    async function ejecutar() {
      const sql = editor.obtener().trim();
      if (!sql) return;
      btnEjecutar.disabled = true;
      btnEjecutar.innerHTML = '<span class="salida__cargando"></span> Ejecutando…';
      const r = await api.consulta(sql);
      btnEjecutar.disabled = false;
      btnEjecutar.textContent = '▶ Ejecutar';
      salida.innerHTML = '';
      window.Nucleo.agregarHistorial(sql);
      pintarHistorial();

      if (!r.ok) {
        salida.appendChild(cajaError(r.error, sql));
        const amable = mensajeAmable(r.error);
        if (amable) salida.appendChild(h('div', { class: 'nota nota--ojo', style: 'margin-top:12px' }, [
          h('div', { class: 'nota__icono', texto: '💡' }),
          h('div', {}, [h('div', { class: 'nota__titulo', texto: 'Qué puede estar pasando' }), h('p', { texto: amable })]),
        ]));
        return;
      }
      if (!r.resultados.length) {
        salida.appendChild(h('div', { class: 'salida__estado ok', texto: '✅ Sentencia ejecutada en ' + r.tiempo + ' ms.' }));
        return;
      }
      r.resultados.forEach((rs) => {
        const caja = h('div', { class: 'tarjeta', style: 'padding:0;overflow:hidden' });
        if (rs.comando && !rs.columnas.length) {
          caja.appendChild(h('div', { class: 'salida__estado ok', texto: '✅ ' + rs.comando }));
        } else {
          caja.appendChild(tablaResultado(rs, { tiempo: r.tiempo, truncado: r.truncado }));
        }
        salida.appendChild(caja);
      });
    }

    btnEjecutar.addEventListener('click', ejecutar);
    btnLimpiar.addEventListener('click', () => { salida.innerHTML = ''; });

    // esquema
    try {
      const cat = await api.catalogo();
      listaTablas.innerHTML = '';
      if (!cat.ok) throw new Error('sin catálogo');
      cat.tablas.forEach((nombre) => {
        const cols = cat.columnas[nombre] || [];
        const fks = new Set(cat.relaciones.filter((r) => r.tabla === nombre).map((r) => r.columna));
        const bloque = h('div', { class: 'esquema-tabla' });
        const cab = h('button', { class: 'esquema-tabla__cab' }, [
          h('span', { class: 'flecha', texto: '▶' }),
          h('span', { texto: nombre }),
        ]);
        cab.addEventListener('click', () => bloque.classList.toggle('abierto'));
        const colsCaja = h('div', { class: 'esquema-tabla__cols' });
        cols.forEach((c) => {
          const boton = h('button', { class: 'esquema-col', title: c.tipo }, [
            h('span', { texto: c.columna }),
            c.columna === 'id' ? h('span', { class: 'pk', texto: 'PK' }) : null,
            fks.has(c.columna) ? h('span', { class: 'fk', texto: 'FK' }) : null,
          ]);
          boton.addEventListener('click', (ev) => {
            ev.stopPropagation();
            editor.insertar(c.columna);
          });
          colsCaja.appendChild(boton);
        });
        bloque.append(cab, colsCaja);
        listaTablas.appendChild(bloque);
      });
    } catch (_) {
      listaTablas.innerHTML = '<div class="texto-tenue" style="font-size:12px;padding:6px">No se pudo cargar el esquema.</div>';
    }

    return raiz;
  }

  // -------------------------------------------------------------------------
  // Modelo de datos
  // -------------------------------------------------------------------------
  async function modelo(nombreTabla) {
    const raiz = h('div');
    raiz.appendChild(
      h('div', { class: 'leccion-cab' }, [
        h('span', { class: 'chip chip--acento', texto: '26 tablas · 3 vistas · 34 relaciones' }),
        h('h1', { class: 'mt-1', texto: 'El modelo de datos' }),
        h('p', { class: 'leccion-cab__intro', texto: 'La hacienda completa, tabla por tabla. Pulsa cualquier tabla para ver sus columnas, sus llaves y las reglas que la protegen.' }),
      ])
    );

    let cat = null;
    try {
      cat = await api.catalogo();
    } catch (_) {}

    const modeloDatos = window.MODELO;
    const tablas = modeloDatos.tablas;

    // --- Mapa por grupos ---
    const erd = h('div', { class: 'erd' });
    const lienzo = h('div', { class: 'erd__lienzo' });
    modeloDatos.grupos.forEach((g) => {
      const col = h('div', { class: 'erd-grupo' });
      col.appendChild(h('div', { class: 'erd-grupo__titulo', texto: g.emoji + ' ' + g.titulo }));
      tablas.filter((t) => t.grupo === g.id).forEach((t) => {
        const n = cat && cat.columnas[t.nombre] ? cat.columnas[t.nombre].length : 0;
        col.appendChild(
          h('button', {
            class: 'erd-tabla' + (t.nombre === nombreTabla ? ' activa' : ''),
            onclick: () => { location.hash = '#/modelo/' + t.nombre; },
          }, [
            h('span', { class: 'erd-tabla__num', texto: n ? n + ' col.' : '' }),
            h('span', { class: 'erd-tabla__nombre', texto: t.nombre }),
          ])
        );
      });
      lienzo.appendChild(col);
    });
    erd.appendChild(lienzo);
    raiz.appendChild(erd);

    // --- Detalle ---
    if (nombreTabla) {
      const t = tablas.find((x) => x.nombre === nombreTabla);
      const detalle = h('section', { class: 'seccion' });
      if (!t) {
        detalle.appendChild(h('div', { class: 'tarjeta', texto: 'No hay documentación para ' + nombreTabla + '.' }));
      } else {
        const ficha = h('div', { class: 'ficha-tabla' });
        const cab = h('div', { class: 'ficha-tabla__cab' });
        cab.appendChild(h('h3', { texto: t.nombre }));
        cab.appendChild(h('p', { texto: t.proposito }));
        ficha.appendChild(cab);
        const cuerpo = h('div', { class: 'ficha-tabla__cuerpo' });

        const cols = cat && cat.columnas[t.nombre] ? cat.columnas[t.nombre] : [];
        const fks = cat ? cat.relaciones.filter((r) => r.tabla === t.nombre) : [];
        const salientes = cat ? cat.relaciones.filter((r) => r.refTabla === t.nombre) : [];

        if (!cols.length) {
          cuerpo.appendChild(h('p', { class: 'texto-tenue', texto: 'No se pudo leer el catálogo del servidor. Comprueba que PostgreSQL está en marcha.' }));
        } else {
          const lista = h('div', { class: 'col-lista' });
          cols.forEach((c) => {
            const nota = (t.notas && t.notas[c.columna]) || (c.columna === 'id' ? 'Clave primaria.' : '');
            const esFk = fks.some((f) => f.columna === c.columna);
            const item = h('div', { class: 'col-item' }, [
              h('div', { class: 'col-item__nombre' }, [
                h('span', { texto: c.columna }),
                c.columna === 'id' ? h('span', { class: 'pk', texto: ' PK' }) : null,
                esFk ? h('span', { class: 'fk', texto: ' FK' }) : null,
              ]),
              h('div', { class: 'col-item__tipo', texto: c.tipo + (c.nulo ? '' : ' · NOT NULL') }),
              h('div', { class: 'col-item__notas', texto: nota }),
            ]);
            lista.appendChild(item);
          });
          cuerpo.appendChild(lista);
        }

        if (fks.length) {
          cuerpo.appendChild(h('h4', { class: 'mt-3', texto: 'Apunta a' }));
          const ul = h('ul', { style: 'margin:6px 0 0;padding-left:18px;font-size:13.5px' });
          fks.forEach((f) =>
            ul.appendChild(
              h('li', {}, [
                h('a', { class: 'mono', href: '#/modelo/' + f.refTabla, texto: f.columna }),
                h('span', { class: 'texto-tenue', texto: ' → ' }),
                h('a', { class: 'mono', href: '#/modelo/' + f.refTabla, texto: f.refTabla + '.' + f.refColumna }),
              ])
            )
          );
          cuerpo.appendChild(ul);
        }
        if (salientes.length) {
          cuerpo.appendChild(h('h4', { class: 'mt-3', texto: 'La referencian' }));
          const ul = h('ul', { style: 'margin:6px 0 0;padding-left:18px;font-size:13.5px' });
          salientes.forEach((f) =>
            ul.appendChild(
              h('li', {}, [
                h('a', { class: 'mono', href: '#/modelo/' + f.tabla, texto: f.tabla + '.' + f.columna }),
                h('span', { class: 'texto-tenue', texto: ' → ' }),
                h('span', { class: 'mono', texto: t.nombre + '.' + f.refColumna }),
              ])
            )
          );
          cuerpo.appendChild(ul);
        }

        ficha.appendChild(cuerpo);
        detalle.appendChild(ficha);
        detalle.appendChild(
          h('div', { class: 'fila mt-2' }, [
            h('a', { class: 'btn btn--fantasma btn--pequeno', href: '#/playground', texto: 'Consultar en el laboratorio' }),
            h('button', {
              class: 'btn btn--fantasma btn--pequeno',
              texto: 'Copiar SELECT',
              onclick: () => copiarTexto('SELECT *\nFROM ' + t.nombre + '\nLIMIT 20;'),
            }),
          ])
        );
      }
      raiz.appendChild(detalle);
    }

    // --- Vistas ---
    raiz.appendChild(
      h('section', { class: 'seccion' }, [
        h('h2', { texto: 'Las tres vistas' }),
        h('p', { class: 'texto-tenue', style: 'margin-top:-6px', texto: 'Consultas guardadas que la aplicación usa a diario. No almacenan datos: se recalculan al consultarlas.' }),
        h('div', { class: 'rejilla rejilla--3 mt-2' },
          modeloDatos.vistas.map((v) =>
            h('div', { class: 'tarjeta' }, [
              h('div', { class: 'mono', style: 'color:var(--acento);font-size:13px', texto: v.nombre }),
              h('p', { style: 'font-size:13.3px;margin:8px 0', texto: v.proposito }),
              h('div', { class: 'chip', texto: v.usada }),
            ])
          )
        ),
      ])
    );

    // --- Reglas ---
    raiz.appendChild(
      h('section', { class: 'seccion' }, [
        h('h2', { texto: 'Reglas que viven en la base' }),
        h('p', { class: 'texto-tenue', style: 'margin-top:-6px', texto: 'Restricciones y disparadores que se aplican aunque la aplicación tenga un bug.' }),
        h('div', { class: 'rejilla rejilla--2 mt-2' },
          modeloDatos.reglas.map((r) =>
            h('div', { class: 'tarjeta' }, [
              h('div', { class: 'chip chip--acento mb-1', texto: r.objeto }),
              h('strong', { texto: r.nombre }),
              h('p', { style: 'font-size:13.3px;margin:6px 0 0', texto: r.detalle }),
            ])
          )
        ),
      ])
    );

    return raiz;
  }

  // -------------------------------------------------------------------------
  // Chuleta
  // -------------------------------------------------------------------------
  function chuleta(filtroInicial) {
    const raiz = h('div');
    raiz.appendChild(
      h('div', { class: 'leccion-cab' }, [
        h('span', { class: 'chip chip--acento', texto: 'Referencia' }),
        h('h1', { class: 'mt-1', texto: 'La chuleta' }),
        h('p', { class: 'leccion-cab__intro', texto: 'Todo el SQL del curso en una página. Busca un comando o desplázate por las categorías.' }),
      ])
    );

    const entrada = h('input', { class: 'entrada chuleta-busca', type: 'search', placeholder: 'Buscar: LEFT JOIN, coalesce, índice, fecha…', value: filtroInicial || '' });
    raiz.appendChild(entrada);
    const contenedor = h('div');
    raiz.appendChild(contenedor);

    function pintar(texto) {
      contenedor.innerHTML = '';
      const q = window.Nucleo.normalizarBusqueda(texto || '');
      let encontrados = 0;
      (window.CHULETA || []).forEach((g) => {
        const items = g.items.filter((it) => {
          if (!q) return true;
          return window.Nucleo.normalizarBusqueda(it.titulo + ' ' + it.descripcion + ' ' + it.codigo).includes(q);
        });
        if (!items.length) return;
        encontrados += items.length;
        const sec = h('div', { class: 'chuleta-grupo' });
        sec.appendChild(h('h3', {}, [h('span', { texto: g.emoji }), h('span', { texto: g.titulo })]));
        items.forEach((it) => {
          const fila = h('div', { class: 'chuleta-item' });
          fila.appendChild(h('div', { class: 'entre' }, [
            h('strong', { style: 'font-size:14px', texto: it.titulo }),
            h('button', { class: 'btn btn--fantasma btn--pequeno', texto: 'Copiar', onclick: () => copiarTexto(it.codigo) }),
          ]));
          fila.appendChild(h('div', { class: 'chuleta-item__desc', texto: it.descripcion }));
          const pre = h('pre');
          pre.appendChild(h('code', { html: resaltar(it.codigo) }));
          fila.appendChild(pre);
          sec.appendChild(fila);
        });
        contenedor.appendChild(sec);
      });
      if (!encontrados) {
        contenedor.appendChild(h('div', { class: 'tarjeta centro texto-tenue', texto: 'Nada por aquí. Prueba con otra palabra.' }));
      }
    }

    entrada.addEventListener('input', () => pintar(entrada.value));
    pintar(filtroInicial || '');
    setTimeout(() => { if (filtroInicial) entrada.focus(); }, 50);
    return raiz;
  }

  // -------------------------------------------------------------------------
  function noEncontrado(msg) {
    return h('div', { class: 'tarjeta centro' }, [
      h('h2', { texto: 'Ups' }),
      h('p', { class: 'texto-tenue', texto: msg }),
      h('a', { class: 'btn btn--primario mt-2', href: '#/inicio', texto: 'Volver al inicio' }),
    ]);
  }

  window.Vistas = { inicio, lecciones, leccion, ejercicios, ejercicio, playground, modelo, chuleta };
})();
