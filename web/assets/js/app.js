/* ==========================================================================
   Arranque, router por hash, barra lateral, buscador y ajustes.
   ========================================================================== */
(function () {
  'use strict';

  const { $, $$, h, escapar, inline, estado, progreso, api, aviso, confirmar, cerrarModal } = window.Nucleo;

  let rutaActual = '';
  let tokenRender = 0;
  let indice = [];

  // -------------------------------------------------------------------------
  // Tema
  // -------------------------------------------------------------------------
  function aplicarTema(tema) {
    document.documentElement.setAttribute('data-tema', tema);
    const st = estado();
    st.tema = tema;
    window.Nucleo.guardar();
  }

  function temaInicial() {
    const st = estado();
    if (st.tema) return st.tema;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'claro' : 'oscuro';
  }

  // -------------------------------------------------------------------------
  // Progreso en la barra lateral
  // -------------------------------------------------------------------------
  function actualizarProgreso() {
    const p = progreso();
    const circulo = $('#aro-circulo');
    if (circulo) {
      const circunferencia = 2 * Math.PI * 18;
      circulo.style.strokeDasharray = String(circunferencia);
      circulo.style.strokeDashoffset = String(circunferencia * (1 - p.pct / 100));
    }
    const textoAro = $('#aro-texto');
    if (textoAro) textoAro.textContent = p.pct + '%';
    const l = $('#progreso-lecciones');
    if (l) l.textContent = p.hechas + ' / ' + p.totalLecciones + ' lecciones';
    const e = $('#progreso-ejercicios');
    if (e) e.textContent = p.resueltos + ' / ' + p.totalEjercicios + ' ejercicios';
    const bl = $('#badge-lecciones');
    if (bl) bl.textContent = p.hechas + '/' + p.totalLecciones;
    const be = $('#badge-ejercicios');
    if (be) be.textContent = p.resueltos + '/' + p.totalEjercicios;
    marcarNavActivo();
  }

  // -------------------------------------------------------------------------
  // Navegación de módulos
  // -------------------------------------------------------------------------
  function construirNavModulos() {
    const caja = $('#modulos-nav');
    if (!caja) return;
    const st = estado();
    caja.innerHTML = '';
    caja.appendChild(h('div', { class: 'modulos-nav__titulo', texto: 'Contenido del curso' }));
    (window.CURRICULO || []).forEach((m) => {
      const hechas = m.lecciones.filter((x) => st.leccionesCompletadas[x.id]).length;
      const activo = location.hash.includes('/leccion/' + m.id + '-');
      const bloque = h('div', { class: 'modulo-nav' + (activo ? ' abierto' : '') });
      const cab = h('button', { class: 'modulo-nav__cab' }, [
        h('span', { class: 'modulo-nav__emoji', texto: m.emoji }),
        h('span', { class: 'modulo-nav__nombre', texto: m.titulo }),
        h('span', { class: 'modulo-nav__cuenta', texto: hechas + '/' + m.lecciones.length }),
      ]);
      cab.addEventListener('click', () => bloque.classList.toggle('abierto'));
      const lista = h('div', { class: 'modulo-nav__lista' });
      m.lecciones.forEach((l, i) => {
        const hecha = Boolean(st.leccionesCompletadas[l.id]);
        const enlace = h('a', { class: 'modulo-nav__enlace', href: '#/leccion/' + l.id }, [
          h('span', { class: 'num', texto: String(i + 1) }),
          h('span', { class: 'crece', texto: l.titulo }),
          hecha ? h('span', { class: 'hecho', texto: '✓' }) : null,
        ]);
        lista.appendChild(enlace);
      });
      bloque.append(cab, lista);
      caja.appendChild(bloque);
    });
  }

  function marcarNavActivo() {
    const hash = location.hash;
    $$('.menu__item').forEach((a) => {
      const ruta = a.dataset.ruta;
      const activo =
        (ruta === 'inicio' && (hash === '' || hash === '#/' || hash === '#/inicio')) ||
        (ruta === 'lecciones' && (hash.startsWith('#/leccion') && !hash.startsWith('#/lecciones'))) ||
        (ruta === 'ejercicios' && hash.startsWith('#/ejercicio')) ||
        hash.startsWith('#/' + ruta);
      a.classList.toggle('activo', Boolean(activo));
    });
    $$('.modulo-nav__enlace').forEach((a) => {
      a.classList.toggle('activo', a.getAttribute('href') === hash);
    });
  }

  // -------------------------------------------------------------------------
  // Migas de pan
  // -------------------------------------------------------------------------
  function migas(items) {
    const caja = $('#migas');
    caja.innerHTML = '';
    items.forEach((it, i) => {
      if (i > 0) caja.appendChild(h('span', { class: 'sep', texto: '/' }));
      if (it.href) caja.appendChild(h('a', { href: it.href, texto: it.texto }));
      else caja.appendChild(h('span', { class: 'actual', texto: it.texto }));
    });
  }

  // -------------------------------------------------------------------------
  // Router
  // -------------------------------------------------------------------------
  async function renderizar() {
    const hash = location.hash || '#/inicio';
    const [ruta, consulta] = hash.replace(/^#\/?/, '').split('?');
    const partes = ruta.split('/').filter(Boolean);
    const params = new URLSearchParams(consulta || '');
    const mismaRuta = rutaActual === hash;
    const scrollPrevio = window.scrollY || 0;
    rutaActual = hash;
    const token = ++tokenRender;

    let elemento;
    let titulo = 'SQL en la Hacienda';
    let migasItems = [{ texto: 'Inicio', href: '#/inicio' }];

    try {
      switch (partes[0] || 'inicio') {
        case 'inicio': {
          elemento = window.Vistas.inicio();
          titulo = 'Inicio';
          break;
        }
        case 'lecciones': {
          elemento = window.Vistas.lecciones();
          titulo = 'Lecciones';
          migasItems.push({ texto: 'Lecciones' });
          break;
        }
        case 'leccion': {
          const id = partes[1];
          const encontrada = (window.CURRICULO || []).flatMap((m) => m.lecciones.map((l) => ({ m, l }))).find((x) => x.l.id === id);
          elemento = window.Vistas.leccion(id);
          if (encontrada) {
            titulo = encontrada.l.titulo;
            migasItems.push({ texto: encontrada.m.titulo, href: '#/lecciones' }, { texto: encontrada.l.titulo });
          }
          break;
        }
        case 'ejercicios': {
          elemento = window.Vistas.ejercicios();
          titulo = 'Ejercicios';
          migasItems.push({ texto: 'Ejercicios' });
          break;
        }
        case 'ejercicio': {
          const ej = (window.EJERCICIOS || []).find((x) => x.id === partes[1]);
          elemento = window.Vistas.ejercicio(partes[1]);
          titulo = ej ? ej.titulo : 'Ejercicio';
          migasItems.push({ texto: 'Ejercicios', href: '#/ejercicios' }, { texto: titulo });
          break;
        }
        case 'playground': {
          elemento = await window.Vistas.playground(params.get('sql') || '');
          if (token !== tokenRender) return;
          titulo = 'Laboratorio';
          migasItems.push({ texto: 'Laboratorio' });
          break;
        }
        case 'modelo': {
          elemento = await window.Vistas.modelo(partes[1] || null);
          if (token !== tokenRender) return;
          titulo = partes[1] ? 'Tabla ' + partes[1] : 'Modelo de datos';
          migasItems.push({ texto: 'Modelo de datos', href: '#/modelo' });
          if (partes[1]) migasItems.push({ texto: partes[1] });
          break;
        }
        case 'chuleta': {
          elemento = window.Vistas.chuleta(params.get('q') || '');
          titulo = 'Chuleta';
          migasItems.push({ texto: 'Chuleta' });
          break;
        }
        default: {
          elemento = window.Vistas.inicio();
          break;
        }
      }
    } catch (err) {
      console.error(err);
      elemento = h('div', { class: 'tarjeta' }, [
        h('h2', { texto: 'Algo salió mal' }),
        h('p', { class: 'texto-tenue', texto: err.message || String(err) }),
      ]);
    }

    const vista = $('#vista');
    vista.innerHTML = '';
    vista.appendChild(elemento);
    document.title = titulo + ' · SQL en la Hacienda';
    migas(migasItems);

    // scroll: al refrescar la misma página conservamos la posición
    if (mismaRuta) window.scrollTo(0, scrollPrevio);
    else if (params.get('sql') === null && params.get('q') === null) window.scrollTo({ top: 0, behavior: 'auto' });
    marcarNavActivo();
    if ($('#lateral').classList.contains('abierto')) $('#lateral').classList.remove('abierto');
  }

  function refrescar() {
    renderizar();
  }

  // -------------------------------------------------------------------------
  // Buscador
  // -------------------------------------------------------------------------
  let seleccionBusqueda = 0;
  let resultadosActuales = [];

  function abrirBusqueda() {
    $('#dialogo-buscar').hidden = false;
    const entrada = $('#entrada-buscar');
    entrada.value = '';
    entrada.focus();
    pintarBusqueda('');
  }

  function cerrarBusqueda() {
    $('#dialogo-buscar').hidden = true;
  }

  function pintarBusqueda(texto) {
    const caja = $('#resultados-buscar');
    caja.innerHTML = '';
    const q = window.Nucleo.normalizarBusqueda(texto.trim());
    if (!q) {
      resultadosActuales = indice.slice(0, 8);
    } else {
      resultadosActuales = indice
        .filter((e) => window.Nucleo.normalizarBusqueda(e.clave).includes(q))
        .sort((a, b) => {
          const pa = window.Nucleo.normalizarBusqueda(a.titulo).includes(q) ? 0 : 1;
          const pb = window.Nucleo.normalizarBusqueda(b.titulo).includes(q) ? 0 : 1;
          return pa - pb;
        })
        .slice(0, 20);
    }
    seleccionBusqueda = 0;
    if (!resultadosActuales.length) {
      caja.appendChild(h('div', { class: 'texto-tenue', style: 'padding:16px', texto: 'Sin resultados.' }));
      return;
    }
    resultadosActuales.forEach((r, i) => {
      let tituloHtml = escapar(r.titulo);
      if (q) {
        const idx = window.Nucleo.normalizarBusqueda(r.titulo).indexOf(q);
        if (idx >= 0) {
          tituloHtml =
            escapar(r.titulo.slice(0, idx)) +
            '<mark>' + escapar(r.titulo.slice(idx, idx + q.length)) + '</mark>' +
            escapar(r.titulo.slice(idx + q.length));
        }
      }
      const a = h('a', { class: 'resultado-busqueda' + (i === 0 ? ' sel' : ''), href: r.url, onclick: () => cerrarBusqueda() }, [
        h('span', { class: 'resultado-busqueda__tipo', texto: r.tipo }),
        h('span', { class: 'resultado-busqueda__texto', html: tituloHtml }),
      ]);
      caja.appendChild(a);
    });
  }

  function moverSeleccion(dir) {
    const items = $$('.resultado-busqueda', $('#resultados-buscar'));
    if (!items.length) return;
    items[seleccionBusqueda].classList.remove('sel');
    seleccionBusqueda = (seleccionBusqueda + dir + items.length) % items.length;
    items[seleccionBusqueda].classList.add('sel');
    items[seleccionBusqueda].scrollIntoView({ block: 'nearest' });
  }

  // -------------------------------------------------------------------------
  // Estado de la conexión
  // -------------------------------------------------------------------------
  async function comprobarConexion() {
    const punto = $('#punto-conexion');
    const texto = $('#texto-conexion');
    try {
      const r = await api.estado();
      if (r.ok) {
        punto.classList.add('ok');
        punto.classList.remove('error');
        texto.textContent = 'PostgreSQL ' + (r.version || '').match(/\d+\.\d+/)?.[0] || 'conectado';
        texto.title = r.version || '';
      } else {
        throw new Error('sin conexión');
      }
    } catch (_) {
      punto.classList.add('error');
      texto.textContent = 'sin conexión';
    }
  }

  // -------------------------------------------------------------------------
  // Arranque
  // -------------------------------------------------------------------------
  async function arrancar() {
    aplicarTema(temaInicial());

    indice = window.Nucleo.indiceBusqueda();
    construirNavModulos();
    actualizarProgreso();
    comprobarConexion();

    // eventos globales
    window.addEventListener('hashchange', renderizar);

    $('#btn-tema').addEventListener('click', () => {
      const actual = document.documentElement.getAttribute('data-tema');
      aplicarTema(actual === 'oscuro' ? 'claro' : 'oscuro');
    });

    $('#btn-menu').addEventListener('click', () => $('#lateral').classList.toggle('abierto'));

    $('#btn-buscar').addEventListener('click', abrirBusqueda);
    $('#entrada-buscar').addEventListener('input', (ev) => pintarBusqueda(ev.target.value));
    $('#entrada-buscar').addEventListener('keydown', (ev) => {
      if (ev.key === 'ArrowDown') { ev.preventDefault(); moverSeleccion(1); }
      else if (ev.key === 'ArrowUp') { ev.preventDefault(); moverSeleccion(-1); }
      else if (ev.key === 'Enter') {
        ev.preventDefault();
        const items = $$('.resultado-busqueda', $('#resultados-buscar'));
        if (items[seleccionBusqueda]) {
          cerrarBusqueda();
          location.hash = items[seleccionBusqueda].getAttribute('href').replace(/^#/, '');
        }
      } else if (ev.key === 'Escape') cerrarBusqueda();
    });

    $$('[data-cerrar]').forEach((el) => el.addEventListener('click', () => {
      if (el.closest('.modal')) { cerrarModal(); return; }
      cerrarBusqueda();
    }));

    document.addEventListener('keydown', (ev) => {
      if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'k') {
        ev.preventDefault();
        abrirBusqueda();
      }
      if (ev.key === 'Escape') {
        cerrarBusqueda();
        cerrarModal();
      }
    });

    $('#modal-ok').addEventListener('click', () => {
      const cb = window.Nucleo.confirmarCb;
      cerrarModal();
      if (typeof cb === 'function') cb();
    });

    $('#btn-reiniciar-progreso').addEventListener('click', () => {
      confirmar('Reiniciar tu progreso', 'Se borrarán las lecciones y ejercicios marcados en este navegador. La base de datos no se toca.', () => {
        window.Nucleo.reiniciarProgreso();
        construirNavModulos();
        actualizarProgreso();
        renderizar();
        aviso('Progreso reiniciado', 'ok');
      });
    });

    $('#btn-reiniciar-db').addEventListener('click', () => {
      confirmar('Restablecer la base de datos', 'Se borra todo y se recargan el esquema y los datos originales. Tarda unos segundos.', async () => {
        $('#texto-conexion').textContent = 'restableciendo…';
        const r = await api.reiniciar();
        if (r.ok) {
          aviso('Base de datos restablecida', 'ok');
          comprobarConexion();
          renderizar();
        } else {
          aviso('No se pudo restablecer: ' + (r.error ? r.error.mensaje : ''), 'mal');
          comprobarConexion();
        }
      });
    });

    // primera ruta
    if (!location.hash) location.hash = '#/inicio';
    await renderizar();

    // ocultar pantalla de carga
    const carga = $('#cargando');
    $('#app').hidden = false;
    carga.classList.add('oculto');
    setTimeout(() => carga.remove(), 420);

    // aviso si el servidor no responde
    try {
      const r = await api.estado();
      if (!r.ok) throw new Error('sin conexión');
    } catch (_) {
      aviso('No hay conexión con PostgreSQL. Revisa la ventana del servidor.', 'mal');
    }
  }

  window.app = { refrescar, actualizarProgreso, renderizar };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar);
  else arrancar();
})();
