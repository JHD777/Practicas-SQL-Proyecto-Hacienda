'use strict';
/**
 * Servidor local de "SQL en la Hacienda".
 *
 *   - Sirve la aplicación web (carpeta /web)
 *   - Expone una API mínima para ejecutar SQL contra PostgreSQL
 *   - Crea y siembra la base de datos automáticamente si no existe
 *
 * Sin dependencias externas: solo módulos nativos de Node.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const { Conexion, ErrorPg } = require('./lib/pg.js');

// ---------------------------------------------------------------------------
// Configuración
// ---------------------------------------------------------------------------
const RAIZ = path.join(__dirname, '..');
const WEB = path.join(RAIZ, 'web');
const DB_DIR = path.join(__dirname, 'db');

const CONFIG = {
  host: process.env.PGHOST || '127.0.0.1',
  port: parseInt(process.env.PGPORT || '5432', 10),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || '',
  database: process.env.PGDATABASE || 'hacienda_practica',
  administrador: process.env.PGADMIN_DB || 'postgres',
};

const PUERTO = parseInt(process.env.PORT || '8899', 10);
const HOST = process.env.HOST || '127.0.0.1';
const MAX_FILAS = 3000;
const MAX_CELDA = 4000;

// ---------------------------------------------------------------------------
// Utilidades de SQL (detección de ORDER BY de primer nivel)
// ---------------------------------------------------------------------------
function detectarOrderBy(sql) {
  let profundidad = 0;
  let i = 0;
  const n = sql.length;
  while (i < n) {
    const c = sql[i];
    if (c === '-' && sql[i + 1] === '-') {
      const fin = sql.indexOf('\n', i);
      i = fin === -1 ? n : fin + 1;
      continue;
    }
    if (c === '/' && sql[i + 1] === '*') {
      const fin = sql.indexOf('*/', i + 2);
      i = fin === -1 ? n : fin + 2;
      continue;
    }
    if (c === "'") {
      i++;
      while (i < n) {
        if (sql[i] === "'" && sql[i + 1] === "'") i += 2;
        else if (sql[i] === "'") { i++; break; }
        else i++;
      }
      continue;
    }
    if (c === '"') {
      i++;
      while (i < n) {
        if (sql[i] === '"' && sql[i + 1] === '"') i += 2;
        else if (sql[i] === '"') { i++; break; }
        else i++;
      }
      continue;
    }
    if (c === '$' && /[A-Za-z_]/.test(sql[i + 1] || '')) {
      // etiqueta de dollar-quoting
      const m = /^\$[A-Za-z_0-9]*\$/.exec(sql.slice(i));
      if (m) {
        const etiqueta = m[0];
        const fin = sql.indexOf(etiqueta, i + etiqueta.length);
        i = fin === -1 ? n : fin + etiqueta.length;
        continue;
      }
    }
    if (c === '(') profundidad++;
    else if (c === ')') profundidad = Math.max(0, profundidad - 1);
    else if (profundidad === 0 && (c === 'o' || c === 'O')) {
      if (/^order\s+by\b/i.test(sql.slice(i, i + 12))) return true;
    }
    i++;
  }
  return false;
}

function normalizarValor(v) {
  if (v === null || v === undefined) return { t: 'n', v: '' };
  if (typeof v === 'boolean') return { t: 'b', v: v ? '1' : '0' };
  if (typeof v === 'number') {
    if (Number.isInteger(v)) return { t: 'num', v: String(v) };
    return { t: 'num', v: v.toFixed(6) };
  }
  const s = String(v);
  // fechas / timestamps en formato ISO
  if (/^\d{4}-\d{2}-\d{2}([ T]\d{2}:\d{2}:\d{2}(\.\d+)?([+-]\d{2}(:?\d{2})?)?)?$/.test(s.trim())) {
    const iso = s.trim().replace(' ', 'T');
    const limpio = iso.replace(/(\.\d+)?([+-]\d{2}(:?\d{2})?)?$/, '');
    return { t: 'f', v: limpio };
  }
  const num = Number(s);
  if (s.trim() !== '' && Number.isFinite(num) && /^[-+]?[\d.,\s]+$/.test(s.trim())) {
    return { t: 'num', v: num.toFixed(6) };
  }
  return { t: 's', v: s.trim().replace(/\s+/g, ' ') };
}

