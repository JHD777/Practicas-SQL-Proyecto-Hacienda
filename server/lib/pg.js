'use strict';
/**
 * Cliente mínimo del protocolo de PostgreSQL (v3, "simple query protocol").
 * Sin dependencias externas: solo `net` y `Buffer`.
 *
 * Soporta:
 *  - conexión con autenticación trust / password en texto plano / md5 / SCRAM-SHA-256
 *  - consultas simples (varias sentencias separadas por ';')
 *  - devolución de múltiples result sets con tipos convertidos a JS
 *
 * No soporta: consultas preparadas (extended protocol), COPY, cancelación.
 */

const net = require('net');
const crypto = require('crypto');

// ---------------------------------------------------------------------------
// Tipos de PostgreSQL -> JavaScript
// ---------------------------------------------------------------------------
const BOOL = 16, INT8 = 20, INT2 = 21, INT4 = 23, OID = 26;
const FLOAT4 = 700, FLOAT8 = 701, NUMERIC = 1700;

function convertir(oid, texto) {
  switch (oid) {
    case BOOL:
      return texto === 't';
    case INT2:
    case INT4:
    case OID:
      return parseInt(texto, 10);
    case INT8: {
      const n = parseInt(texto, 10);
      return Number.isSafeInteger(n) ? n : texto;
    }
    case FLOAT4:
    case FLOAT8:
    case NUMERIC: {
      if (texto === 'NaN' || texto === 'Infinity' || texto === '-Infinity') return texto;
      const n = Number(texto);
      return Number.isFinite(n) ? n : texto;
    }
    default:
      return texto;
  }
}

// ---------------------------------------------------------------------------
// Lectura incremental de mensajes
// ---------------------------------------------------------------------------
class Lector {
  constructor() {
    this.buf = Buffer.alloc(0);
  }
  push(chunk) {
    this.buf = Buffer.concat([this.buf, chunk]);
  }
  /** Devuelve {tipo, cuerpo} o null si aún no hay un mensaje completo. */
  siguiente() {
    if (this.buf.length < 5) return null;
    const tipo = String.fromCharCode(this.buf[0]);
    const largo = this.buf.readInt32BE(1);
    if (this.buf.length < largo + 1) return null;
    const cuerpo = this.buf.subarray(5, largo + 1);
    this.buf = this.buf.subarray(largo + 1);
    return { tipo, cuerpo };
  }
}

class ErrorPg extends Error {
  constructor(campos) {
    super(campos.M || 'Error de PostgreSQL');
    this.name = 'ErrorPg';
    this.severity = campos.S;
    this.code = campos.C;
    this.detail = campos.D;
    this.hint = campos.H;
    this.position = campos.P ? parseInt(campos.P, 10) : null;
    this.where = campos.W;
    this.constraint = campos.n;
  }
}

// ---------------------------------------------------------------------------
// Conexión
// ---------------------------------------------------------------------------
class Conexion {
  constructor(config) {
    this.config = Object.assign(
      { host: '127.0.0.1', port: 5432, user: 'postgres', password: '', database: 'postgres' },
      config
    );
    this.socket = null;
    this.lector = new Lector();
    this.pendiente = null; // {resolve, reject} de la consulta en curso
    this.cerrada = false;
  }

  conectar() {
    return new Promise((resolve, reject) => {
      const { host, port } = this.config;
      let terminado = false;
      this.alConectar = { resolve, reject };
      this.autenticado = false;
      this.errorAuth = null;
      const socket = net.createConnection({ host, port });
      this.socket = socket;
      socket.setNoDelay(true);

      const fallar = (err) => {
        if (terminado) return;
        terminado = true;
        socket.destroy();
        if (this.alConectar) {
          this.alConectar.reject(err);
          this.alConectar = null;
        }
        reject(err);
      };

      socket.on('error', (err) => {
        const e = new Error(
          `No se pudo conectar a PostgreSQL en ${host}:${port}. ` +
            `¿Está el servicio de PostgreSQL iniciado? (${err.code || err.message})`
        );
        e.codigo = 'SIN_CONEXION';
        fallar(e);
        if (this.pendiente) {
          this.pendiente.reject(e);
          this.pendiente = null;
        }
      });

      socket.on('data', (chunk) => {
        this.lector.push(chunk);
        try {
          this.procesar();
        } catch (err) {
          fallar(err);
        }
      });

      socket.on('close', () => {
        this.cerrada = true;
        if (this.pendiente) {
          this.pendiente.reject(new Error('La conexión con PostgreSQL se cerró inesperadamente.'));
          this.pendiente = null;
        }
      });

      socket.on('connect', () => {
        const params = [
          ['user', this.config.user],
          ['database', this.config.database],
          ['client_encoding', 'UTF8'],
          ['application_name', 'hacienda-sql'],
          ['DateStyle', 'ISO, YMD'],
          ['TimeZone', 'America/La_Paz'],
        ];
        let cuerpo = Buffer.alloc(4);
        cuerpo.writeInt32BE(196608, 0); // protocolo 3.0
        for (const [k, v] of params) {
          cuerpo = Buffer.concat([cuerpo, Buffer.from(k + '\0' + v + '\0', 'utf8')]);
        }
        cuerpo = Buffer.concat([cuerpo, Buffer.from([0])]);
        const cabecera = Buffer.alloc(4);
        cabecera.writeInt32BE(cuerpo.length + 4, 0);
        socket.write(Buffer.concat([cabecera, cuerpo]));
      });
    });
  }

