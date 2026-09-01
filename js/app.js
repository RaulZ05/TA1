const $ = id => document.getElementById(id);
const qs = (sel, ctx) => (ctx || document).querySelector(sel);

function navigate(page) { window.location.hash = page; }

function getCurrentPage() { return window.location.hash.replace('#', '') || 'home'; }

function updateActiveNav(page) {
  document.querySelectorAll('.main-nav a').forEach(a => {
    a.classList.toggle('active', a.dataset.page === page);
  });
}

function updateNav() {
  const nav = $('main-nav');
  if (!nav) return;
  if (Auth.isAdmin) {
    nav.innerHTML = `
      <a href="#home" data-page="home">INICIO</a>
      <a href="#admin" data-page="admin" class="active">PANEL DE CONTROL</a>
    `;
  } else {
    nav.innerHTML = `
      <a href="#home" class="active" data-page="home">INICIO</a>
      <a href="#productos" data-page="productos">PRODUCTOS</a>
      <a href="#novedades" data-page="novedades">NOVEDADES</a>
      <a href="#historia" data-page="historia">NUESTRA HISTORIA</a>
      <a href="#contacto" data-page="contacto">CONTACTO</a>
    `;
  }
  updateActiveNav(getCurrentPage());
}

function updateHeaderAuth() {
  updateNav();
  const userIcon = $('user-icon');
  if (!userIcon) return;
  const cartBtn = document.getElementById('header-cart-btn');
  if (Auth.isAdmin) {
    if (cartBtn) cartBtn.style.display = 'none';
  } else {
    if (cartBtn) cartBtn.style.display = '';
  }
  if (Auth.isLogged) {
    const foto = Auth.user.foto;
    const inicial = Auth.user.nombre.charAt(0).toUpperCase();
    const avatarHtml = foto
      ? `<img src="${foto}?t=${Date.now()}" class="header-avatar" alt="${Auth.user.nombre}">`
      : `<span class="header-avatar header-avatar-inicial">${inicial}</span>`;
    userIcon.innerHTML = `<a href="#perfil" class="icon-btn header-avatar-link" aria-label="Perfil" title="${Auth.user.nombre}">${avatarHtml}</a>`;
  } else {
    userIcon.innerHTML = `<a href="#login" class="icon-btn" aria-label="Iniciar sesión">🔐</a>`;
  }
}

let currentPage = '';
let isTransitioning = false;

const routes = {
  home:      renderHome,
  productos: renderProductos,
  novedades: renderNovedades,
  historia:  renderHistoria,
  contacto:  renderContacto,
  pago:      renderPago,
  perfil:    renderPerfil,
  login:     renderLogin,
  register:  renderRegister,
  admin:     renderAdmin,
};

function router() {
  const page = getCurrentPage();
  if (page === currentPage || isTransitioning) return;
  currentPage = page;

  const render = routes[page] || renderNotFound;
  const main = $('main-content');

  closeCartDrawer();
  document.getElementById('main-nav')?.classList.remove('open');
  document.getElementById('hamburger')?.classList.remove('active');

  isTransitioning = true;
  const oldContent = main;
  oldContent.classList.add('page-leave');

  setTimeout(() => {
    oldContent.classList.remove('page-leave');
    oldContent.innerHTML = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });

    render(main);
    main.classList.add('page-enter');
    requestAnimationFrame(() => main.classList.add('page-enter-active'));

    setTimeout(() => {
      main.classList.remove('page-enter', 'page-enter-active');
      isTransitioning = false;
    }, 450);

    updateActiveNav(page);
    updateCartBadge();
    renderCartDrawer();
  }, 250);
}

window.addEventListener('hashchange', router);
window.addEventListener('load', () => {
  updateHeaderAuth();
  router();
  initHeaderGlass();
});

/* ===== VIEWS ===== */

async function renderHome(container) {
  container.innerHTML = `
    <section class="hero" id="hero-carousel">
      <img id="hero-img" src="https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&h=500&fit=crop" alt="Panadero amasando pan artesanal">
      <button class="hero-arrow prev" onclick="changeHeroSlide(-1)" aria-label="Anterior">‹</button>
      <button class="hero-arrow next" onclick="changeHeroSlide(1)" aria-label="Siguiente">›</button>
      <div class="hero-content">
        <h1 id="hero-title">EL ARTE DE AMASAR<br>CON EL CORAZÓN</h1>
        <a href="#productos" class="btn">Ver Catálogo</a>
      </div>
      <div class="hero-dots" id="hero-dots">
        <span class="active" onclick="goToHeroSlide(0)"></span>
        <span onclick="goToHeroSlide(1)"></span>
        <span onclick="goToHeroSlide(2)"></span>
      </div>
    </section>

    <section class="page-section">
      <h2 class="section-title">Productos Destacados</h2>
      <div class="products-grid" id="productos-preview"></div>
      <div class="view-more-row"><a href="#productos" class="btn">VER TODO</a></div>
    </section>

    <section class="page-section">
      <h2 class="section-title">Novedades</h2>
      <div class="products-grid" id="novedades-preview"></div>
      <div class="view-more-row"><a href="#novedades" class="btn">VER MÁS</a></div>
    </section>

    <section class="page-section-sm" style="text-align:center;background:var(--color-bg-alt);border-radius:var(--radius-lg);margin-bottom:2rem;">
      <h3 style="margin-bottom:0.8rem;">¿Listo para probar lo mejor de Lambayeque?</h3>
      <p style="color:var(--color-texto-claro);margin-bottom:1.2rem;font-size:0.9rem;">Visítanos o haz tu pedido en línea y recoge en tienda</p>
      <a href="#productos" class="btn">Ordenar Ahora</a>
    </section>
  `;

  try {
    const [featured, novedades] = await Promise.all([
      DB.getFeatured(),
      DB.getNovedades()
    ]);
    $('productos-preview').innerHTML = renderProductCards(featured.slice(0, 3));
    $('novedades-preview').innerHTML = renderProductCards(novedades.slice(0, 3));
  } catch {
    $('productos-preview').innerHTML = '<p>Error al cargar productos</p>';
  }

  initHeroCarousel();
}

