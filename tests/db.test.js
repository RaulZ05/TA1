'use strict';
/*
 * ============================================================================
 * TEST DB — Capa de base de datos del proyecto
 * ============================================================================
 * Qué se prueba aquí: la conexión real a la base de datos SQLite (sql.js) que
 * usa el backend (server/config/db.js), verificando que:
 *   - 01) getDb crea el esquema (tablas users, products, orders, contacts).
 *   - 02) Se pueden insertar y leer registros con sentencias preparadas.
 *   - 03) La restricción de unicidad del email funciona.
 *
 * Herramientas:
 *   - `node:test`  : el runner de pruebas NATIVO de Node.js (cero dependencias
 *                    extra). Se ejecuta con `node --test tests/` o `npm test`.
 *   - `node:assert`: biblioteca de aserciones (compara resultados esperados).
 *
 * Aislamiento: se crea una base de datos TEMPORAL en el directorio temporal
 * del sistema (mkdtemp) y se apunta la ruta mediante la variable
 * LLAMPAYEC_DB_PATH. De este modo las pruebas NUNCA tocan el archivo real
 * server/llampayec.db del proyecto.
 * ============================================================================
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

// 1. Definir una BD temporal aislada, antes de cargar el módulo de base de datos.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'llampayec-db-'));
process.env.LLAMPAYEC_DB_PATH = path.join(tmpDir, 'test.db');

// 2. Importamos la MISMA función que usa el servidor en producción (getDb).
const { getDb } = require('../server/config/db');

// ---------------------------------------------------------------------------
// Prueba 01 — El esquema de la base de datos existe y está completo
// ---------------------------------------------------------------------------
test('getDb crea las tablas del esquema (users, products, orders, contacts)', async () => {
  const db = await getDb();

  // sqlite_master es el catálogo interno de SQLite: lista todas las tablas.
  const tables = db
    .prepare(`SELECT name FROM sqlite_master WHERE type = 'table'`)
    .all()
    .map((r) => r.name);

  // La aplicación funciona con 4 tablas; verificamos que existan todas.
  for (const t of ['users', 'products', 'orders', 'contacts']) {
    assert.ok(tables.includes(t), `Falta la tabla "${t}" en el esquema`);
  }
});

// ---------------------------------------------------------------------------
// Prueba 02 — Inserción y lectura de un usuario (CRUD)
// ---------------------------------------------------------------------------
test('getDb permite insertar y leer un usuario', async () => {
  const db = await getDb();

  // INSERT con sentencia preparada (parámetros ?), como hace el backend real
  // en server/routes/auth.js. Las consultas preparadas evitan inyección SQL.
  const result = db
    .prepare('INSERT INTO users (nombre, apellidos, email, password, role) VALUES (?, ?, ?, ?, ?)')
    .run('Tester', 'QA', 'tester@test.com', 'hash', 'user');

  // last_insert_rowid: el id autogenerado del registro recién insertado.
  assert.ok(result.lastInsertRowid > 0, 'Debería devolver el id insertado');

  // SELECT posterior para confirmar que el dato quedó persistido tal cual.
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get('tester@test.com');
  assert.strictEqual(user.nombre, 'Tester');
  assert.strictEqual(user.role, 'user');
});

// ---------------------------------------------------------------------------
// Prueba 03 — La restricción de unicidad del email
// ---------------------------------------------------------------------------
test('getDb respeta la unicidad del email', async () => {
  const db = await getDb();

  // Primera inserción con este email: debe ser exitosa.
  db.prepare('INSERT INTO users (nombre, email, password) VALUES (?, ?, ?)').run('A', 'dupe@test.com', 'x');

  // Segunda inserción con el MISMO email: el esquema define email como UNIQUE,
  // por lo que debe lanzarse un error. assert.throws espera ese error.
  assert.throws(() => {
    db.prepare('INSERT INTO users (nombre, email, password) VALUES (?, ?, ?)').run('B', 'dupe@test.com', 'x');
  });
});