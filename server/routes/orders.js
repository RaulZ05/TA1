const express = require('express');
const { getDb } = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

function parseOrder(o) {
  return { ...o, items: JSON.parse(o.items || '[]'), envio: !!o.envio };
}

router.get('/', authenticate, async (req, res) => {
  try {
    const db = await getDb();
    let orders;
    if (req.user.role === 'admin') {
      orders = db.prepare(`
        SELECT o.*, u.nombre AS user_nombre, u.email AS user_email
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        ORDER BY o.created_at DESC
      `).all();
    } else {
      orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
    }
    res.json(orders.map(parseOrder));
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener pedidos' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const db = await getDb();
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });
    if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permiso para ver este pedido' });
    }
    res.json(parseOrder(order));
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener pedido' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const db = await getDb();
    const { envio, ubicacion, metodo, items, monto } = req.body;
    if (!items || !items.length) {
      return res.status(400).json({ error: 'El pedido debe tener al menos un producto' });
    }

    const result = db.prepare(
      `INSERT INTO orders (user_id, estado, envio, ubicacion, monto, metodo, items)
       VALUES (?, 'pendiente', ?, ?, ?, ?, ?)`
    ).run(req.user.id, envio ? 1 : 0, ubicacion || '', monto || 0, metodo || '', JSON.stringify(items));

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(parseOrder(order));
  } catch (err) {
    res.status(500).json({ error: 'Error al crear pedido' });
  }
});

router.put('/:id/status', authenticate, authorize('admin'), async (req, res) => {
  try {
    const db = await getDb();
    const { estado } = req.body;
    if (!['pendiente', 'entregado', 'cancelado'].includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido. Use: pendiente, entregado, cancelado' });
    }

    const existing = db.prepare('SELECT id FROM orders WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Pedido no encontrado' });

    db.prepare('UPDATE orders SET estado = ? WHERE id = ?').run(estado, req.params.id);
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    res.json(parseOrder(order));
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar pedido' });
  }
});

router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const db = await getDb();
    const existing = db.prepare('SELECT id FROM orders WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Pedido no encontrado' });
    db.prepare('DELETE FROM orders WHERE id = ?').run(req.params.id);
    res.json({ message: 'Pedido eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar pedido' });
  }
});

module.exports = router;