async function renderProductos(container) {
  container.innerHTML = `
    <section class="page-section">
      <h2 class="section-title">Nuestros Productos</h2>
      <div class="filter-tabs" id="filter-tabs">
        <button class="filter-tab active" data-filter="todo">Todos</button>
        <button class="filter-tab" data-filter="pan">Pan Artesanal</button>
        <button class="filter-tab" data-filter="dulce">Dulces</button>
        <button class="filter-tab" data-filter="bebida">Bebidas</button>
      </div>
      <div class="products-grid" id="productos-full"></div>
    </section>
  `;

  await renderProductosGrid('todo');

  $('filter-tabs').addEventListener('click', async e => {
    const tab = e.target.closest('.filter-tab');
    if (!tab) return;
    $('filter-tabs').querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    await renderProductosGrid(tab.dataset.filter);
  });
}

async function renderProductosGrid(filter) {
  try {
    const products = await DB.getProducts(filter);
    $('productos-full').innerHTML = products.length
      ? renderProductCards(products)
      : '<p style="color:var(--color-texto-claro);grid-column:1/-1;text-align:center;padding:2rem;">No hay productos en esta categoría.</p>';
  } catch {
    $('productos-full').innerHTML = '<p>Error al cargar productos</p>';
  }
}

async function renderNovedades(container) {
  container.innerHTML = `
    <section class="page-section">
      <h2 class="section-title">Promociones y Novedades</h2>
      <p style="color:var(--color-texto-claro);margin-bottom:1.5rem;">Aprovecha nuestras ofertas especiales y productos de temporada</p>
      <div class="products-grid" id="novedades-full"></div>
    </section>
  `;
  try {
    const products = await DB.getNovedades();
    $('novedades-full').innerHTML = renderProductCards(products);
  } catch {
    $('novedades-full').innerHTML = '<p>Error al cargar</p>';
  }
}

function renderHistoria(container) {
  container.innerHTML = `
    <section class="page-section">
      <div class="historia-row" id="hr-1">
        <div class="historia-text">
          <h2>Nuestra Historia</h2>
          <p>Desde 1995, nuestra cafetería-panadería ha sido un lugar de encuentro donde la tradición artesanal se combina con el amor por lo hecho a mano. Cada día elaboramos nuestros productos con ingredientes seleccionados y técnicas tradicionales que han pasado de generación en generación.</p>
          <p style="margin-top:1rem;">Todo comenzó en un pequeño horno de barro en el corazón de Lambayeque, donde nuestra fundadora, Doña Fátima, decidió compartir sus recetas familiares con la comunidad.</p>
        </div>
        <div class="historia-img"><img src="img/historia/equipo-panaderos.png" alt="Equipo de panaderos" loading="lazy"></div>
      </div>
      <div class="historia-row" id="hr-2">
        <div class="historia-img"><img src="img/historia/postres-artesanales.png" alt="Postres artesanales" loading="lazy"></div>
        <div class="historia-text">
          <h2>Nuestra Pasión</h2>
          <p>La pasión por la panadería artesanal nos impulsa cada mañana. Utilizamos masa madre natural, harinas de primera calidad y mantequillas premium importadas directamente de Francia.</p>
        </div>
      </div>
      <div class="historia-row" id="hr-3">
        <div class="historia-text">
          <h2>Nuestros Valores</h2>
          <p>Creemos en la calidad por sobre todo. Seleccionamos personalmente cada ingrediente, desde la harina hasta la fruta más fresca. Apoyamos a los productores locales de Lambayeque.</p>
        </div>
        <div class="historia-img"><img src="img/historia/ingredientes.png" alt="Ingredientes artesanales" loading="lazy"></div>
      </div>
    </section>
  `;
  initScrollReveal();
}

function renderContacto(container) {
  container.innerHTML = `
    <section class="page-section">
      <h2 class="section-title text-center">Contáctanos</h2>
      <p class="text-center" style="color:var(--color-texto-claro);margin-bottom:2rem;">Estamos aquí para atenderte. Escríbenos o visítanos.</p>
      <div class="contact-grid">
        <div class="contact-form-box">
          <h4>Envíanos un mensaje:</h4>
          <form id="contact-form">
            <div class="field"><label for="contact-nombre">Nombres:</label><input type="text" id="contact-nombre" placeholder="Ingresa tu nombre" required></div>
            <div class="field"><label for="contact-email">Email:</label><input type="email" id="contact-email" placeholder="ejemplo@gmail.com" required></div>
            <div class="field"><label for="contact-asunto">Asunto:</label><select id="contact-asunto"><option>Consulta general</option><option>Pedidos especiales</option><option>Sugerencias</option><option>Reclamos</option></select></div>
            <div class="field"><label for="contact-mensaje">Mensaje:</label><textarea id="contact-mensaje" placeholder="Ingresa tu mensaje aquí..." required></textarea></div>
            <button type="submit" class="btn btn-block">Enviar Mensaje</button>
          </form>
        </div>
        <div>
          <div class="info-cards" style="grid-template-columns:1fr;">
            <div class="info-card"><h5>📅 Horario</h5><p>Lun - Sáb: 7:00 AM - 9:00 PM</p><p>Dom: 8:00 AM - 1:00 PM</p></div>
            <div class="info-card"><h5>📞 Teléfono</h5><p>+51 943 072 046</p><p>+51 965 344 266</p></div>
            <div class="info-card"><h5>📍 Dirección</h5><p>Av. Ramón Castilla Nro 443</p><p>Ct Centro, Lambayeque</p></div>
          </div>
        </div>
      </div>
    </section>
  `;

  $('contact-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    try {
      await DB.submitContact({
        nombre: $('contact-nombre').value,
        email: $('contact-email').value,
        asunto: $('contact-asunto').value,
        mensaje: $('contact-mensaje').value,
      });
      showToast('¡Mensaje enviado correctamente!');
      this.reset();
    } catch { showToast('Error al enviar mensaje'); }
  });
}

