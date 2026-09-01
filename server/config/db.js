const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.LLAMPAYEC_DB_PATH || path.join(__dirname, '..', 'llampayec.db');

let db = null;
let api = null;

function _execStmt(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  const objects = [];
  while (stmt.step()) {
    objects.push(stmt.getAsObject());
  }
  stmt.free();
  return objects;
}

function _runStmt(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  stmt.step();
  stmt.free();
  const lastId = db.exec("SELECT last_insert_rowid() as id");
  const changes = db.exec("SELECT changes() as c");
  saveDb();
  return {
    lastInsertRowid: lastId[0]?.values?.[0]?.[0] || 0,
    changes: changes[0]?.values?.[0]?.[0] || 0
  };
}

function saveDb() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

async function getDb() {
  if (api) return api;

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    db = new SQL.Database(fs.readFileSync(DB_PATH));
  } else {
    db = new SQL.Database();
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      apellidos TEXT DEFAULT '',
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      telefono TEXT DEFAULT '',
      foto TEXT DEFAULT '',
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      desc TEXT DEFAULT '',
      price REAL NOT NULL,
      img TEXT DEFAULT '',
      category TEXT DEFAULT 'pan',
      featured INTEGER DEFAULT 0,
      badge TEXT DEFAULT '',
      ingredients TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      estado TEXT DEFAULT 'pendiente',
      envio INTEGER DEFAULT 1,
      ubicacion TEXT DEFAULT '',
      monto REAL DEFAULT 0,
      metodo TEXT DEFAULT '',
      items TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT DEFAULT '',
      email TEXT DEFAULT '',
      asunto TEXT DEFAULT '',
      mensaje TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  try { db.exec("ALTER TABLE users ADD COLUMN foto TEXT DEFAULT ''"); } catch {}

  saveDb();

  api = {
    prepare(sql) {
      return {
        get(...params) {
          const rows = _execStmt(sql, params);
          return rows.length > 0 ? rows[0] : undefined;
        },
        all(...params) {
          return _execStmt(sql, params);
        },
        run(...params) {
          return _runStmt(sql, params);
        }
      };
    },
    exec(sql) {
      db.exec(sql);
      saveDb();
    }
  };

  return api;
}

module.exports = { getDb };
