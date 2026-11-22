/* ==========================================================================
   Núcleo: estado, API, utilidades de DOM, markdown mínimo y avisos.
   ========================================================================== */
(function () {
  'use strict';

  // ------------------------------- Utilidades -------------------------------
  const $ = (sel, raiz) => (raiz || document).querySelector(sel);
  const $$ = (sel, raiz) => Array.from((raiz || document).querySelectorAll(sel));

  function h(etiqueta, atributos, hijos) {
    const el = document.createElement(etiqueta);
    if (atributos) {
      for (const [k, v] of Object.entries(atributos)) {
        if (v === null || v === undefined || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'html') el.innerHTML = v;
        else if (k === 'texto') el.textContent = v;
        else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
        else if (k === 'dataset') Object.assign(el.dataset, v);
        else el.setAttribute(k, v);
      }
    }
    if (hijos !== undefined && hijos !== null) {
      for (const hijo of [].concat(hijos)) {
        if (hijo === null || hijo === undefined || hijo === false) continue;
        el.appendChild(typeof hijo === 'string' || typeof hijo === 'number' ? document.createTextNode(String(hijo)) : hijo);
      }
    }
    return el;
  }

  const escapar = (s) =>
    String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  // --------------------------- Markdown en línea ----------------------------
  // Soporta `código`, **negrita**, *cursiva* y [texto](url).
  function inline(texto) {
    let s = escapar(texto == null ? '' : texto);
    s = s.replace(/`([^`]+)`/g, (_, c) => '<code>' + c + '</code>');
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, t, u) => '<a href="' + u + '">' + t + '</a>');
    return s;
  }

  // --------------------------------- Estado ---------------------------------
  const CLAVE = 'hacienda-sql-v1';
  const estadoInicial = {
    leccionesCompletadas: {},
    ejerciciosResueltos: {},
    quizzes: {},
    xp: 0,
    tema: null,
    ultimaLeccion: null,
    historial: [],
    visitas: 0,
  };

  let estado = cargar();

  function cargar() {
    try {
      const crudo = localStorage.getItem(CLAVE);
      if (!crudo) return Object.assign({}, estadoInicial);
      const datos = JSON.parse(crudo);
      return Object.assign({}, estadoInicial, datos);
    } catch (_) {
      return Object.assign({}, estadoInicial);
    }
  }

  function guardar() {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(estado));
    } catch (_) {}
  }

  function progreso() {
    const totalLecciones = (window.CURRICULO || []).reduce((n, m) => n + m.lecciones.length, 0);
    const totalEjercicios = (window.EJERCICIOS || []).length;
    const hechas = Object.keys(estado.leccionesCompletadas).length;
    const resueltos = Object.keys(estado.ejerciciosResueltos).length;
    return {
      totalLecciones,
      totalEjercicios,
      hechas,
      resueltos,
      pct: totalLecciones + totalEjercicios === 0
        ? 0
        : Math.round(((hechas + resueltos) / (totalLecciones + totalEjercicios)) * 100),
    };
  }

  function marcarLeccion(id) {
    if (estado.leccionesCompletadas[id]) return false;
    estado.leccionesCompletadas[id] = Date.now();
    estado.xp = (estado.xp || 0) + 20;
    guardar();
    return true;
  }

  function desmarcarLeccion(id) {
    if (!estado.leccionesCompletadas[id]) return false;
    delete estado.leccionesCompletadas[id];
    estado.xp = Math.max(0, (estado.xp || 0) - 20);
    guardar();
    return true;
  }

  function marcarEjercicio(id, dificultad) {
    if (estado.ejerciciosResueltos[id]) return false;
    estado.ejerciciosResueltos[id] = Date.now();
    estado.xp = (estado.xp || 0) + (dificultad || 1) * 10;
    guardar();
    return true;
  }

  function agregarHistorial(sql) {
    const limpio = String(sql).trim();
    if (!limpio) return;
    estado.historial = [limpio, ...(estado.historial || []).filter((x) => x !== limpio)].slice(0, 25);
    guardar();
  }

  function reiniciarProgreso() {
    estado = Object.assign({}, estadoInicial, { tema: estado.tema });
    guardar();
  }

  // ---------------------------------- API -----------------------------------
  const api = {
    async consulta(sql) {
      const r = await fetch('/api/consulta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql }),
      });
      return r.json();
    },
    async ensayo(sql) {
      const r = await fetch('/api/ensayo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql }),
      });
      return r.json();
    },
    async verificar(datos) {
      const r = await fetch('/api/verificar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      });
      return r.json();
    },
    async estado() {
      const r = await fetch('/api/estado');
      return r.json();
    },
    async catalogo() {
      const r = await fetch('/api/catalogo');
      return r.json();
    },
    async reiniciar() {
      const r = await fetch('/api/reiniciar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      return r.json();
    },
  };

  // --------------------------------- Avisos ---------------------------------
  function aviso(mensaje, tipo) {
    const caja = $('#avisos');
    if (!caja) return;
    const el = h('div', { class: 'aviso ' + (tipo ? 'aviso--' + tipo : '') });
    el.innerHTML = (tipo === 'ok' ? '✅ ' : tipo === 'mal' ? '⚠️ ' : 'ℹ️ ') + escapar(mensaje);
    caja.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(8px)';
      el.style.transition = 'all .3s';
      setTimeout(() => el.remove(), 320);
    }, 3600);
  }

  // -------------------------------- Confirmar -------------------------------
  let confirmarCb = null;
  function confirmar(titulo, texto, cb) {
    const modal = $('#modal');
    $('#modal-titulo').textContent = titulo;
    $('#modal-cuerpo').innerHTML = '<p>' + inline(texto) + '</p>';
    modal.hidden = false;
    confirmarCb = cb;
  }
  function cerrarModal() {
    const modal = $('#modal');
    if (modal) modal.hidden = true;
    confirmarCb = null;
  }

  // ------------------------------- Formateadores ----------------------------
  function numero(valor) {
    if (valor === null || valor === undefined) return 'NULL';
    if (typeof valor === 'number') {
      if (Number.isInteger(valor)) return valor.toLocaleString('es-BO');
      return valor.toLocaleString('es-BO', { maximumFractionDigits: 3 });
    }
    return String(valor);
  }

  function fecha(valor) {
    if (!valor) return '—';
    const d = new Date(valor.length === 10 ? valor + 'T12:00:00' : valor);
    if (isNaN(d)) return String(valor);
    return d.toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function hace(ms) {
    if (!ms) return 'nunca';
    const s = Math.floor((Date.now() - ms) / 1000);
    if (s < 60) return 'hace un momento';
    if (s < 3600) return 'hace ' + Math.floor(s / 60) + ' min';
    if (s < 86400) return 'hace ' + Math.floor(s / 3600) + ' h';
    return 'hace ' + Math.floor(s / 86400) + ' días';
  }

  // ------------------------------ Búsqueda ----------------------------------
  function indiceBusqueda() {
    const entradas = [];
    (window.CURRICULO || []).forEach((m) => {
      entradas.push({ tipo: 'Módulo', titulo: m.titulo, url: '#/lecciones', texto: m.resumen || '', clave: m.titulo + ' ' + (m.resumen || '') });
      m.lecciones.forEach((l) => {
        const texto = (l.bloques || [])
          .map((b) => (b.c || (b.items || []).join(' ') || b.pregunta || ''))
          .join(' ');
        entradas.push({
          tipo: 'Lección',
          titulo: l.titulo,
          url: '#/leccion/' + l.id,
          texto: m.titulo,
          clave: l.titulo + ' ' + m.titulo + ' ' + texto,
        });
      });
    });
    (window.EJERCICIOS || []).forEach((e) => {
      entradas.push({ tipo: 'Ejercicio', titulo: e.titulo, url: '#/ejercicio/' + e.id, texto: e.enunciado, clave: e.titulo + ' ' + e.enunciado + ' ' + (e.conceptos || []).join(' ') });
    });
    ((window.MODELO && window.MODELO.tablas) || []).forEach((t) => {
      entradas.push({ tipo: 'Tabla', titulo: t.nombre, url: '#/modelo/' + t.nombre, texto: t.proposito, clave: t.nombre + ' ' + t.proposito + ' ' + (t.columnas || []).map((c) => c.nombre).join(' ') });
    });
    ((window.CHULETA || []) || []).forEach((g) => {
      (g.items || []).forEach((it) => {
        entradas.push({ tipo: 'Chuleta', titulo: it.titulo, url: '#/chuleta?q=' + encodeURIComponent(it.titulo), texto: it.codigo, clave: it.titulo + ' ' + it.descripcion + ' ' + it.codigo });
      });
    });
    return entradas;
  }

  function normalizarBusqueda(s) {
    return String(s)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  // ------------------------------- Exportar --------------------------------
  window.Nucleo = {
    $, $$, h, escapar, inline,
    estado: () => estado,
    guardar, progreso, marcarLeccion, desmarcarLeccion, marcarEjercicio, agregarHistorial, reiniciarProgreso,
    api, aviso, confirmar, cerrarModal,
    numero, fecha, hace,
    indiceBusqueda, normalizarBusqueda,
    get confirmarCb() { return confirmarCb; },
  };
})();