async function renderPago(container) {
  container.innerHTML = `
    <section class="page-section">
      <div class="checkout-back"><a href="#productos" aria-label="Volver">↩</a><h2>Pago</h2></div>
      <div class="checkout-layout">
        <div>
          <div class="field"><span style="font-size:0.9rem;color:var(--color-texto-claro);">Dirección de envío:</span><span style="font-weight:600;"> Av. Ramón Castilla 1109</span></div>
          <h4 style="margin-top:1.5rem;margin-bottom:0.6rem;">Método de Pago</h4>
          <div class="pay-form-grid">
            <div class="field"><label for="card-number">Número de tarjeta</label><input id="card-number" type="text" placeholder="1234 5678 9012 3456" maxlength="19" inputmode="numeric"></div>
            <div class="pay-form-row">
              <div class="field"><label for="card-name">Nombre del titular</label><input id="card-name" type="text" placeholder="Nombre completo"></div>
              <div class="field"><label for="card-exp">Vencimiento</label><input id="card-exp" type="text" placeholder="MM/YY" maxlength="5"></div>
            </div>
            <div class="field" style="max-width:120px;"><label for="card-cvv">CVV</label><input id="card-cvv" type="text" placeholder="123" maxlength="4" inputmode="numeric"></div>
          </div>
          <h4 style="margin-bottom:0.4rem;">Envío</h4>
          <div class="radio-group">
            <label><input type="radio" name="envio" checked> Misma dirección de envío</label>
            <label><input type="radio" name="envio"> Dirección diferente</label>
            <label><input type="radio" name="envio"> Recojo en tienda</label>
          </div>
        </div>
        <div>
          <h4 style="margin-bottom:0.8rem;">Resumen del Pedido</h4>
          <div class="summary-box">
            <div id="summary-items"></div>
            <div class="summary-row"><span>Sub total:</span><span id="sum-subtotal">S/0.00</span></div>
            <div class="summary-row"><span>Envío:</span><span id="sum-envio">S/10.00</span></div>
            <div class="summary-row"><span>IGV (13%):</span><span id="sum-igv">S/0.00</span></div>
            <div class="summary-row total"><span>TOTAL:</span><span id="sum-total">S/0.00</span></div>
            <button class="btn btn-block mt-1" onclick="procesarPedido()">Completar Pedido</button>
          </div>
        </div>
      </div>
    </section>
    <div class="modal-overlay" id="modal-pedido"><div class="modal-box"><div class="modal-title">🎉 Pago Procesado</div><div class="modal-body">Tu pedido ha sido registrado exitosamente. Te contactaremos para confirmar la entrega.</div><div class="modal-actions"><button class="cancel" onclick="cerrarModal()">Cancelar</button><button class="accept" onclick="aceptarPedido()">Aceptar</button></div></div></div>
  `;
  renderCheckoutSummary();
}

