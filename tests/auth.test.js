'use strict';
/*
 * ============================================================================
 * TEST AUTH — Autenticación de usuarios (API HTTP real)
 * ============================================================================
 * Qué se prueba aquí: el flujo completo de REGISTRO e INICIO DE SESIÓN de la
 * API real (server/routes/auth.js), incluyendo la protección de rutas con JWT:
 *   - 01) POST /api/auth/register  → 201 y devuelve token (JWT).
 *   - 02) POST /api/auth/register  → 409 si el email ya está registrado.
 *   - 03) POST /api/auth/login     → 200 y token con credenciales válidas.
 *   - 04) POST /api/auth/login     → 401 con contraseña incorrecta.
 *   - 05) GET  /api/auth/me        → exige token (401 sin él, 200 con él).
 *
 * ¿Cómo se prueba sin un navegador? Es una prueba de INTEGRACIÓN:
 *   1) Se importa la app de Express real (server/index.js).
 *   2) Se levanta el servidor en un puerto aleatorio (0 -> puerto efímero).
 *   3) Se envían peticiones HTTP reales con `fetch` (global en Node 18+),
 *      igual que lo haría el frontend del proyecto (js/auth.js).
 *
 * Seguridad de la prueba:
 *   - BD temporal (LLAMPAYEC_DB_PATH) para no usar la base real.
 *   - JWT_SECRET fijo ('test-secret') para que los tokens sean reproducibles.
 * ============================================================================
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

// Aislamiento: BD temporal + secreto JWT conocido, ANTES de importar el server.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'llampayec-auth-'));
process.env.LLAMPAYEC_DB_PATH = path.join(tmpDir, 'test.db');
process.env.JWT_SECRET = 'test-secret';

// Importamos la aplicación real. Gracias al cambio en server/index.js, importar
// el módulo NO arranca el listener; lo hacemos a mano con listen(0) (puerto libre).
const app = require('../server/index');

let server;
let base;

// ===========================================================================
// Ciclo de vida de la suite (hooks): arranca el servidor ANTES de los tests
// y lo cierra DESPUÉS, para no dejar procesos huérfanos.
// ===========================================================================
test.before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, resolve); // puerto 0 => el SO asigna uno libre
  });
  base = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => {
  if (server) server.close();
});

// Helper: hace un POST real a la API y devuelve {status, body} parseado.
async function post(url, body) {
  const res = await fetch(base + url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return { status: res.status, data: await res.json() };
}

// ---------------------------------------------------------------------------
// Prueba 01 — Registrar un usuario nuevo (happy path)
// ---------------------------------------------------------------------------
test('register crea un usuario y devuelve token', async () => {
  const { status, data } = await post('/api/auth/register', {
    nombre: 'Pepe',
    apellidos: 'Pérez',
    email: 'pepe@test.com',
    password: '123456'
  });

  // El backend responde 201 Created en un registro exitoso.
  assert.strictEqual(status, 201);

  // Y devuelve un token JWT (firmado con jsonwebtoken) para autenticar sesión.
  assert.ok(data.token, 'Debe devolver JWT');

  // El usuario devuelto coincide con el enviado.
  assert.strictEqual(data.user.email, 'pepe@test.com');

  // La API nunca debe devolver el hash de la contraseña (seguridad).
  assert.strictEqual(data.user.password, undefined, 'No debe exponer el hash');
});

// ---------------------------------------------------------------------------
// Prueba 02 — Email duplicado -> conflicto (409)
// ---------------------------------------------------------------------------
test('register rechaza email duplicado (409)', async () => {
  await post('/api/auth/register', { nombre: 'Uno', email: 'dupe@test.com', password: '123456' });

  // Segundo registro con el mismo email: la BD lanza UNIQUE y la ruta
  // responde 409 Conflict con un mensaje de error.
  const { status, data } = await post('/api/auth/register', { nombre: 'Dos', email: 'dupe@test.com', password: '123456' });
  assert.strictEqual(status, 409);
  assert.match(data.error, /email/i);
});

// ---------------------------------------------------------------------------
// Prueba 03 — Login con credenciales válidas
// ---------------------------------------------------------------------------
test('login acepta credenciales válidas', async () => {
  await post('/api/auth/register', { nombre: 'Luis', email: 'luis@test.com', password: 'abc123' });

  // Iniciar sesión con el email+password correctos (bcrypt verifica el hash).
  const { status, data } = await post('/api/auth/login', { email: 'luis@test.com', password: 'abc123' });
  assert.strictEqual(status, 200);
  assert.ok(data.token);
  assert.strictEqual(data.user.email, 'luis@test.com');
});

// ---------------------------------------------------------------------------
// Prueba 04 — Login con contraseña incorrecta -> no autorizado (401)
// ---------------------------------------------------------------------------
test('login rechaza contraseña incorrecta (401)', async () => {
  const { status, data } = await post('/api/auth/login', { email: 'luis@test.com', password: 'incorrecta' });
  assert.strictEqual(status, 401);
  assert.match(data.error, /inválidas/i);
});

// ---------------------------------------------------------------------------
// Prueba 05 — Ruta protegida /me (seguridad del middleware authenticate)
// ---------------------------------------------------------------------------
test('/me exige token válido', async () => {
  // Sin token: el middleware devuelve 401 (Token requerido).
  const res = await fetch(base + '/api/auth/me');
  assert.strictEqual(res.status, 401);

  // Con token obtenido previamente en el login: devuelve 200 y el usuario.
  const { data } = await post('/api/auth/login', { email: 'luis@test.com', password: 'abc123' });
  const ok = await fetch(base + '/api/auth/me', {
    headers: { Authorization: `Bearer ${data.token}` }
  });
  assert.strictEqual(ok.status, 200);
  const me = await ok.json();
  assert.strictEqual(me.email, 'luis@test.com');
});