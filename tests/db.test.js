'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

// BD temporal aislada, para no tocar la real del proyecto
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'llampayec-db-'));
process.env.LLAMPAYEC_DB_PATH = path.join(tmpDir, 'test.db');

const { getDb } = require('../server/config/db');

test('getDb crea las tablas del esquema (users, products, orders, contacts)', async () => {
  const db = await getDb();
  const tables = db
    .prepare(`SELECT name FROM sqlite_master WHERE type = 'table'`)
    .all()
    .map((r) => r.name);
  for (const t of ['users', 'products', 'orders', 'contacts']) {
    assert.ok(tables.includes(t), `Falta la tabla "${t}" en el esquema`);
  }
});

test('getDb permite insertar y leer un usuario', async () => {
  const db = await getDb();
  const result = db
    .prepare('INSERT INTO users (nombre, apellidos, email, password, role) VALUES (?, ?, ?, ?, ?)')
    .run('Tester', 'QA', 'tester@test.com', 'hash', 'user');

  assert.ok(result.lastInsertRowid > 0, 'Debería devolver el id insertado');

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get('tester@test.com');
  assert.strictEqual(user.nombre, 'Tester');
  assert.strictEqual(user.role, 'user');
});

test('getDb respeta la unicidad del email', async () => {
  const db = await getDb();
  db.prepare('INSERT INTO users (nombre, email, password) VALUES (?, ?, ?)').run('A', 'dupe@test.com', 'x');
  assert.throws(() => {
    db.prepare('INSERT INTO users (nombre, email, password) VALUES (?, ?, ?)').run('B', 'dupe@test.com', 'x');
  });
});