const express = require('express');
const { getDb } = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const db = await getDb();
    const { nombre, email, asunto, mensaje } = req.body;

    if (!nombre || !email || !mensaje) {
      return res.status(400).json({ error: 'Nombre, email y mensaje son obligatorios' });
    }

    db.prepare(
      'INSERT INTO contacts (nombre, email, asunto, mensaje) VALUES (?, ?, ?, ?)'
    ).run(nombre, email, asunto || '', mensaje);

    res.status(201).json({ message: 'Mensaje enviado correctamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al enviar mensaje' });
  }
});

router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const db = await getDb();
    const messages = db.prepare('SELECT * FROM contacts ORDER BY created_at DESC').all();
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener mensajes' });
  }
});

module.exports = router;
