const express = require('express');
const { getDb } = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

function parseProduct(p) {
  return { ...p, ingredients: JSON.parse(p.ingredients || '[]'), featured: !!p.featured };
}

router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const { filter } = req.query;
    let products;
    if (!filter || filter === 'todo') {
      products = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
    } else {
      products = db.prepare('SELECT * FROM products WHERE category = ? ORDER BY created_at DESC').all(filter);
    }
    res.json(products.map(parseProduct));
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

router.get('/featured', async (req, res) => {
  try {
    const db = await getDb();
    const products = db.prepare('SELECT * FROM products WHERE featured = 1 ORDER BY created_at DESC').all();
    res.json(products.map(parseProduct));
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener destacados' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(parseProduct(product));
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener producto' });
  }
});

router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const db = await getDb();
    const { id, name, desc, price, img, category, featured, badge, ingredients } = req.body;

    if (!id || !name || price === undefined) {
      return res.status(400).json({ error: 'id, name y price son obligatorios' });
    }

    const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(id);
    if (existing) return res.status(409).json({ error: 'Ya existe un producto con ese ID' });

    db.prepare(
      `INSERT INTO products (id, name, desc, price, img, category, featured, badge, ingredients)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, name, desc || '', price, img || '', category || 'pan', featured ? 1 : 0, badge || '', JSON.stringify(ingredients || []));

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    res.status(201).json(parseProduct(product));
  } catch (err) {
    res.status(500).json({ error: 'Error al crear producto' });
  }
});

router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const db = await getDb();
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Producto no encontrado' });

    const { name, desc, price, img, category, featured, badge, ingredients } = req.body;

    db.prepare(
      `UPDATE products SET name=?, desc=?, price=?, img=?, category=?, featured=?, badge=?, ingredients=?
       WHERE id=?`
    ).run(
      name ?? existing.name,
      desc ?? existing.desc,
      price ?? existing.price,
      img ?? existing.img,
      category ?? existing.category,
      featured !== undefined ? (featured ? 1 : 0) : existing.featured,
      badge ?? existing.badge,
      ingredients ? JSON.stringify(ingredients) : existing.ingredients,
      req.params.id
    );

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    res.json(parseProduct(product));
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const db = await getDb();
    const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Producto no encontrado' });

    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    res.json({ message: 'Producto eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

module.exports = router;