  /** Envía una consulta y devuelve un array de result sets. */
  consultar(sql) {
    return new Promise((resolve, reject) => {
      if (this.cerrada) return reject(new Error('La conexión está cerrada.'));
      if (this.pendiente) return reject(new Error('Ya hay una consulta en curso en esta conexión.'));
      this.pendiente = { resolve, reject, resultados: [], actual: null };
      const cuerpo = Buffer.from(sql + '\0', 'utf8');
      const cabecera = Buffer.alloc(5);
      cabecera[0] = 'Q'.charCodeAt(0);
      cabecera.writeInt32BE(cuerpo.length + 4, 1);
      this.socket.write(Buffer.concat([cabecera, cuerpo]));
    });
  }

  procesar() {
    let msg;
    while ((msg = this.lector.siguiente())) {
      try {
        this.manejar(msg);
      } catch (err) {
        const p = this.pendiente;
        this.pendiente = null;
        if (p) p.reject(err);
        else throw err;
      }
    }
  }

  manejar({ tipo, cuerpo }) {
    const p = this.pendiente;
    switch (tipo) {
      // --- autenticación ---
      case 'R': {
        const codigo = cuerpo.readInt32BE(0);
        if (codigo === 0) return; // AuthenticationOk
        if (codigo === 3) {
          // password en texto plano
          this.enviarMensaje('p', Buffer.from(this.config.password + '\0', 'utf8'));
          return;
        }
        if (codigo === 5) {
          // md5
          const sal = cuerpo.subarray(4, 8);
          const paso1 = crypto.createHash('md5').update(this.config.password + this.config.user).digest('hex');
          const paso2 = crypto.createHash('md5').update(Buffer.concat([Buffer.from(paso1), sal])).digest('hex');
          this.enviarMensaje('p', Buffer.from('md5' + paso2 + '\0', 'utf8'));
          return;
        }
        if (codigo === 10) {
          // SASL: SCRAM-SHA-256
          this.scram = new Scram(this.config.password);
          const mecanismos = cuerpo.subarray(4).toString('utf8').split('\0').filter(Boolean);
          if (!mecanismos.includes('SCRAM-SHA-256')) {
            throw new Error('El servidor exige un método de autenticación SASL no soportado.');
          }
          const inicial = this.scram.primero();
          const datos = Buffer.concat([Buffer.from('SCRAM-SHA-256\0', 'utf8'), Buffer.from([inicial.length]), Buffer.from(inicial, 'utf8')]);
          this.enviarMensaje('p', datos);
          return;
        }
        if (codigo === 11) {
          this.enviarMensaje('p', Buffer.from(this.scram.final(cuerpo.subarray(4).toString('utf8')), 'utf8'));
          return;
        }
        if (codigo === 12) {
          this.scram.verificarFinal(cuerpo.subarray(4).toString('utf8'));
          return;
        }
        throw new Error('Método de autenticación no soportado (código ' + codigo + ').');
      }

      // --- descripción de resultados ---
      case 'T': {
        const n = cuerpo.readInt16BE(0);
        let off = 2;
        const columnas = [];
        for (let i = 0; i < n; i++) {
          const fin = cuerpo.indexOf(0, off);
          const nombre = cuerpo.toString('utf8', off, fin);
          off = fin + 1;
          const tablaOid = cuerpo.readInt32BE(off); off += 4;
          const numCol = cuerpo.readInt16BE(off); off += 2;
          const tipoOid = cuerpo.readInt32BE(off); off += 4;
          off += 2; // typlen
          off += 4; // typmod
          off += 2; // format
          columnas.push({ nombre, tipoOid, tablaOid, numCol });
        }
        p.actual = { columnas, filas: [] };
        return;
      }

      case 'D': {
        if (!p.actual) return;
        const n = cuerpo.readInt16BE(0);
        let off = 2;
        const fila = new Array(n);
        for (let i = 0; i < n; i++) {
          const largo = cuerpo.readInt32BE(off); off += 4;
          if (largo === -1) {
            fila[i] = null;
          } else {
            const texto = cuerpo.toString('utf8', off, off + largo);
            off += largo;
            const oid = p.actual.columnas[i] ? p.actual.columnas[i].tipoOid : 25;
            fila[i] = convertir(oid, texto);
          }
        }
        p.actual.filas.push(fila);
        return;
      }

      case 'C': {
        const etiqueta = cuerpo.toString('utf8', 0, cuerpo.length - 1);
        const filas = /^INSERT\s+\d+\s+(\d+)/i.exec(etiqueta);
        if (p.actual) {
          p.actual.comando = etiqueta;
          p.actual.filasAfectadas = filas ? parseInt(filas[1], 10) : null;
          p.resultados.push(p.actual);
          p.actual = null;
        }
        return;
      }

      case 'I': // EmptyQueryResponse
        return;

      case 'Z': {
        // ReadyForQuery
        const estado = String.fromCharCode(cuerpo[0] || 73);
        if (!this.autenticado) {
          this.autenticado = true;
          const pend = this.alConectar;
          this.alConectar = null;
          if (this.errorAuth) pend.reject(this.errorAuth);
          else pend.resolve();
          return;
        }
        const p2 = this.pendiente;
        this.pendiente = null;
        if (!p2) return;
        p2.estadoTransaccion = estado;
        if (p2.error) {
          p2.reject(p2.error);
        } else {
          p2.resolve({ resultados: p2.resultados, estadoTransaccion: estado });
        }
        return;
      }

      case 'E': {
        const campos = {};
        let off = 0;
        while (off < cuerpo.length && cuerpo[off] !== 0) {
          const clave = String.fromCharCode(cuerpo[off]);
          const fin = cuerpo.indexOf(0, off + 1);
          campos[clave] = cuerpo.toString('utf8', off + 1, fin);
          off = fin + 1;
        }
        const err = new ErrorPg(campos);
        if (!this.autenticado) {
          this.errorAuth = err;
          return;
        }
        // el servidor igualmente mandará ReadyForQuery: esperamos a 'Z'
        if (p) p.error = err;
        return;
      }

      case 'N': // NoticeResponse
      case 'S': // ParameterStatus
      case 'K': // BackendKeyData
      case 'A': // NotificationResponse
      case 'n': // NoData
      case 's': // PortalSuspended
        return;

      default:
        return;
    }
  }