function iguales(a, b) {
  const x = normalizarValor(a);
  const y = normalizarValor(b);
  if (x.t === 'num' && y.t === 'num') {
    return Math.abs(parseFloat(x.v) - parseFloat(y.v)) < 1e-6;
  }
  return x.t === y.t && x.v === y.v;
}

function compararResultados(obtenido, esperado, ordenado) {
  const fo = obtenido.filas;
  const fe = esperado.filas;
  const diagnostico = {
    filasObtenidas: fo.length,
    filasEsperadas: fe.length,
    columnasObtenidas: obtenido.columnas.length,
    columnasEsperadas: esperado.columnas.length,
  };
  if (fo.length !== fe.length) {
    return { coincide: false, motivo: 'numero-filas', diagnostico };
  }
  if (obtenido.columnas.length !== esperado.columnas.length) {
    return { coincide: false, motivo: 'numero-columnas', diagnostico };
  }
  if (ordenado) {
    for (let i = 0; i < fe.length; i++) {
      for (let j = 0; j < fe[i].length; j++) {
        if (!iguales(fo[i][j], fe[i][j])) {
          return { coincide: false, motivo: 'valor', fila: i, columna: j, diagnostico };
        }
      }
    }
    return { coincide: true, diagnostico };
  }
  // comparación sin orden: multiconjunto de filas
  const firma = (fila) => fila.map((v) => { const x = normalizarValor(v); return x.t + ':' + x.v; }).join('\u0001');
  const cuenta = new Map();
  for (const f of fe) cuenta.set(firma(f), (cuenta.get(firma(f)) || 0) + 1);
  for (const f of fo) {
    const k = firma(f);
    const c = cuenta.get(k);
    if (!c) return { coincide: false, motivo: 'valor', diagnostico };
    cuenta.set(k, c - 1);
  }
  return { coincide: true, diagnostico };
}

// ---------------------------------------------------------------------------
// Pool de conexiones
// ---------------------------------------------------------------------------
const pool = [];
function crearConexion(extra) {
  return new Conexion(Object.assign({}, CONFIG, extra || {}));
}

async function obtenerConexion() {
  while (pool.length) {
    const c = pool.pop();
    if (c && !c.cerrada && c.socket && !c.socket.destroyed) return c;
  }
  const c = crearConexion();
  await c.conectar();
  await c.consultar('SET statement_timeout = 8000; SET search_path = public;');
  return c;
}

function devolverConexion(c, estadoTransaccion) {
  if (!c || c.cerrada || !c.socket || c.socket.destroyed) return;
  if (estadoTransaccion && estadoTransaccion !== 'I') {
    c.consultar('ROLLBACK;')
      .then(() => pool.push(c))
      .catch(() => c.cerrar());
    return;
  }
  if (pool.length < 6) pool.push(c);
  else c.cerrar();
}

async function conConsulta(sql, opciones) {
  const c = await obtenerConexion();
  let estado = 'I';
  try {
    const r = await c.consultar(sql);
    estado = r.estadoTransaccion;
    return r;
  } catch (err) {
    estado = 'E';
    throw err;
  } finally {
    devolverConexion(c, estado);
  }
}

// ---------------------------------------------------------------------------
// Preparación de la base de datos
// ---------------------------------------------------------------------------
function leerSql(nombre, respaldo) {
  const candidatos = [path.join(RAIZ, nombre), path.join(DB_DIR, respaldo || nombre)];
  for (const ruta of candidatos) {
    if (fs.existsSync(ruta)) return fs.readFileSync(ruta, 'utf8');
  }
  throw new Error(`No se encontró el archivo SQL: ${nombre}`);
}

