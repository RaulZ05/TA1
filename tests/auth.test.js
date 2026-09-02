'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

// BD temporal aislada + JWT secreto conocido, antes de importar el server
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'llampayec-auth-'));
process.env.LLAMPAYEC_DB_PATH = path.join(tmpDir, 'test.db');
process.env.JWT_SECRET = 'test-secret';

const app = require('../server/index');

let server;
let base;

test.before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => {
  if (server) server.close();
});

async function post(url, body) {
  const res = await fetch(base + url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return { status: res.status, data: await res.json() };
}

test('register crea un usuario y devuelve token', async () => {
  const { status, data } = await post('/api/auth/register', {
    nombre: 'Pepe',
    apellidos: 'Pérez',
    email: 'pepe@test.com',
    password: '123456'
  });
  assert.strictEqual(status, 201);
  assert.ok(data.token, 'Debe devolver JWT');
  assert.strictEqual(data.user.email, 'pepe@test.com');
  assert.strictEqual(data.user.password, undefined, 'No debe exponer el hash');

  
});

test('register rechaza email duplicado (409)', async () => {
  await post('/api/auth/register', { nombre: 'Uno', email: 'dupe@test.com', password: '123456' });
  const { status, data } = await post('/api/auth/register', { nombre: 'Dos', email: 'dupe@test.com', password: '123456' });
  assert.strictEqual(status, 409);
  assert.match(data.error, /email/i);
});

test('login acepta credenciales válidas', async () => {
  await post('/api/auth/register', { nombre: 'Luis', email: 'luis@test.com', password: 'abc123' });
  const { status, data } = await post('/api/auth/login', { email: 'luis@test.com', password: 'abc123' });
  assert.strictEqual(status, 200);
  assert.ok(data.token);
  assert.strictEqual(data.user.email, 'luis@test.com');
});

test('login rechaza contraseña incorrecta (401)', async () => {
  const { status, data } = await post('/api/auth/login', { email: 'luis@test.com', password: 'incorrecta' });
  assert.strictEqual(status, 401);
  assert.match(data.error, /inválidas/i);
});

test('/me exige token válido', async () => {
  const res = await fetch(base + '/api/auth/me');
  assert.strictEqual(res.status, 401);

  const { data } = await post('/api/auth/login', { email: 'luis@test.com', password: 'abc123' });
  const ok = await fetch(base + '/api/auth/me', {
    headers: { Authorization: `Bearer ${data.token}` }
  });
  assert.strictEqual(ok.status, 200);
  const me = await ok.json();
  assert.strictEqual(me.email, 'luis@test.com');
});