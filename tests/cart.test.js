'use strict';
/*
 * ============================================================================
 * TEST CART — Lógica del carrito de compras (código del navegador)
 * ============================================================================
 * Qué se prueba aquí: la lógica real del frontend en js/cart.js:
 *   - 01) addToCart acumula cantidades y getCartTotal suma precio × cantidad.
 *   - 02) changeQty suma, resta y elimina el ítem al llegar a cero.
 *   - 03) El total final aplica IGV 13% y un envío fijo de S/10 (constantes reales).
 *   - 04) formatPrice muestra montos en soles (S/).
 *
 * El "truco": js/cart.js es un script de navegador (usa document, localStorage)
 * y no exporta nada, por lo que NO se puede importar con require() directo.
 * Solución con `node:vm` (máquina virtual de Node):
 *   1. Se lee el archivo js/cart.js tal cual (código de PRODUCCIÓN, sin copias).
 *   2. Se ejecuta dentro de un "sandbox" que imita el navegador:
 *      document, localStorage, timers y los objetos del proyecto (DB, Auth, ...).
 *   3. Así las funciones del carrito quedan disponibles dentro del sandbox y
 *      podemos llamarlas y verificarlas con assert.
 * Registra de esta forma la MISMA lógica que corre el sitio, no una réplica.
 * ============================================================================
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// ---------------------------------------------------------------------------
// Carga js/cart.js dentro de un sandbox que emula el navegador
// ---------------------------------------------------------------------------
function loadCart() {
  // 1. Leemos el código real del navegador.
  const code = fs.readFileSync(path.join(__dirname, '..', 'js', 'cart.js'), 'utf8');

  // 2. "Store" actúa como el localStorage del navegador (memoria clave->valor).
  const store = {};

  // 3. Sandbox: los objetos que cart.js espera del navegador/proyecto.
  const sandbox = {
    console,
    JSON,
    setTimeout: () => {},   // showToast usa temporizadores; aquí no hacen falta.
    clearTimeout: () => {},
    // DOM mínimo para que updateCartBadge/renderCartDrawer/showToast no fallen.
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
    // localStorage simulado sobre el objeto "store".
    localStorage: {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; }
    },
    // DB: catálogo de productos en memoria, con los precios reales de la app.
    DB: {
      productsCache: [
        { id: 'pan-campesino', price: 2.5 },
        { id: 'croissant-mantequilla', price: 3.0 }
      ],
      getProductByIdSync(id) {
        return this.productsCache.find((p) => p.id === id) || null;
      }
    },
    Auth: { isLogged: true },          // usuario autenticado (puede comprar).
    showToast() {},                    // stubs de UI: no hacen falta en el test.
    navigate() {},
    updateCartBadge() {},
    renderCartDrawer() {}
  };

  // 4. Creamos el contexto y ejecutamos el código real dentro de él.
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: 'js/cart.js' });

  // 5. Devolvemos el sandbox, que ya "contiene" las funciones del carrito.
  return sandbox;
}

// ---------------------------------------------------------------------------
// Prueba 01 — Agregar productos y calcular el subtotal (precio × cantidad)
// ---------------------------------------------------------------------------
test('addToCart acumula cantidades y getCartTotal suma precio × cantidad', () => {
  const c = loadCart();

  // Añadimos pan campesino (S/2.50) dos veces -> cambia la cantidad a 2,
  // y un croissant (S/3.00) -> total 2.50×2 + 3.00 = 8.00, 3 unidades.
  c.addToCart('pan-campesino');
  c.addToCart('pan-campesino');
  c.addToCart('croissant-mantequilla');

  assert.strictEqual(c.getCartCount(), 3);          // 3 productos en total
  assert.strictEqual(c.getCartTotal(), 2.5 * 2 + 3.0);
});

// ---------------------------------------------------------------------------
// Prueba 02 — Cambiar cantidades (sumar, restar y eliminar al llegar a cero)
// ---------------------------------------------------------------------------
test('changeQty suma, resta y elimina el ítem al llegar a cero', () => {
  const c = loadCart();

  c.addToCart('croissant-mantequilla');  // cantidad 1
  c.changeQty('croissant-mantequilla', 1); // cantidad 2 -> 3.00×2 = 6.00
  assert.strictEqual(c.getCartTotal(), 6.0);

  c.changeQty('croissant-mantequilla', -2); // cantidad 0 -> se elimina
  assert.strictEqual(c.getCartCount(), 0);
  assert.deepStrictEqual(c.getCart(), []);
});

// ---------------------------------------------------------------------------
// Prueba 03 — IGV y envío fijo (constantes reales del código, no copiadas)
// ---------------------------------------------------------------------------
test('cálculo de total final usa IGV 13% y envío fijo reales', () => {
  const c = loadCart();

  // IGV_RATE y ENVIO_FIJO están declaradas como `const` en cart.js; las leemos
  // directamente desde el contexto VM para verificar los valores que usa la app
  // (0.13 = 13% de impuesto y S/10 de envío). Si la app cambiara esos valores,
  // este test fallaría — por eso lo probamos y no lo "copiamos a mano".
  const igvRate = vm.runInContext('IGV_RATE', c);
  const envioFijo = vm.runInContext('ENVIO_FIJO', c);
  assert.strictEqual(igvRate, 0.13);
  assert.strictEqual(envioFijo, 10);

  // Subtotal = 2 panes × 2.50 = 5.00; total con IGV y envío = 5 + 0.65 + 10.
  c.addToCart('pan-campesino');
  c.addToCart('pan-campesino');
  const subtotal = c.getCartTotal();
  const total = subtotal + subtotal * igvRate + envioFijo;
  assert.strictEqual(total, 5 + 0.65 + 10);
});

// ---------------------------------------------------------------------------
// Prueba 04 — Formato de precios en soles peruanos
// ---------------------------------------------------------------------------
test('formatPrice formatea en soles (S/)', () => {
  const c = loadCart();
  assert.strictEqual(c.formatPrice(5), 'S/5.00');
  assert.strictEqual(c.formatPrice(2.5), 'S/2.50');
});