async function renderPerfil(container) {
  if (!Auth.isLogged) { navigate('login'); return; }

  try {
    const [user, orders] = await Promise.all([
      DB.getUserProfile(),
      DB.getOrders()
    ]);

    const fotoUrl = user.foto ? user.foto : '';

    container.innerHTML = `
      <section class="page-section">
        <div class="perfil-header"><a href="#home" aria-label="Volver">↩</a><h2>Hola, ${user.nombre}</h2></div>
        <div style="margin-bottom:1rem;"><span class="badge-role">${user.role === 'admin' ? '👑 Administrador' : '👤 Usuario'}</span></div>

        <div class="perfil-foto-section">
          <div class="perfil-foto-wrap">
            ${fotoUrl ? `<img src="${fotoUrl}" alt="Foto de perfil" class="perfil-foto" id="perfil-foto-img">` : `<div class="perfil-foto-placeholder" id="perfil-foto-img">${user.nombre.charAt(0).toUpperCase()}</div>`}
            <label class="perfil-foto-upload" for="foto-input" title="Cambiar foto">📷</label>
            <input type="file" id="foto-input" accept="image/jpeg,image/png,image/gif,image/webp" style="display:none">
          </div>
          <div class="perfil-rol">ROL: ${user.role === 'admin' ? 'ADMINISTRADOR' : 'USUARIO'}</div>
          <div id="foto-status" class="foto-status"></div>
        </div>

        <h4 style="margin-bottom:1rem;">Mi Perfil</h4>
        <div class="perfil-form-grid" id="perfil-form">
          <div class="field-edit"><label>Nombres:</label><div class="field-edit-input"><input type="text" value="${user.nombre}" readonly><button onclick="toggleEdit(this)" aria-label="Editar">✎</button></div></div>
          <div class="field-edit"><label>Apellidos:</label><div class="field-edit-input"><input type="text" value="${user.apellidos}" readonly><button onclick="toggleEdit(this)" aria-label="Editar">✎</button></div></div>
          <div class="field-edit"><label>Correo electrónico:</label><div class="field-edit-input" style="background:var(--color-bg-alt);cursor:not-allowed;"><input type="email" value="${user.email}" readonly disabled style="background:transparent;cursor:not-allowed;"></div></div>
          <div class="field-edit"><label>Teléfono:</label><div class="field-edit-input"><input type="text" value="${user.telefono}" readonly><button onclick="toggleEdit(this)" aria-label="Editar">✎</button></div></div>
        </div>
        <button class="btn" onclick="guardarPerfil()" style="margin-bottom:1rem;" id="btn-guardar-perfil" disabled>Guardar Cambios</button>
        <button class="btn btn-outline" onclick="Auth.logout(); navigate('home'); updateHeaderAuth(); showToast('Sesión cerrada')" style="margin-bottom:0.5rem;">Cerrar Sesión</button>

        <div style="clear:both;"></div>
        ${user.role !== 'admin' ? `
        <h2 class="section-title" style="margin-top:2.5rem;display:block;width:100%;">Tus Pedidos</h2>
        <div class="orders-grid" id="orders-container">${orders.map(o => `
          <div class="order-card">
            <span class="order-status ${o.estado}">${o.estado === 'pendiente' ? '⏳ Pendiente' : o.estado === 'entregado' ? '✓ Entregado' : '✕ Cancelado'}</span>
            <div class="order-rows-grid">
              <div class="order-detail-row"><span>🚚</span><div><span class="label">Envío:</span>${o.envio ? 'Sí' : 'No'}</div></div>
              <div class="order-detail-row"><span>📍</span><div><span class="label">Ubicación:</span>${o.ubicacion || 'No especificada'}</div></div>
              <div class="order-detail-row"><span>💲</span><div><span class="label">Monto:</span>${formatPrice(o.monto)}</div></div>
              <div class="order-detail-row"><span>💳</span><div><span class="label">Método:</span>${o.metodo}</div></div>
            </div>
            <div style="font-size:0.72rem;color:var(--color-texto-claro);margin-bottom:0.5rem;">${o.created_at || o.fecha}</div>
          </div>`).join('')}</div>
        ` : ''}
      </section>
    `;

    window._pendingFoto = null;
    const fotoInput = $('foto-input');
    if (fotoInput) {
      fotoInput.addEventListener('change', function() {
        if (!this.files || !this.files[0]) return;
        const file = this.files[0];
        window._pendingFoto = file;

        const img = $('perfil-foto-img');
        if (img) {
          img.src = URL.createObjectURL(file);
          img.className = 'perfil-foto';
          img.onload = () => URL.revokeObjectURL(img.src);
        }
        const status = $('foto-status');
        status.textContent = '🖼️ Foto seleccionada — guarda los cambios para aplicar';
        status.style.color = 'var(--color-marron)';

        $('btn-guardar-perfil').disabled = false;
      });
    }
  } catch {
    container.innerHTML = '<p>Error al cargar perfil</p>';
  }
}

function renderLogin(container) {
  if (Auth.isLogged) { navigate('home'); return; }
  container.innerHTML = `
    <section class="page-section">
      <div class="auth-container">
        <div class="auth-card">
          <div class="auth-header">
            <div class="auth-logo">LL</div>
            <h2>Iniciar Sesión</h2>
            <p style="color:var(--color-texto-claro);font-size:0.85rem;">Bienvenido a Llampayec</p>
          </div>
          <form id="login-form">
            <div class="field">
              <label for="login-email">Email</label>
              <input type="email" id="login-email" placeholder="tu@email.com" required>
            </div>
            <div class="field">
              <label for="login-password">Contraseña</label>
              <input type="password" id="login-password" placeholder="••••••••" required>
            </div>
            <p id="login-error" class="auth-error"></p>
            <button type="submit" class="btn btn-block" id="login-btn">Ingresar</button>
          </form>
          <p class="auth-footer">¿No tienes cuenta? <a href="#register">Regístrate aquí</a></p>
          <div class="auth-creds">
            <p><strong>Demo:</strong></p>
            <p>Admin: admin@llampayec.com / admin123</p>
            <p>User: fatima@llampayec.com / user123</p>
          </div>
        </div>
      </div>
    </section>
  `;

  $('login-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn = $('login-btn');
    const errEl = $('login-error');
    btn.disabled = true;
    btn.textContent = 'Ingresando...';
    errEl.textContent = '';

    try {
      await Auth.login($('login-email').value, $('login-password').value);
      updateHeaderAuth();
      showToast(`¡Bienvenido, ${Auth.user.nombre}!`);
      navigate(Auth.isAdmin ? 'admin' : 'home');
    } catch (err) {
      errEl.textContent = err.message;
    }

    btn.disabled = false;
    btn.textContent = 'Ingresar';
  });
}

