'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Carga js/cart.js en un contexto VM con stubs del navegador, para probar
// la lógica real del carrito sin reescribirla.
function loadCart() {
  const code = fs.readFileSync(path.join(__dirname, '..', 'js', 'cart.js'), 'utf8');
  const store = {};
  const sandbox = {
    console,
    JSON,
    setTimeout: () => {},
    clearTimeout: () => {},
    document: {
      body: { appendChild() {} },
      querySelector: () => null,
      createElement: () => ({
        className: '',
        textContent: '',
        classList: { add() {}, remove() {} },
        appendChild() {}
      })
    },
    localStorage: {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; }
    },
    DB: {
      productsCache: [
        { id: 'pan-campesino', price: 2.5 },
        { id: 'croissant-mantequilla', price: 3.0 }
      ],
      getProductByIdSync(id) {
        return this.productsCache.find((p) => p.id === id) || null;
      }
    },
    Auth: { isLogged: true },
    showToast() {},
    navigate() {},
    updateCartBadge() {},
    renderCartDrawer() {}
  };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: 'js/cart.js' });
  return sandbox;
}

test('addToCart acumula cantidades y getCartTotal suma precio × cantidad', () => {
  const c = loadCart();
  c.addToCart('pan-campesino');
  c.addToCart('pan-campesino');
  c.addToCart('croissant-mantequilla');

  assert.strictEqual(c.getCartCount(), 3);
  assert.strictEqual(c.getCartTotal(), 2.5 * 2 + 3.0);
});

test('changeQty suma, resta y elimina el ítem al llegar a cero', () => {
  const c = loadCart();
  c.addToCart('croissant-mantequilla');
  c.changeQty('croissant-mantequilla', 1);
  assert.strictEqual(c.getCartTotal(), 6.0);

  c.changeQty('croissant-mantequilla', -2);
  assert.strictEqual(c.getCartCount(), 0);
  assert.deepStrictEqual(c.getCart(), []);
});

test('cálculo de total final usa IGV 13% y envío fijo reales', () => {
  const c = loadCart();
  const igvRate = vm.runInContext('IGV_RATE', c);
  const envioFijo = vm.runInContext('ENVIO_FIJO', c);
  assert.strictEqual(igvRate, 0.13);
  assert.strictEqual(envioFijo, 10);

  c.addToCart('pan-campesino');
  c.addToCart('pan-campesino');
  const subtotal = c.getCartTotal();
  const total = subtotal + subtotal * igvRate + envioFijo;
  assert.strictEqual(total, 5 + 0.65 + 10);
});

test('formatPrice formatea en soles (S/)', () => {
  const c = loadCart();
  assert.strictEqual(c.formatPrice(5), 'S/5.00');
  assert.strictEqual(c.formatPrice(2.5), 'S/2.50');
});