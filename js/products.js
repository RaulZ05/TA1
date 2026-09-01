/* ============================================
   LLAMPAYEC - Catálogo de productos
   ============================================ */

const PRODUCTS = [
  {
    id: 'pan-campesino',
    name: 'Pan Campesino Artesanal',
    desc: 'Elaborado con masa madre, corteza crujiente y miga suave.',
    price: 2.50,
    img: 'img/productos/pan-campesino.png'
  },
  {
    id: 'croissant-mantequilla',
    name: 'Croissant de Mantequilla',
    desc: 'Capas de masa hojaldrada con el aroma a mantequilla pura.',
    price: 3.00,
    img: 'img/productos/croissant-mantequilla.png'
  },
  {
    id: 'tarta-manzana',
    name: 'Tarta de Manzana',
    desc: 'Hojaldre con láminas de manzana fresca y canela.',
    price: 3.50,
    img: 'img/productos/tarta-manzana.png'
  },
  {
    id: 'donut-glaseado',
    name: 'Donut Glaseado',
    desc: 'Donut de levadura esponjoso con glaseado clásico de azúcar.',
    price: 5.00,
    img: 'img/productos/donut-glaseado.png'
  },
  {
    id: 'empanadas-carne',
    name: 'Empanadas de Carne',
    desc: 'Masa hojaldrada rellena de carne seleccionada, pasas y aceituna. Horneada al punto.',
    price: 4.50,
    img: 'img/productos/empanadas-carne.png'
  },
  {
    id: 'tarta-manzana-2',
    name: 'Tarta de Manzana',
    desc: 'Hojaldre con láminas de manzana fresca y canela.',
    price: 3.50,
    img: 'img/productos/tarta-manzana.png'
  },
  {
    id: 'cafe-americano',
    name: 'Café Americano',
    desc: 'Café suave y aromático, preparado con granos seleccionados.',
    price: 4.00,
    img: 'img/productos/cafe-americano.png'
  },
  {
    id: 'cafe-cortado',
    name: 'Café Cortado con Leche',
    desc: 'Café equilibrado con un toque de leche cremosa.',
    price: 4.50,
    img: 'img/productos/cafe-cortado.png'
  },
  {
    id: 'cafe-horno',
    name: 'Café del Horno',
    desc: 'Café de olla tradicional con especias, horneado lentamente.',
    price: 5.00,
    img: 'img/productos/cafe-horno.png'
  },
  {
    id: 'cafe-espresso',
    name: 'Café Espresso Corto',
    desc: 'Espresso intenso y concentrado de sabor profundo.',
    price: 3.50,
    img: 'img/productos/cafe-espresso.png'
  },
  {
    id: 'pan-aceituna',
    name: 'Pan de Aceituna',
    desc: 'Pan artesanal con aceitunas negras y hierbas mediterráneas.',
    price: 3.50,
    img: 'img/productos/pan-aceituna.png'
  },
  {
    id: 'pan-caracol',
    name: 'Pan de Caracol',
    desc: 'Pan en espiral con canela y pasas, horneado a la perfección.',
    price: 3.00,
    img: 'img/productos/pan-caracol.png'
  },
  {
    id: 'pan-frances',
    name: 'Pan Francés',
    desc: 'Baguette crujiente con corteza dorada y miga esponjosa.',
    price: 2.50,
    img: 'img/productos/pan-frances.png'
  },
  {
    id: 'pan-tradicional',
    name: 'Pan Tradicional',
    desc: 'Pan clásico de toda la vida, suave y delicioso.',
    price: 2.00,
    img: 'img/productos/pan-tradicional.png'
  },
  {
    id: 'rosca-muerto',
    name: 'Rosca de Muerto',
    desc: 'Pan dulce tradicional con ajonjolí, perfecto para compartir.',
    price: 4.00,
    img: 'img/productos/rosca-muerto.png'
  }
];

const NOVEDADES = [
  {
    id: 'croissants-2x1',
    name: 'Croissants 2X1',
    desc: 'Pieza de bollería caracterizada por su forma de media luna y su textura crujiente por fuera y suave por dentro.',
    price: 2.50,
    img: 'img/novedades/croissants-2x1.png',
    badge: 'PROMO DEL DIA 2x1'
  },
  {
    id: 'pan-del-dia',
    name: 'Pan del día -20%',
    desc: 'Variedad de panes tradicionales elaborados diariamente, destacados por corteza.',
    price: 3.00,
    img: 'img/novedades/pan-del-dia.png'
  },
  {
    id: 'acunas',
    name: 'Acuñas',
    desc: 'Bloques artesanales de maní seleccionado y miel, con una textura perfectamente crujiente y el autentico sabor.',
    price: 3.50,
    img: 'img/novedades/acunas.png'
  },
  {
    id: 'combo-familiar',
    name: 'Combo Familiar',
    desc: 'Una generosa selección de panes recién horneados, una baguettes de corteza crocante.',
    price: 5.00,
    img: 'img/novedades/combo-familiar.png'
  },
  {
    id: 'mega-pack',
    name: 'Mega Pack Dulce Tradición',
    desc: 'Combo. Incluye el clásico King Kong, chocotejas surtidas, galletas de paciencia y una variedad.',
    price: 4.50,
    img: 'img/novedades/mega-pack.png'
  },
  {
    id: 'king-kong',
    name: 'King Kong',
    desc: 'Nuestro dulce bandera, elaborado con capas de galleta artesanal perfectamente horneadas.',
    price: 5.00,
    img: 'img/novedades/king-kong.png'
  }
];

function getProductById(id) {
  return PRODUCTS.find(p => p.id === id) || NOVEDADES.find(p => p.id === id);
}

function openProductDetail(id) {
  const p = getProductById(id);
  if (!p) return;

  document.getElementById('detail-img').src = p.img;
  document.getElementById('detail-img').alt = p.name;
  document.getElementById('detail-name').textContent = p.name;
  document.getElementById('detail-price').textContent = formatPrice(p.price);
  document.getElementById('detail-desc').textContent = p.desc;

  const ingredients = p.ingredients || [];
  document.getElementById('detail-ingredients').innerHTML = ingredients.length
    ? ingredients.map(i => `<li>${i}</li>`).join('')
    : '<li style="background:transparent;color:var(--color-texto-claro);padding:0;">Información no disponible</li>';

  const cartBtn = document.getElementById('detail-cart-btn');
  cartBtn.onclick = () => { addToCart(p.id); closeProductDetail(); };

  document.getElementById('detail-overlay').classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeProductDetail(e) {
  if (e && e.target !== e.currentTarget) return;
  document.getElementById('detail-overlay').classList.remove('show');
  document.body.style.overflow = '';
}