function renderRegister(container) {
  if (Auth.isLogged) { navigate('home'); return; }
  container.innerHTML = `
    <section class="page-section">
      <div class="auth-container">
        <div class="auth-card">
          <div class="auth-header">
            <div class="auth-logo">LL</div>
            <h2>Crear Cuenta</h2>
            <p style="color:var(--color-texto-claro);font-size:0.85rem;">Únete a Llampayec</p>
          </div>
          <form id="register-form">
            <div class="field"><label for="reg-nombre">Nombres</label><input type="text" id="reg-nombre" placeholder="Tu nombre" required></div>
            <div class="field"><label for="reg-apellidos">Apellidos</label><input type="text" id="reg-apellidos" placeholder="Tus apellidos"></div>
            <div class="field"><label for="reg-email">Email</label><input type="email" id="reg-email" placeholder="tu@email.com" required></div>
            <div class="field"><label for="reg-telefono">Teléfono</label><input type="text" id="reg-telefono" placeholder="+51 999 999 999"></div>
            <div class="field"><label for="reg-password">Contraseña</label><input type="password" id="reg-password" placeholder="Mínimo 6 caracteres" required minlength="6"></div>
            <p id="register-error" class="auth-error"></p>
            <button type="submit" class="btn btn-block" id="register-btn">Crear Cuenta</button>
          </form>
          <p class="auth-footer">¿Ya tienes cuenta? <a href="#login">Inicia sesión</a></p>
        </div>
      </div>
    </section>
  `;

  $('register-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn = $('register-btn');
    const errEl = $('register-error');
    btn.disabled = true;
    btn.textContent = 'Creando cuenta...';
    errEl.textContent = '';

    try {
      await Auth.register(
        $('reg-nombre').value,
        $('reg-email').value,
        $('reg-password').value,
        $('reg-apellidos').value,
        $('reg-telefono').value
      );
      updateHeaderAuth();
      showToast('¡Cuenta creada con éxito!');
      navigate('home');
    } catch (err) {
      errEl.textContent = err.message;
    }

    btn.disabled = false;
    btn.textContent = 'Crear Cuenta';
  });
}

async function renderAdmin(container) {
  if (!Auth.isLogged) { navigate('login'); return; }
  if (!Auth.isAdmin) { navigate('home'); showToast('No tienes permisos de administrador'); return; }

  container.innerHTML = `
    <section class="page-section">
      <div class="admin-header">
        <h2>👑 Panel de Administración</h2>
        <div class="admin-tabs">
          <button class="admin-tab active" data-tab="dashboard">📊 Dashboard</button>
          <button class="admin-tab" data-tab="products">📦 Productos</button>
          <button class="admin-tab" data-tab="orders">📋 Pedidos</button>
          <button class="admin-tab" data-tab="users">👥 Usuarios</button>
          <button class="admin-tab" data-tab="messages">✉️ Mensajes</button>
        </div>
      </div>
      <div id="admin-content"></div>
    </section>
  `;

  await renderAdminDashboard();

  document.querySelector('.admin-tabs').addEventListener('click', async e => {
    const tab = e.target.closest('.admin-tab');
    if (!tab) return;
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    switch (tab.dataset.tab) {
      case 'dashboard': await renderAdminDashboard(); break;
      case 'products': await renderAdminProducts(); break;
      case 'orders': await renderAdminOrders(); break;
      case 'users': await renderAdminUsers(); break;
      case 'messages': await renderAdminMessages(); break;
    }
  });
}

async function renderAdminDashboard() {
  try {
    const [products, orders, users] = await Promise.all([
      DB.getProducts('todo'),
      DB.getOrders(),
      DB.getUsers()
    ]);

    const totalVentas = orders.reduce((s, o) => s + (o.estado === 'entregado' ? o.monto : 0), 0);
    const pendientes = orders.filter(o => o.estado === 'pendiente').length;

    $('admin-content').innerHTML = `
      <div class="admin-stats">
        <div class="stat-card"><span class="stat-num">${products.length}</span><span class="stat-label">Productos</span></div>
        <div class="stat-card"><span class="stat-num">${orders.length}</span><span class="stat-label">Pedidos Totales</span></div>
        <div class="stat-card"><span class="stat-num">${pendientes}</span><span class="stat-label">Pendientes</span></div>
        <div class="stat-card"><span class="stat-num">${formatPrice(totalVentas)}</span><span class="stat-label">Ventas</span></div>
        <div class="stat-card"><span class="stat-num">${users.length}</span><span class="stat-label">Usuarios</span></div>
      </div>
      <div style="margin-top:2rem;">
        <h4>Últimos Pedidos</h4>
        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead><tr><th>ID</th><th>Usuario</th><th>Monto</th><th>Estado</th><th>Fecha</th></tr></thead>
            <tbody>${orders.slice(0, 5).map(o => `
              <tr><td>#${o.id}</td><td>${o.user_nombre || '—'}</td><td>${formatPrice(o.monto)}</td><td><span class="order-status ${o.estado}" style="font-size:0.7rem;">${o.estado}</span></td><td>${o.created_at || '—'}</td></tr>`).join('') || '<tr><td colspan="5">Sin pedidos</td></tr>'}</tbody>
          </table>
        </div>
      </div>
    `;
  } catch { $('admin-content').innerHTML = '<p>Error al cargar dashboard</p>'; }
}

async function renderAdminProducts() {
  try {
    const products = await DB.getProducts('todo');
    $('admin-content').innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;">
        <h4>Gestión de Productos</h4>
        <button class="btn" onclick="showProductForm()">+ Nuevo Producto</button>
      </div>
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead><tr><th>ID</th><th>Nombre</th><th>Precio</th><th>Categoría</th><th>Destacado</th><th>Acciones</th></tr></thead>
          <tbody>${products.map(p => `
            <tr>
              <td>${p.id}</td>
              <td>${p.name}</td>
              <td>${formatPrice(p.price)}</td>
              <td>${p.category}</td>
              <td>${p.featured ? '⭐' : '—'}</td>
              <td>
                <button class="btn-outline-sm" onclick="showProductForm('${p.id}')">✎</button>
                <button class="btn-outline-sm" onclick="deleteProduct('${p.id}')" style="border-color:#C0392B;color:#C0392B;">🗑</button>
              </td>
            </tr>`).join('')}</tbody>
        </table>
      </div>
    `;
  } catch { $('admin-content').innerHTML = '<p>Error al cargar productos</p>'; }
}

