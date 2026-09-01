const bcrypt = require('bcryptjs');
const { getDb } = require('./config/db');

async function seed() {
  const db = await getDb();

  db.exec('DELETE FROM contacts');
  db.exec('DELETE FROM orders');
  db.exec('DELETE FROM products');
  db.exec('DELETE FROM users');

  const adminPass = bcrypt.hashSync('admin123', 10);
  db.prepare(
    'INSERT INTO users (nombre, apellidos, email, password, telefono, role) VALUES (?, ?, ?, ?, ?, ?)'
  ).run('Admin', 'Llampayec', 'admin@llampayec.com', adminPass, '+51 943 072 046', 'admin');

  const userPass = bcrypt.hashSync('user123', 10);
  db.prepare(
    'INSERT INTO users (nombre, apellidos, email, password, telefono, role) VALUES (?, ?, ?, ?, ?, ?)'
  ).run('Fátima', 'Carrión Sánchez', 'fatima@llampayec.com', userPass, '+51 943 072 046', 'user');

  const products = [
    ['pan-campesino', 'Pan Campesino Artesanal', 'Elaborado con masa madre, corteza crujiente y miga suave.', 2.50, 'img/productos/pan-campesino.png', 'pan', 1, '', JSON.stringify(['Harina de trigo', 'Masa madre natural', 'Agua', 'Sal marina', 'Levadura'])],
    ['croissant-mantequilla', 'Croissant de Mantequilla', 'Capas de masa hojaldrada con el aroma a mantequilla pura.', 3.00, 'img/productos/croissant-mantequilla.png', 'dulce', 1, '', JSON.stringify(['Harina de trigo', 'Mantequilla pura', 'Agua', 'Sal', 'Azúcar', 'Levadura'])],
    ['tarta-manzana', 'Tarta de Manzana', 'Hojaldre con láminas de manzana fresca y canela.', 3.50, 'img/productos/tarta-manzana.png', 'dulce', 1, '', JSON.stringify(['Masa de hojaldre', 'Manzanas frescas', 'Canela', 'Azúcar', 'Mantequilla', 'Limón'])],
    ['donut-glaseado', 'Donut Glaseado', 'Donut de levadura esponjoso con glaseado clásico de azúcar.', 5.00, 'img/productos/donut-glaseado.png', 'dulce', 0, '', JSON.stringify(['Harina de trigo', 'Azúcar', 'Huevos', 'Leche', 'Mantequilla', 'Glaseado de azúcar', 'Levadura'])],
    ['empanadas-carne', 'Empanadas de Carne', 'Masa hojaldrada rellena de carne seleccionada, pasas y aceituna.', 4.50, 'img/productos/empanadas-carne.png', 'pan', 0, '', JSON.stringify(['Masa hojaldrada', 'Carne de res', 'Pasas', 'Aceitunas', 'Cebolla', 'Especias', 'Huevo'])],
    ['pan-integral', 'Pan Integral Artesanal', 'Pan de trigo integral con semillas de chía y avena.', 3.00, 'img/productos/pan-integral.png', 'pan', 0, '', JSON.stringify(['Harina integral', 'Semillas de chía', 'Avena', 'Agua', 'Sal', 'Levadura'])],
    ['alfajores', 'Alfajores de Maicena', 'Delicados alfajores con dulce de leche y coco rallado.', 2.50, 'img/productos/alfajores.png', 'dulce', 0, '', JSON.stringify(['Maicena', 'Harina de trigo', 'Dulce de leche', 'Coco rallado', 'Mantequilla', 'Azúcar', 'Huevos'])],
    ['bebida-caliente', 'Chocolate Caliente', 'Chocolate espeso artesanal con canela y clavo de olor.', 4.00, 'img/productos/bebida-caliente.png', 'bebida', 0, '', JSON.stringify(['Chocolate artesanal', 'Leche', 'Canela', 'Clavo de olor', 'Azúcar'])],
    ['cafe-americano', 'Café Americano', 'Café suave y aromático, preparado con granos seleccionados.', 4.00, 'img/productos/cafe-americano.png', 'bebida', 0, '', JSON.stringify(['Café grano 100% arábica', 'Agua purificada'])],
    ['cafe-cortado', 'Café Cortado con Leche', 'Café equilibrado con un toque de leche cremosa.', 4.50, 'img/productos/cafe-cortado.png', 'bebida', 0, '', JSON.stringify(['Café espresso', 'Leche cremosa', 'Espuma de leche'])],
    ['cafe-horno', 'Café del Horno', 'Café de olla tradicional con especias, horneado lentamente.', 5.00, 'img/productos/cafe-horno.png', 'bebida', 0, '', JSON.stringify(['Café de olla', 'Piloncillo', 'Canela', 'Clavo de olor', 'Anís'])],
    ['cafe-espresso', 'Café Espresso Corto', 'Espresso intenso y concentrado de sabor profundo.', 3.50, 'img/productos/cafe-espresso.png', 'bebida', 0, '', JSON.stringify(['Café grano tostado', 'Agua purificada'])],
    ['pan-aceituna', 'Pan de Aceituna', 'Pan artesanal con aceitunas negras y hierbas mediterráneas.', 3.50, 'img/productos/pan-aceituna.png', 'pan', 0, '', JSON.stringify(['Harina de trigo', 'Aceitunas negras', 'Aceite de oliva', 'Hierbas mediterráneas', 'Sal', 'Levadura'])],
    ['pan-caracol', 'Pan de Caracol', 'Pan en espiral con canela y pasas, horneado a la perfección.', 3.00, 'img/productos/pan-caracol.png', 'pan', 0, '', JSON.stringify(['Harina de trigo', 'Canela', 'Pasas', 'Mantequilla', 'Azúcar', 'Levadura', 'Huevos'])],
    ['pan-frances', 'Pan Francés', 'Baguette crujiente con corteza dorada y miga esponjosa.', 2.50, 'img/productos/pan-frances.png', 'pan', 0, '', JSON.stringify(['Harina de trigo', 'Agua', 'Sal', 'Levadura'])],
    ['pan-tradicional', 'Pan Tradicional', 'Pan clásico de toda la vida, suave y delicioso.', 2.00, 'img/productos/pan-tradicional.png', 'pan', 0, '', JSON.stringify(['Harina de trigo', 'Agua', 'Sal', 'Levadura', 'Manteca'])],
    ['rosca-muerto', 'Rosca de Muerto', 'Pan dulce tradicional con ajonjolí, perfecto para compartir.', 4.00, 'img/productos/rosca-muerto.png', 'pan', 0, '', JSON.stringify(['Harina de trigo', 'Azúcar', 'Mantequilla', 'Huevos', 'Ajonjolí', 'Levadura', 'Esencia de azahar'])]
  ];

  const insert = db.prepare(
    `INSERT OR IGNORE INTO products (id, name, desc, price, img, category, featured, badge, ingredients)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  for (const p of products) {
    insert.run(...p);
  }

  console.log('✅ Base de datos inicializada con éxito');
  console.log('   Admin: admin@llampayec.com / admin123');
  console.log('   User:  fatima@llampayec.com / user123');
}

seed().catch(console.error);
