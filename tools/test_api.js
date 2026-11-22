'use strict';
// Prueba de humo de la API: ensayo con DDL, reinicio de datos y estados.
const BASE = 'http://127.0.0.1:8899';

async function post(ruta, cuerpo) {
  const r = await fetch(BASE + ruta, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo),
  });
  return r.json();
}

(async () => {
  console.log('1) Estado:', JSON.stringify(await (await fetch(BASE + '/api/estado')).json()).slice(0, 120));

  const ensayo = await post('/api/ensayo', { sql: 'CREATE TABLE prueba_x (id int); INSERT INTO prueba_x VALUES (1);' });
  console.log('2) Ensayo DDL:', ensayo.ok ? 'ok' : JSON.stringify(ensayo.error));

  const existe = await post('/api/consulta', { sql: "SELECT to_regclass('public.prueba_x') IS NOT NULL AS existe;" });
  console.log('   ¿Quedó la tabla?', existe.resultados[0].filas[0][0]);

  const dml = await post('/api/ensayo', { sql: "UPDATE causa_muerte SET nombre = 'XXX' WHERE id = 1; SELECT nombre FROM causa_muerte WHERE id = 1;" });
  const dml2 = await post('/api/consulta', { sql: 'SELECT nombre FROM causa_muerte WHERE id = 1;' });
  console.log('3) Ensayo DML:', dml.resultados[dml.resultados.length - 1].filas[0][0], '| después:', dml2.resultados[0].filas[0][0]);

  const malo = await post('/api/consulta', { sql: 'SELECT * FROM no_existe;' });
  console.log('4) Error controlado:', malo.ok === false && malo.error.codigo === '42P01');

  const verificar = await post('/api/verificar', {
    sql: 'SELECT count(*) FROM animal WHERE estado = \'Activo\';',
    solucion: 'SELECT count(*) FROM animal WHERE estado = \'Activo\';',
  });
  console.log('5) Verificar correcto:', verificar.coincide === true);

  const incorrecto = await post('/api/verificar', {
    sql: 'SELECT count(*) FROM animal;',
    solucion: 'SELECT count(*) FROM animal WHERE estado = \'Activo\';',
  });
  console.log('6) Detecta respuesta incorrecta:', incorrecto.coincide === false);

  const reinicio = await post('/api/reiniciar', {});
  console.log('7) Reinicio de datos:', reinicio.ok);

  const despues = await post('/api/consulta', { sql: 'SELECT count(*) FROM animal;' });
  console.log('   Animales tras reiniciar:', despues.resultados[0].filas[0][0]);
})();