async function renderAdminOrders() {
  try {
    const orders = await DB.getOrders();
    $('admin-content').innerHTML = `
      <h4 style="margin-bottom:1.5rem;">Gestión de Pedidos</h4>
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead><tr><th>ID</th><th>Usuario</th><th>Monto</th><th>Estado</th><th>Método</th><th>Fecha</th><th>Acción</th></tr></thead>
          <tbody>${orders.map(o => `
            <tr>
              <td>#${o.id}</td>
              <td>${o.user_nombre || '—'}</td>
              <td>${formatPrice(o.monto)}</td>
              <td><span class="order-status ${o.estado}">${o.estado}</span></td>
              <td>${o.metodo}</td>
              <td>${o.created_at || '—'}</td>
              <td>
                <select onchange="updateOrderStatus(${o.id}, this.value)" class="admin-select">
                  <option value="pendiente" ${o.estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                  <option value="entregado" ${o.estado === 'entregado' ? 'selected' : ''}>Entregado</option>
                  <option value="cancelado" ${o.estado === 'cancelado' ? 'selected' : ''}>Cancelado</option>
                </select>
              </td>
            </tr>`).join('') || '<tr><td colspan="7">Sin pedidos</td></tr>'}</tbody>
        </table>
      </div>
    `;
  } catch { $('admin-content').innerHTML = '<p>Error al cargar pedidos</p>'; }
}

async function renderAdminUsers() {
  try {
    const users = await DB.getUsers();
    $('admin-content').innerHTML = `
      <h4 style="margin-bottom:1.5rem;">Usuarios Registrados</h4>
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead><tr><th>ID</th><th>Nombre</th><th>Email</th><th>Teléfono</th><th>Rol</th><th>Registro</th></tr></thead>
          <tbody>${users.map(u => `
            <tr>
              <td>${u.id}</td>
              <td>${u.nombre} ${u.apellidos || ''}</td>
              <td>${u.email}</td>
              <td>${u.telefono || '—'}</td>
              <td><span class="badge-role">${u.role === 'admin' ? '👑 Admin' : '👤 User'}</span></td>
              <td>${u.created_at || '—'}</td>
            </tr>`).join('')}</tbody>
        </table>
      </div>
    `;
  } catch { $('admin-content').innerHTML = '<p>Error al cargar usuarios</p>'; }
}

async function renderAdminMessages() {
  try {
    const messages = await DB.getContacts();
    $('admin-content').innerHTML = `
      <h4 style="margin-bottom:1.5rem;">Mensajes de Contacto</h4>
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead><tr><th>ID</th><th>Nombre</th><th>Email</th><th>Asunto</th><th>Mensaje</th><th>Fecha</th></tr></thead>
          <tbody>${messages.map(m => `
            <tr>
              <td>${m.id}</td>
              <td>${m.nombre}</td>
              <td>${m.email}</td>
              <td>${m.asunto || '—'}</td>
              <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${m.mensaje}">${m.mensaje}</td>
              <td>${m.created_at || '—'}</td>
            </tr>`).join('') || '<tr><td colspan="6">Sin mensajes</td></tr>'}</tbody>
        </table>
      </div>
    `;
  } catch { $('admin-content').innerHTML = '<p>Error al cargar mensajes</p>'; }
}

// Admin product form
async function showProductForm(id) {
  let product = null;
  if (id) {
    try { product = await DB.getProductById(id); } catch {}
  }

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay show';
  overlay.style.display = 'flex';
  overlay.innerHTML = `
    <div class="modal-box" style="width:520px;max-width:95vw;text-align:left;max-height:90vh;overflow-y:auto;">
      <div class="modal-title" style="text-align:center;">${product ? '✎ Editar Producto' : '➕ Nuevo Producto'}</div>
      <div style="padding:0 1.8rem 1.8rem;">
        <form id="product-form">
          <div class="field"><label>ID *</label><input type="text" id="pf-id" value="${product?.id || ''}" ${product ? 'readonly' : 'required'} placeholder="ej: pan-nuevo"></div>
          <div class="field"><label>Nombre *</label><input type="text" id="pf-name" value="${product?.name || ''}" required></div>
          <div class="field"><label>Descripción</label><textarea id="pf-desc" rows="2">${product?.desc || ''}</textarea></div>
          <div class="field"><label>Precio *</label><input type="number" id="pf-price" value="${product?.price || ''}" step="0.01" required></div>
          <div class="field"><label>Imagen (ruta)</label><input type="text" id="pf-img" value="${product?.img || 'img/productos/'}" placeholder="img/productos/nombre.png"></div>
          <div class="field"><label>Categoría</label><select id="pf-category"><option value="pan" ${product?.category === 'pan' ? 'selected' : ''}>Pan</option><option value="dulce" ${product?.category === 'dulce' ? 'selected' : ''}>Dulce</option><option value="bebida" ${product?.category === 'bebida' ? 'selected' : ''}>Bebida</option></select></div>
          <div class="field"><label>Ingredientes (separados por coma)</label><input type="text" id="pf-ingredients" value="${(product?.ingredients || []).join(', ')}"></div>
          <label style="display:flex;align-items:center;gap:0.5rem;margin-bottom:1rem;font-size:0.9rem;"><input type="checkbox" id="pf-featured" ${product?.featured ? 'checked' : ''}> Producto destacado</label>
          <p id="pf-error" class="auth-error"></p>
          <div style="display:flex;gap:0.8rem;">
            <button type="submit" class="btn" style="flex:1;">${product ? 'Guardar Cambios' : 'Crear Producto'}</button>
            <button type="button" class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()" style="flex:1;">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  $('product-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const errEl = $('pf-error');
    const data = {
      id: $('pf-id').value,
      name: $('pf-name').value,
      desc: $('pf-desc').value,
      price: parseFloat($('pf-price').value),
      img: $('pf-img').value,
      category: $('pf-category').value,
      ingredients: $('pf-ingredients').value.split(',').map(s => s.trim()).filter(Boolean),
      featured: $('pf-featured').checked
    };

    try {
      if (product) {
        await DB.updateProduct(product.id, data);
        showToast('Producto actualizado');
      } else {
        await DB.createProduct(data);
        showToast('Producto creado');
      }
      overlay.remove();
      await renderAdminProducts();
    } catch (err) {
      errEl.textContent = err.message;
    }
  });
}

async function deleteProduct(id) {
  if (!confirm('¿Eliminar este producto?')) return;
  try {
    await DB.deleteProduct(id);
    showToast('Producto eliminado');
    await renderAdminProducts();
  } catch { showToast('Error al eliminar'); }
}

async function updateOrderStatus(id, estado) {
  try {
    await DB.updateOrderStatus(id, estado);
    showToast('Estado actualizado');
  } catch { showToast('Error al actualizar'); }
}

async function deleteOrder(id) {
  if (!confirm('¿Eliminar este pedido?')) return;
  try {
    await DB.deleteOrder(id);
    showToast('Pedido eliminado');
    renderAdminOrders();
  } catch { showToast('Error al eliminar'); }
}

/* ===== 404 ===== */
function renderNotFound(container) {
  container.innerHTML = `
    <section class="page-section text-center" style="padding:5rem 2rem;">
      <div style="font-size:4rem;margin-bottom:1rem;">🥖</div>
      <h2>Página no encontrada</h2>
      <p style="color:var(--color-texto-claro);margin:1rem 0 2rem;">La página que buscas no existe.</p>
      <a href="#home" class="btn">Volver al inicio</a>
    </section>
  `;
}

/* ===== HELPERS ===== */
function renderProductCards(products) {
  return products.map((p, i) => `
    <div class="product-card" style="animation-delay:${i * 0.06}s">
      <div class="product-img-wrap" onclick='openProductDetail("${p.id}")' style="cursor:pointer">
        <img class="product-img" src="${p.img}" alt="${p.name}" loading="lazy">
        ${p.badge ? `<span class="product-badge">${p.badge}</span>` : ''}
      </div>
      <div class="product-info">
        <h4>${p.name}</h4>
        <p class="product-desc">${p.desc}</p>
        <span class="product-price">${formatPrice(p.price)}</span>
        ${Auth.isAdmin ? '' : `<button class="btn" onclick='addToCart("${p.id}")'>🛒 Agregar al carrito</button>`}
      </div>
    </div>
  `).join('');
}

function renderCheckoutSummary() {
  const cart = getCart();
  const itemsEl = $('summary-items');

  if (cart.length === 0) {
    itemsEl.innerHTML = '<p style="color:var(--color-texto-claro);font-size:0.85rem;">No hay productos en el carrito.</p>';
  } else {
    itemsEl.innerHTML = cart.map(item => {
      const p = DB.getProductByIdSync ? DB.getProductByIdSync(item.id) : null;
      if (!p) return '';
      return `
        <div class="summary-item">
          <img src="${p.img}" alt="${p.name}" loading="lazy">
          <div><div class="name">${p.name}</div><div class="meta">${item.qty} Und. - ${formatPrice(p.price)} c/u</div></div>
          <span class="price">${formatPrice(p.price * item.qty)}</span>
        </div>`;
    }).join('');
  }

  const subtotal = getCartTotal();
  const igv = subtotal * IGV_RATE;
  const envio = cart.length > 0 ? ENVIO_FIJO : 0;
  const total = subtotal + igv + envio;

  $('sum-subtotal').textContent = formatPrice(subtotal);
  $('sum-envio').textContent = formatPrice(envio);
  $('sum-igv').textContent = formatPrice(igv);
  $('sum-total').textContent = formatPrice(total);
}

// Keep a local copy of products for cart rendering (sync access)
DB.productsCache = [];

async function loadProductsCache() {
  try { DB.productsCache = await DB.getProducts('todo'); } catch {}
}

DB.getProductByIdSync = function(id) {
  return DB.productsCache.find(p => p.id === id);
};

// Update getProductById to also check cache
const origGetProductById = DB.getProductById;
DB.getProductById = async function(id) {
  try {
    return await origGetProductById.call(DB, id);
  } catch {
    return DB.getProductByIdSync(id);
  }
};

// Load cache on startup
loadProductsCache();

function procesarPedido() {
  if (getCart().length === 0) { showToast('Tu carrito está vacío'); return; }
  if (!Auth.isLogged) { showToast('Debes iniciar sesión'); navigate('login'); return; }
  $('modal-pedido').classList.add('show');
}

function cerrarModal() { $('modal-pedido')?.classList.remove('show'); }

async function aceptarPedido() {
  const total = getCartTotal() + getCartTotal() * IGV_RATE + ENVIO_FIJO;
  const items = getCart().map(i => i.id);
  try {
    await DB.createOrder(items, total, 'Tarjeta de Crédito');
    saveCart([]);
    cerrarModal();
    renderCheckoutSummary();
    showToast('¡Pedido completado con éxito!');
    setTimeout(() => navigate('home'), 1500);
  } catch { showToast('Error al procesar pedido'); }
}

function toggleEdit(btn) {
  const input = btn.parentElement.querySelector('input');
  const isReadonly = input.hasAttribute('readonly');
  if (isReadonly) {
    input.removeAttribute('readonly');
    input.focus();
    btn.textContent = '✓';
    $('btn-guardar-perfil').disabled = false;
  } else {
    input.setAttribute('readonly', '');
    btn.textContent = '✎';
  }
}

async function guardarPerfil() {
  const btn = $('btn-guardar-perfil');
  btn.disabled = true;
  btn.textContent = 'Guardando...';

  try {
    if (window._pendingFoto) {
      const formData = new FormData();
      formData.append('foto', window._pendingFoto);
      const res = await fetch('/api/users/profile/picture', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${Auth.token}` },
        body: formData
      });
      const picData = await res.json();
      if (!res.ok) throw new Error(picData.error);
      Auth.user.foto = picData.foto;
      window._pendingFoto = null;
    }

    const form = $('perfil-form');
    const inputs = form.querySelectorAll('input');
    const data = {};
    inputs.forEach(inp => {
      const label = inp.closest('.field-edit').querySelector('label').textContent.replace(':', '').trim().toLowerCase();
      data[label] = inp.value;
      inp.setAttribute('readonly', '');
      inp.parentElement.querySelector('button').textContent = '✎';
    });

    const updated = await DB.updateUserProfile({
      nombre: data['nombres'],
      apellidos: data['apellidos'],
      email: data['correo electrónico'],
      telefono: data['teléfono']
    });

    Auth.user = { ...Auth.user, ...updated };
    localStorage.setItem('llampayec_user', JSON.stringify(Auth.user));
    updateHeaderAuth();

    const status = $('foto-status');
    if (status) status.textContent = '';
    btn.textContent = 'Guardar Cambios';
    showToast('Perfil actualizado');
  } catch {
    btn.disabled = false;
    btn.textContent = 'Guardar Cambios';
    showToast('Error al actualizar');
  }
}

