'use strict';
/**
 * Prueba de humo del frontend sin navegador: implementa un DOM mínimo y
 * ejecuta todas las vistas para detectar errores de JavaScript en el render.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const catalogo = JSON.parse(fs.readFileSync(path.join(__dirname, 'catalogo_snapshot.json'), 'utf8'));

let nodosCreados = 0;
const errores = [];

// ---------------------------------------------------------------------------
// DOM mínimo
// ---------------------------------------------------------------------------
class Estilo {
  constructor() { return new Proxy(this, { set: (t, k, v) => { t[k] = v; return true; } }); }
}
class ClaseLista {
  constructor(el) { this.el = el; this.set = new Set(); }
  add(...c) { c.forEach((x) => x && this.set.add(x)); }
  remove(...c) { c.forEach((x) => this.set.delete(x)); }
  contains(c) { return this.set.has(c); }
  toggle(c, force) {
    const tiene = this.set.has(c);
    const valor = force === undefined ? !tiene : Boolean(force);
    if (valor) this.set.add(c); else this.set.delete(c);
    return valor;
  }
  get value() { return Array.from(this.set).join(' '); }
}

class Nodo {
  constructor(tag) {
    nodosCreados++;
    this.tagName = String(tag || 'div').toUpperCase();
    this.children = [];
    this.attributes = {};
    this.style = {};
    this.dataset = {};
    this._texto = '';
    this._html = '';
    this.hidden = false;
    this.disabled = false;
    this.value = '';
    this.classList = new ClaseLista(this);
    this.listeners = {};
  }
  appendChild(c) { if (c) { this.children.push(c); c.parentNode = this; } return c; }
  append(...cs) { cs.forEach((c) => this.appendChild(c)); }
  insertBefore(c) { return this.appendChild(c); }
  setAttribute(k, v) {
    this.attributes[k] = v;
    if (k === 'class') this.classList.add(...String(v).split(/\s+/));
    if (k === 'style') this.style.cssText = v;
    if (k === 'href') this.href = v;
  }
  getAttribute(k) { return this.attributes[k] !== undefined ? this.attributes[k] : (k === 'href' ? this.href : null); }
  removeAttribute(k) { delete this.attributes[k]; }
  addEventListener(tipo, fn) { (this.listeners[tipo] = this.listeners[tipo] || []).push(fn); }
  removeEventListener() {}
  dispatch(tipo, ev) { (this.listeners[tipo] || []).forEach((f) => f(ev || { preventDefault() {}, target: this, stopPropagation() {} })); }
  get textContent() { return this._texto; }
  set textContent(v) { this._texto = String(v); this.children = []; }
  get innerHTML() { return this._html; }
  set innerHTML(v) { this._html = String(v); this.children = []; }
  get childNodes() { return this.children; }
  get firstChild() { return this.children[0] || null; }
  get offsetWidth() { return 100; }
  querySelector() { return null; }
  querySelectorAll() { return []; }
  closest() { return null; }
  remove() { if (this.parentNode) this.parentNode.children = this.parentNode.children.filter((c) => c !== this); }
  focus() {}
  blur() {}
  scrollIntoView() {}
  getBoundingClientRect() { return { top: 0, left: 0, width: 100, height: 20 }; }
  setSelectionRange() {}
  select() {}
  get scrollHeight() { return 120; }
  get offsetHeight() { return 120; }
}

function contar(el) {
  if (!el || typeof el !== 'object') return 0;
  return 1 + (el.children || []).reduce((n, c) => n + contar(c), 0);
}

function textoDe(el) {
  if (!el || typeof el !== 'object') return '';
  return (el._texto || '') + (el._html || '') + (el.children || []).map(textoDe).join(' ');
}

const documento = {
  readyState: 'complete',
  createElement: (t) => new Nodo(t),
  createTextNode: (t) => { const n = new Nodo('#text'); n._texto = String(t); return n; },
  querySelector: (sel) => {
    if (sel === '#avisos' || sel === '#modal' || sel === '#modal-titulo' || sel === '#modal-cuerpo') return new Nodo('div');
    if (sel === '#cargando' || sel === '#app' || sel === '#vista') return new Nodo('div');
    if (sel === '#aro-circulo' || sel === '#aro-texto') return new Nodo('div');
    return new Nodo('div');
  },
  querySelectorAll: () => [],
  addEventListener: () => {},
  body: new Nodo('body'),
  documentElement: new Nodo('html'),
};

const almacen = {};
const ventana = {
  location: { hash: '#/inicio' },
  navigator: { clipboard: null },
  matchMedia: () => ({ matches: false, addEventListener() {} }),
  scrollTo: () => {},
  setTimeout,
  clearTimeout,
  console,
  fetch: async (url) => {
    if (String(url).includes('/api/catalogo')) {
      return { json: async () => catalogo };
    }
    return { json: async () => ({ ok: true }) };
  },
  addEventListener: () => {},
  document: documento,
  localStorage: {
    getItem: (k) => (almacen[k] === undefined ? null : almacen[k]),
    setItem: (k, v) => { almacen[k] = String(v); },
    removeItem: (k) => { delete almacen[k]; },
  },
  Nucleo: null,
  EditorSQL: null,
};

const contexto = {
  window: ventana,
  document: documento,
  localStorage: ventana.localStorage,
  console,
  setTimeout,
  clearTimeout,
  fetch: ventana.fetch,
  navigator: ventana.navigator,
  location: ventana.location,
  URLSearchParams,
  Math,
  Date,
  JSON,
  Object,
  Array,
  String,
  Number,
  Boolean,
  RegExp,
  Set,
  Map,
  Promise,
  Error,
};
contexto.globalThis = contexto;
vm.createContext(contexto);

function cargar(rel) {
  const codigo = fs.readFileSync(path.join(RAIZ, rel), 'utf8');
  vm.runInContext(codigo, contexto, { filename: rel });
}

// ---------------------------------------------------------------------------
cargar('web/assets/js/core.js');
cargar('web/assets/js/editor.js');
['curriculum-01', 'curriculum-02', 'curriculum-03', 'curriculum-04'].forEach((f) => cargar('web/assets/data/' + f + '.js'));
cargar('web/assets/data/ejercicios.js');
cargar('web/assets/data/modelo.js');
cargar('web/assets/data/chuleta.js');
cargar('web/assets/js/views.js');

const V = contexto.window.Vistas;
const CURRICULO = contexto.window.CURRICULO;
const EJERCICIOS = contexto.window.EJERCICIOS;

async function probar(nombre, fn, minimo) {
  const antes = nodosCreados;
  try {
    const el = await fn();
    const n = contar(el);
    const texto = textoDe(el);
    if (!el) throw new Error('la vista devolvió vacío');
    if (n < (minimo || 3)) throw new Error('solo ' + n + ' nodos');
    if (texto.length < 40) throw new Error('texto insuficiente: ' + JSON.stringify(texto.slice(0, 60)));
    return { nombre, nodos: n, texto: texto.length };
  } catch (e) {
    errores.push([nombre, e.message]);
    return null;
  }
}

(async () => {
  const res = [];
  res.push(await probar('inicio', () => V.inicio()));
  res.push(await probar('lecciones', () => V.lecciones()));
  res.push(await probar('ejercicios', () => V.ejercicios()));
  res.push(await probar('chuleta', () => V.chuleta('')));

  let leccionesOk = 0;
  for (const m of CURRICULO) {
    for (const l of m.lecciones) {
      const r = await probar('leccion ' + l.id, () => V.leccion(l.id), 5);
      if (r) leccionesOk++;
    }
  }

  let ejerciciosOk = 0;
  for (const e of EJERCICIOS) {
    const r = await probar('ejercicio ' + e.id, () => V.ejercicio(e.id), 5);
    if (r) ejerciciosOk++;
  }

  res.push(await probar('playground', () => V.playground(), 5));
  res.push(await probar('modelo', () => V.modelo(), 5));
  res.push(await probar('modelo/animal', () => V.modelo('animal'), 5));

  console.log('');
  console.log('  Vistas principales:');
  res.filter(Boolean).forEach((r) => console.log('   ✓ ' + r.nombre.padEnd(16) + r.nodos + ' nodos, ' + r.texto + ' caracteres'));
  console.log('  Lecciones renderizadas: ' + leccionesOk + '/' + CURRICULO.reduce((n, m) => n + m.lecciones.length, 0));
  console.log('  Ejercicios renderizados: ' + ejerciciosOk + '/' + EJERCICIOS.length);
  console.log('  Nodos creados en total: ' + nodosCreados);
  console.log('');
  if (errores.length) {
    console.log('  ERRORES (' + errores.length + '):');
    errores.forEach((e) => console.log('   ✗ ' + e[0] + ': ' + e[1]));
    process.exit(1);
  }
  console.log('  ✅ Sin errores de render.');
})();
