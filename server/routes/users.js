const express = require('express');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getDb } = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'img', 'foto_perfil');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `fp_${req.user.id}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  }
});

const USER_COLS = 'id, nombre, apellidos, email, telefono, foto, role, created_at';

router.get('/profile', authenticate, async (req, res) => {
  try {
    const db = await getDb();
    const user = db.prepare(`SELECT ${USER_COLS} FROM users WHERE id = ?`).get(req.user.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch { res.status(500).json({ error: 'Error al obtener perfil' }); }
});

router.put('/profile', authenticate, async (req, res) => {
  try {
    const db = await getDb();
    const { nombre, apellidos, email, telefono, password } = req.body;
    const current = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!current) return res.status(404).json({ error: 'Usuario no encontrado' });

    if (email && email !== current.email) {
      const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, req.user.id);
      if (existing) return res.status(409).json({ error: 'El email ya está en uso' });
    }

    db.prepare(
      'UPDATE users SET nombre=?, apellidos=?, email=?, telefono=?, password=? WHERE id=?'
    ).run(
      nombre ?? current.nombre,
      apellidos ?? current.apellidos,
      email ?? current.email,
      telefono ?? current.telefono,
      password ? bcrypt.hashSync(password, 10) : current.password,
      req.user.id
    );

    const user = db.prepare(`SELECT ${USER_COLS} FROM users WHERE id = ?`).get(req.user.id);
    res.json(user);
  } catch { res.status(500).json({ error: 'Error al actualizar perfil' }); }
});

router.post('/profile/picture', authenticate, (req, res) => {
  upload.single('foto')(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'La imagen no debe superar 2MB' });
      return res.status(400).json({ error: 'Error al subir la imagen' });
    }
    if (!req.file) return res.status(400).json({ error: 'Selecciona una imagen' });

    const fotoPath = `img/foto_perfil/${req.file.filename}`;

    try {
      const db = await getDb();
      db.prepare('UPDATE users SET foto = ? WHERE id = ?').run(fotoPath, req.user.id);
      const user = db.prepare(`SELECT ${USER_COLS} FROM users WHERE id = ?`).get(req.user.id);
      res.json(user);
    } catch { res.status(500).json({ error: 'Error al guardar la foto' }); }
  });
});

router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const db = await getDb();
    const users = db.prepare(`SELECT ${USER_COLS}, created_at FROM users ORDER BY created_at DESC`).all();
    res.json(users);
  } catch { res.status(500).json({ error: 'Error al obtener usuarios' }); }
});

module.exports = router;