  enviarMensaje(tipo, cuerpo) {
    const cabecera = Buffer.alloc(5);
    cabecera[0] = tipo.charCodeAt(0);
    cabecera.writeInt32BE(cuerpo.length + 4, 1);
    this.socket.write(Buffer.concat([cabecera, cuerpo]));
  }

  cerrar() {
    this.cerrada = true;
    if (this.socket) {
      try {
        this.socket.write(Buffer.from([0x58, 0, 0, 0, 4])); // Terminate
      } catch (_) {}
      this.socket.end();
      this.socket.destroy();
    }
  }
}

// ---------------------------------------------------------------------------
// SCRAM-SHA-256 (autenticación moderna de PostgreSQL)
// ---------------------------------------------------------------------------
class Scram {
  constructor(password) {
    this.password = password || '';
    this.nonce = crypto.randomBytes(18).toString('base64');
    this.primeroMensaje = 'n=,r=' + this.nonce;
  }
  primero() {
    return this.primeroMensaje;
  }
  final(servidor) {
    const partes = Object.fromEntries(
      servidor.split(',').map((x) => [x[0], x.slice(2)])
    );
    this.servidorNonce = partes.r;
    const sal = Buffer.from(partes.s, 'base64');
    this.iteraciones = parseInt(partes.i, 10);
    const sinPrueba = 'c=biws,r=' + this.servidorNonce;
    const authMensaje = this.primeroMensaje + ',' + servidor + ',' + sinPrueba;
    const salted = crypto.pbkdf2Sync(this.password.normalize('NFKC'), sal, this.iteraciones, 32, 'sha256');
    const clienteKey = crypto.createHmac('sha256', salted).update('Client Key').digest();
    const storedKey = crypto.createHash('sha256').update(clienteKey).digest();
    const firma = crypto.createHmac('sha256', storedKey).update(authMensaje).digest();
    const prueba = Buffer.alloc(clienteKey.length);
    for (let i = 0; i < clienteKey.length; i++) prueba[i] = clienteKey[i] ^ firma[i];
    const serverKey = crypto.createHmac('sha256', salted).update('Server Key').digest();
    this.firmaServidor = crypto.createHmac('sha256', serverKey).update(authMensaje).digest();
    return sinPrueba + ',p=' + prueba.toString('base64');
  }
  verificarFinal(datos) {
    const esperado = Buffer.from(datos.slice(2), 'base64');
    if (!esperado.equals(this.firmaServidor)) throw new Error('La firma del servidor SCRAM no coincide.');
  }
}

module.exports = { Conexion, ErrorPg };