/* ===== Hero Carousel ===== */
let heroIndex = 0;
let heroAutoplay;
function initHeroCarousel() { heroIndex = 0; restartAutoplay(); }
const heroSlides = [
  { img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&h=500&fit=crop', title: 'EL ARTE DE AMASAR<br>CON EL CORAZÓN' },
  { img: 'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?w=1200&h=500&fit=crop', title: 'PAN RECIÉN HORNEADO<br>CADA MAÑANA' },
  { img: 'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=1200&h=500&fit=crop', title: 'TRADICIÓN ARTESANAL<br>DESDE 1995' }
];

function renderHeroSlide() {
  const slide = heroSlides[heroIndex];
  const img = $('hero-img');
  if (!img) return;
  img.style.opacity = 0;
  setTimeout(() => { img.src = slide.img; img.style.opacity = 1; }, 200);
  const title = $('hero-title');
  if (title) title.innerHTML = slide.title;
  document.querySelectorAll('#hero-dots span').forEach((dot, i) => dot.classList.toggle('active', i === heroIndex));
}

function changeHeroSlide(delta) { heroIndex = (heroIndex + delta + heroSlides.length) % heroSlides.length; renderHeroSlide(); restartAutoplay(); }
function goToHeroSlide(i) { heroIndex = i; renderHeroSlide(); restartAutoplay(); }
function restartAutoplay() { clearInterval(heroAutoplay); heroAutoplay = setInterval(() => changeHeroSlide(1), 8000); }

function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('reveal'); observer.unobserve(entry.target); }
    });
  }, { threshold: 0.2 });
  document.querySelectorAll('.historia-row').forEach(row => observer.observe(row));
}

/* ===== Product Detail ===== */
async function openProductDetail(id) {
  let p;
  try { p = await DB.getProductById(id); } catch { p = DB.getProductByIdSync(id); }
  if (!p) return;

  $('detail-img').src = p.img;
  $('detail-img').alt = p.name;
  $('detail-name').textContent = p.name;
  $('detail-price').textContent = formatPrice(p.price);
  $('detail-desc').textContent = p.desc;

  const ingredients = p.ingredients || [];
  $('detail-ingredients').innerHTML = ingredients.length
    ? ingredients.map(i => `<li>${i}</li>`).join('')
    : '<li style="background:transparent;color:var(--color-texto-claro);padding:0;">Información no disponible</li>';

  const cartBtn = $('detail-cart-btn');
  if (Auth.isAdmin) {
    cartBtn.style.display = 'none';
  } else {
    cartBtn.style.display = '';
    cartBtn.onclick = () => { addToCart(p.id); closeProductDetail(); };
  }

  $('detail-overlay').classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeProductDetail(e) {
  if (e && e.target !== e.currentTarget) return;
  $('detail-overlay').classList.remove('show');
  document.body.style.overflow = '';
}