async function asegurarBaseDeDatos() {
  const admin = crearConexion({ database: CONFIG.administrador });
  await admin.conectar();
  const r = await admin.consultar(
    `SELECT 1 FROM pg_database WHERE datname = ${literal(CONFIG.database)};`
  );
  if (!r.resultados[0] || r.resultados[0].filas.length === 0) {
    console.log(`  · Creando la base de datos "${CONFIG.database}"...`);
    await admin.consultar(`CREATE DATABASE ${ident(CONFIG.database)} ENCODING 'UTF8' TEMPLATE template0;`);
  }
  admin.cerrar();

  const c = crearConexion();
  await c.conectar();
  await c.consultar('SET statement_timeout = 120000;');
  const conteo = await c.consultar(
    "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';"
  );
  const tablas = conteo.resultados[0].filas[0][0];
  if (tablas < 26) {
    console.log('  · Cargando el esquema de la hacienda...');
    await c.consultar(leerSql('esquema_hacienda.sql', 'esquema.sql'));
    console.log('  · Cargando los datos de ejemplo (2.000+ registros)...');
    await c.consultar(leerSql('seed_datos.sql'));
    await c.consultar('ANALYZE;');
  }
  c.cerrar();
}

function literal(s) {
  return "'" + String(s).replace(/'/g, "''") + "'";
}
function ident(s) {
  return '"' + String(s).replace(/"/g, '""') + '"';
}

let reiniciando = null;
async function reiniciarBaseDeDatos() {
  if (reiniciando) return reiniciando;
  reiniciando = (async () => {
    const c = crearConexion();
    await c.conectar();
    await c.consultar('SET statement_timeout = 120000;');
    console.log('  · Restableciendo la base de datos...');
    await c.consultar('DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;');
    await c.consultar(leerSql('esquema_hacienda.sql', 'esquema.sql'));
    await c.consultar(leerSql('seed_datos.sql'));
    await c.consultar('ANALYZE;');
    c.cerrar();
    while (pool.length) {
      const p = pool.pop();
      if (p) p.cerrar();
    }
    return { ok: true };
  })();
  try {
    return await reiniciando;
  } finally {
    reiniciando = null;
  }
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------
function resumirError(err) {
  if (err instanceof ErrorPg) {
    return {
      mensaje: err.message,
      codigo: err.code,
      severidad: err.severity,
      detalle: err.detail || null,
      pista: err.hint || null,
      posicion: err.position || null,
      restriccion: err.constraint || null,
      sqlstate: err.code,
    };
  }
  return { mensaje: err.message || String(err), codigo: err.codigo || 'ERROR', restriccion: null };
}

async function ejecutar(sql) {
  const inicio = Date.now();
  const r = await conConsulta(sql);
  const tiempo = Date.now() - inicio;
  let truncado = false;
  const resultados = r.resultados.map((rs) => {
    let filas = rs.filas;
    if (filas.length > MAX_FILAS) {
      filas = filas.slice(0, MAX_FILAS);
      truncado = true;
    }
    filas = filas.map((f) => f.map((v) => (typeof v === 'string' && v.length > MAX_CELDA ? v.slice(0, MAX_CELDA) + '…' : v)));
    return {
      columnas: rs.columnas.map((c) => ({
        nombre: c.nombre,
        tipoOid: c.tipoOid,
        tipo: nombreTipo(c.tipoOid),
        numerico: [20, 21, 23, 26, 700, 701, 1700].includes(c.tipoOid),
      })),
      filas,
      comando: rs.comando,
      filasAfectadas: rs.filasAfectadas,
    };
  });
  return { resultados, tiempo, truncado };
}

function nombreTipo(oid) {
  const mapa = {
    16: 'booleano', 17: 'bytea', 18: 'char', 19: 'name', 20: 'bigint', 21: 'smallint',
    23: 'integer', 25: 'texto', 26: 'oid', 114: 'json', 700: 'real', 701: 'double',
    1042: 'char', 1043: 'varchar', 1082: 'fecha', 1083: 'hora', 1114: 'timestamp',
    1184: 'timestamptz', 1186: 'intervalo', 1700: 'numeric', 2950: 'uuid', 3802: 'jsonb',
  };
  return mapa[oid] || 'texto';
}

async function verificar(cuerpo) {
  const { sql, solucion } = cuerpo;
  const check = cuerpo.check || null;
  if (!sql || !solucion) return { ok: false, error: 'Faltan datos para verificar.' };
  const conCheck = Boolean(check);

  const ejecutarEnTx = async (principal) => {
    const c = crearConexion();
    await c.conectar();
    await c.consultar('SET statement_timeout = 8000; SET search_path = public;');
    try {
      const guion = conCheck
        ? `BEGIN;\n${principal}\n;\n${check}\n;\nROLLBACK;`
        : `BEGIN READ ONLY;\n${principal}\n;\nROLLBACK;`;
      const r = await c.consultar(guion);
      const sets = r.resultados;
      if (!sets.length) throw new Error('La consulta no devolvió resultados.');
      return sets[sets.length - 1];
    } finally {
      try { await c.consultar('ROLLBACK;'); } catch (_) {}
      c.cerrar();
    }
  };

  let esperado, obtenido, errorUsuario = null;
  try {
    esperado = await ejecutarEnTx(solucion);
  } catch (e) {
    return { ok: false, errorInterno: true, error: 'La solución de referencia falló: ' + e.message };
  }
  try {
    obtenido = await ejecutarEnTx(sql);
  } catch (e) {
    errorUsuario = resumirError(e);
  }

  if (errorUsuario) {
    return { ok: true, coincide: false, error: errorUsuario, esperado: serializar(esperado) };
  }

  const ordenado = detectarOrderBy(solucion);
  const comp = compararResultados(obtenido, esperado, ordenado);
  return {
    ok: true,
    coincide: comp.coincide,
    motivo: comp.motivo || null,
    ordenado,
    diagnostico: comp.diagnostico,
    esperado: serializar(esperado),
    obtenido: serializar(obtenido),
  };
}

function serializar(rs) {
  return {
    columnas: rs.columnas.map((c) => ({ nombre: c.nombre, tipo: nombreTipo(c.tipoOid) })),
    filas: rs.filas.slice(0, 50),
    totalFilas: rs.filas.length,
  };
}

// ---------------------------------------------------------------------------
// Servidor HTTP
// ---------------------------------------------------------------------------
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
};

function enviarJson(res, codigo, datos) {
  const texto = JSON.stringify(datos);
  res.writeHead(codigo, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(texto),
  });
  res.end(texto);
}

function leerCuerpo(req, limite = 3 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let total = 0;
    const partes = [];
    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > limite) {
        reject(Object.assign(new Error('El cuerpo de la petición es demasiado grande.'), { codigo: 'GRANDE' }));
        req.destroy();
        return;
      }
      partes.push(chunk);
    });
    req.on('end', () => {
      if (!partes.length) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(partes).toString('utf8')));
      } catch (e) {
        reject(Object.assign(new Error('JSON inválido.'), { codigo: 'JSON' }));
      }
    });
    req.on('error', reject);
  });
}

