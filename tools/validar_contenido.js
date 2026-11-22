'use strict';
/**
 * Valida contra el servidor en marcha:
 *  - que todos los ejercicios (solución + check) se ejecuten sin error
 *  - que todos los bloques SQL de las lecciones se ejecuten sin error
 *  - informa de los que devuelven 0 filas, para revisarlos a mano
 */
const BASE = process.env.BASE || 'http://127.0.0.1:8899';

global.window = {};
['curriculum-01', 'curriculum-02', 'curriculum-03', 'curriculum-04'].forEach((f) =>
  require('../web/assets/data/' + f + '.js')
);
require('../web/assets/data/ejercicios.js');

async function post(ruta, cuerpo) {
  const r = await fetch(BASE + ruta, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo),
  });
  return r.json();
}

(async () => {
  const problemas = [];
  const vacios = [];

  // ---------------- ejercicios ----------------
  const ejs = window.EJERCICIOS;
  console.log('Validando ' + ejs.length + ' ejercicios…');
  for (const e of ejs) {
    let r;
    try {
      r = await post('/api/verificar', { sql: e.solucion, solucion: e.solucion, check: e.check || null });
    } catch (err) {
      problemas.push([e.id, 'red', err.message]);
      continue;
    }
    if (!r.ok) {
      problemas.push([e.id, e.titulo, (r.error && r.error.mensaje) || 'fallo desconocido', 1]);
      continue;
    }
    if (r.errorInterno) {
      problemas.push([e.id, e.titulo, r.error]);
      continue;
    }
    const filas = r.esperado ? r.esperado.totalFilas : 0;
    if (filas === 0) vacios.push([e.id, e.titulo]);
  }

  // ---------------- lecciones ----------------
  let bloques = 0;
  console.log('Validando bloques SQL de las lecciones…');
  for (const m of window.CURRICULO) {
    for (const l of m.lecciones) {
      let n = 0;
      for (const b of l.bloques || []) {
        if (b.t !== 'sql') continue;
        if (b.falla) { n++; continue; } // ejemplo que debe fallar a propósito
        n++;
        bloques++;
        const etiqueta = l.id + ' #' + n + ' «' + (b.titulo || '') + '»';
        let r;
        try {
          r = await post('/api/ensayo', { sql: b.c });
        } catch (err) {
          problemas.push([l.id, etiqueta, err.message]);
          continue;
        }
        if (!r.ok) {
          problemas.push([l.id, etiqueta, (r.error && r.error.mensaje) || 'error']);
        }
      }
    }
  }

  console.log('');
  console.log('Bloques SQL comprobados: ' + bloques);
  console.log('Problemas: ' + problemas.length);
  problemas.forEach((p) => console.log('  ✗ [' + p[0] + '] ' + p[1] + '\n      ' + p[2]));
  console.log('');
  console.log('Ejercicios con 0 filas de resultado: ' + vacios.length);
  vacios.forEach((v) => console.log('  · [' + v[0] + '] ' + v[1]));
  process.exit(problemas.length ? 1 : 0);
})();
