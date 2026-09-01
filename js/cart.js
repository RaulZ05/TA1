const CART_KEY = 'llampayec_cart';
const IGV_RATE = 0.13;
const ENVIO_FIJO = 10.00;

function getCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function _getProduct(id) {
  return (DB.getProductByIdSync && DB.getProductByIdSync(id)) || null;
}

function addToCart(productId, qty = 1) {
  if (!Auth.isLogged) {
    showToast('Debes iniciar sesión para comprar');
    navigate('login');
    return;
  }
  const product = _getProduct(productId);
  if (!product) return;

  const cart = getCart();
  const existing = cart.find(item => item.id === productId);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ id: productId, qty });
  }

  saveCart(cart);
  updateCartBadge(true);
  showToast('¡Añadido al carrito!');
  renderCartDrawer();
}

function removeFromCart(productId) {
  let cart = getCart();
  cart = cart.filter(item => item.id !== productId);
  saveCart(cart);
  renderCartDrawer();
  if (typeof renderCheckoutSummary === 'function') renderCheckoutSummary();
}

function changeQty(productId, delta) {
  const cart = getCart();
  const item = cart.find(i => i.id === productId);
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0) return removeFromCart(productId);

  saveCart(cart);
  renderCartDrawer();
  if (typeof renderCheckoutSummary === 'function') renderCheckoutSummary();
}

function getCartTotal() {
  const cart = getCart();
  return cart.reduce((sum, item) => {
    const product = _getProduct(item.id);
    if (!product) return sum;
    return sum + product.price * item.qty;
  }, 0);
}

function getCartCount() {
  const cart = getCart();
  return cart.reduce((sum, item) => sum + item.qty, 0);
}

function formatPrice(n) {
  return 'S/' + n.toFixed(2);
}

function updateCartBadge(animate = false) {
  const badge = document.querySelector('.cart-badge');
  if (!badge) return;
  const count = getCartCount();
  badge.textContent = count;
  badge.style.display = count > 0 ? 'flex' : 'none';
  if (animate) {
    badge.classList.remove('bump');
    void badge.offsetWidth;
    badge.classList.add('bump');
  }
}

function renderCartDrawer() {
  const container = document.querySelector('.cart-items');
  const footer = document.querySelector('.cart-drawer-footer');
  if (!container) return;

  const cart = getCart();

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon">🛍️</div>
        <strong>Tu carrito está vacío</strong>
        <span>Agrega algunos productos deliciosos</span>
      </div>`;
    if (footer) footer.style.display = 'none';
    return;
  }

  if (footer) footer.style.display = 'block';

  container.innerHTML = cart.map(item => {
    const product = _getProduct(item.id);
    if (!product) return '';
    return `
      <div class="cart-item">
        <img src="${product.img}" alt="${product.name}" loading="lazy">
        <div class="cart-item-info">
          <div class="name">${product.name}</div>
          <div class="price">${formatPrice(product.price)}</div>
          <div class="qty-control">
            <button onclick="changeQty('${product.id}', -1)" aria-label="Quitar uno">−</button>
            <span>${item.qty}</span>
            <button onclick="changeQty('${product.id}', 1)" aria-label="Agregar uno">+</button>
          </div>
        </div>
        <button class="cart-item-remove" onclick="removeFromCart('${product.id}')" aria-label="Eliminar producto">🗑</button>
      </div>`;
  }).join('');

  const totalEl = document.querySelector('.cart-total-amount');
  if (totalEl) totalEl.textContent = formatPrice(getCartTotal());
}

function toggleCartDrawer() {
  const drawer = document.querySelector('.cart-drawer');
  const overlay = document.querySelector('.overlay');
  if (!drawer) return;
  drawer.classList.toggle('open');
  if (overlay) overlay.classList.toggle('show');
}

function closeCartDrawer() {
  const drawer = document.querySelector('.cart-drawer');
  const overlay = document.querySelector('.overlay');
  if (drawer) drawer.classList.remove('open');
  if (overlay) overlay.classList.remove('show');
}

let toastTimeout;
function showToast(msg) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 2200);
}

function initHeaderGlass() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 24);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

function toggleMobileNav() {
  document.getElementById('main-nav')?.classList.toggle('open');
  document.getElementById('hamburger')?.classList.toggle('active');
}