function servirEstatico(req, res, ruta) {
  let rel = decodeURIComponent(ruta.split('?')[0]);
  if (rel === '/' || rel === '') rel = '/index.html';
  const destino = path.join(WEB, path.normalize(rel).replace(/^([/\\])+/, ''));
  if (!destino.startsWith(WEB)) {
    res.writeHead(403);
    return res.end('Prohibido');
  }
  fs.stat(destino, (err, st) => {
    if (err || !st.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('No encontrado: ' + rel);
    }
    const ext = path.extname(destino).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
      'Content-Length': st.size,
    });
    fs.createReadStream(destino).pipe(res);
  });
}

const servidor = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (url.pathname.startsWith('/api/')) {
    try {
      if (req.method === 'GET' && url.pathname === '/api/estado') {
        let info = null;
        try {
          const r = await conConsulta(
            'SELECT current_database() AS db, version() AS version, ' +
              '(SELECT count(*) FROM animal) AS animales, now() AS ahora;'
          );
          info = r.resultados[0].filas[0];
        } catch (_) {}
        return enviarJson(res, 200, {
          ok: Boolean(info),
          db: info ? info[0] : null,
          version: info ? info[1] : null,
          animales: info ? info[2] : null,
          ahora: info ? info[3] : null,
        });
      }

      if (req.method === 'POST' && url.pathname === '/api/consulta') {
        const cuerpo = await leerCuerpo(req);
        const sql = (cuerpo.sql || '').trim();
        if (!sql) return enviarJson(res, 400, { ok: false, error: { mensaje: 'Escribe una consulta primero.' } });
        // Evitar bloquear el servidor con transacciones abiertas
        if (/^\s*(begin|start\s+transaction)\b/i.test(sql)) {
          return enviarJson(res, 200, {
            ok: false,
            error: {
              mensaje:
                'Las transacciones no se pueden abrir manualmente desde el editor porque cada consulta ' +
                'se ejecuta de forma aislada. Usa el laboratorio de transacciones para practicar BEGIN/COMMIT.',
              codigo: 'TX_UI',
            },
          });
        }
        try {
          const r = await ejecutar(sql);
          return enviarJson(res, 200, Object.assign({ ok: true }, r));
        } catch (err) {
          return enviarJson(res, 200, { ok: false, error: resumirError(err) });
        }
      }

      if (req.method === 'POST' && url.pathname === '/api/ensayo') {
        // Ejecuta cualquier SQL dentro de una transacción que SIEMPRE se deshace.
        // Sirve para que los ejemplos de INSERT/UPDATE/DELETE/DDL no cambien nada.
        const cuerpo = await leerCuerpo(req);
        const sql = (cuerpo.sql || '').trim();
        if (!sql) return enviarJson(res, 400, { ok: false, error: { mensaje: 'Escribe una consulta primero.' } });
        if (/\b(commit|rollback)\b/i.test(sql)) {
          return enviarJson(res, 200, {
            ok: false,
            error: {
              mensaje: 'Este modo ya envuelve tu código en BEGIN … ROLLBACK: no incluyas COMMIT ni ROLLBACK.',
              codigo: 'ENSAYO_TX',
            },
          });
        }
        const c = crearConexion();
        try {
          await c.conectar();
          await c.consultar('SET statement_timeout = 8000; SET search_path = public;');
          const inicio = Date.now();
          const r = await c.consultar('BEGIN;\n' + sql + '\n;\nROLLBACK;');
          const tiempo = Date.now() - inicio;
          const sets = r.resultados.map((rs) => ({
            columnas: rs.columnas.map((col) => ({
              nombre: col.nombre,
              tipoOid: col.tipoOid,
              tipo: nombreTipo(col.tipoOid),
              numerico: [20, 21, 23, 26, 700, 701, 1700].includes(col.tipoOid),
            })),
            filas: rs.filas.slice(0, 500),
            comando: rs.comando,
            filasAfectadas: rs.filasAfectadas,
          }));
          return enviarJson(res, 200, { ok: true, resultados: sets, tiempo, revertido: true });
        } catch (err) {
          try { await c.consultar('ROLLBACK;'); } catch (_) {}
          return enviarJson(res, 200, { ok: false, error: resumirError(err) });
        } finally {
          c.cerrar();
        }
      }

      if (req.method === 'POST' && url.pathname === '/api/verificar') {
        const cuerpo = await leerCuerpo(req);
        try {
          return enviarJson(res, 200, await verificar(cuerpo));
        } catch (err) {
          return enviarJson(res, 200, { ok: false, error: resumirError(err) });
        }
      }

      if (req.method === 'POST' && url.pathname === '/api/reiniciar') {
        try {
          await reiniciarBaseDeDatos();
          return enviarJson(res, 200, { ok: true });
        } catch (err) {
          return enviarJson(res, 200, { ok: false, error: resumirError(err) });
        }
      }

      if (req.method === 'GET' && url.pathname === '/api/catalogo') {
        const r = await conConsulta(`
          SELECT c.table_name, c.column_name, c.data_type, c.is_nullable,
                 c.column_default, c.ordinal_position
          FROM information_schema.columns c
          WHERE c.table_schema = 'public'
          ORDER BY c.table_name, c.ordinal_position;
        `);
        const tablas = {};
        for (const f of r.resultados[0].filas) {
          const [tabla, columna, tipo, nulo, defecto, pos] = f;
          if (!tablas[tabla]) tablas[tabla] = [];
          tablas[tabla].push({ columna, tipo, nulo: nulo === 'YES', defecto, pos });
        }
        const fk = await conConsulta(`
          SELECT tc.table_name, kcu.column_name, ccu.table_name AS ref_tabla, ccu.column_name AS ref_columna
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage ccu
            ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
          WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
          ORDER BY tc.table_name, kcu.ordinal_position;
        `);
        const relaciones = fk.resultados[0].filas.map((f) => ({
          tabla: f[0], columna: f[1], refTabla: f[2], refColumna: f[3],
        }));
        const c = await conConsulta(`
          SELECT table_name FROM information_schema.tables
          WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name;
        `);
        return enviarJson(res, 200, {
          ok: true,
          tablas: c.resultados[0].filas.map((f) => f[0]),
          columnas: tablas,
          relaciones,
        });
      }

      if (req.method === 'GET' && url.pathname === '/api/conteos') {
        const r = await conConsulta(`
          SELECT t.table_name,
                 (xpath('/row/c/text()', query_to_xml(format('SELECT count(*) AS c FROM %I.%I', 'public', t.table_name), false, true, '')))[1]::text::int AS filas
          FROM information_schema.tables t
          WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
          ORDER BY t.table_name;
        `);
        return enviarJson(res, 200, {
          ok: true,
          conteos: Object.fromEntries(r.resultados[0].filas.map((f) => [f[0], f[1]])),
        });
      }

      return enviarJson(res, 404, { ok: false, error: { mensaje: 'Ruta de API desconocida.' } });
    } catch (err) {
      return enviarJson(res, 500, { ok: false, error: resumirError(err) });
    }
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405);
    return res.end('Método no permitido');
  }
  servirEstatico(req, res, url.pathname);
});

// ---------------------------------------------------------------------------
// Arranque
// ---------------------------------------------------------------------------
async function iniciar() {
  console.log('');
  console.log('  \x1b[38;5;114m🐄  SQL en la Hacienda\x1b[0m  ·  aprender SQL con datos reales');
  console.log('');
  console.log(`  PostgreSQL: ${CONFIG.user}@${CONFIG.host}:${CONFIG.port}/${CONFIG.database}`);

  let intentos = 5;
  while (intentos > 0) {
    try {
      await asegurarBaseDeDatos();
      await conConsulta('SELECT 1;');
      break;
    } catch (err) {
      intentos--;
      if (intentos === 0) {
        console.error('');
        console.error('  \x1b[31mNo se pudo preparar la base de datos.\x1b[0m');
        console.error('  ' + (err.message || err));
        console.error('');
        console.error('  Revisa que el servicio de PostgreSQL esté iniciado y que la');
        console.error('  conexión sea válida. Puedes ajustar las variables de entorno:');
        console.error('  PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE');
        console.error('');
        process.exit(1);
      }
      console.log(`  · Esperando a que PostgreSQL esté listo... (${intentos} intentos restantes)`);
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  servidor.listen(PUERTO, HOST, () => {
    const hostVisible = HOST === '0.0.0.0' || HOST === '::' ? 'localhost' : HOST;
    console.log(`  \x1b[38;5;114m✔ Listo:\x1b[0m http://${hostVisible}:${PUERTO}`);
    console.log('');
    console.log('  Deja esta ventana abierta mientras estudias.');
    console.log('  Para detener el servidor pulsa Ctrl + C.');
    console.log('');
  });
}

servidor.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n  El puerto ${PUERTO} está ocupado. Prueba con otro:\n`);
    console.error(`    set PORT=8900 && node server\\server.js\n`);
  } else {
    console.error('\n  Error del servidor:', err.message, '\n');
  }
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n  Servidor detenido. ¡Hasta la próxima!\n');
  process.exit(0);
});

iniciar();
