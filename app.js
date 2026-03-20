// app.js - Motor Lógico de ROM STORE (Versión Premium Final)

// --- 1. ESTADO GLOBAL ---
let cart = [];
const wppNumber = "584125019508"; 

// Variables para la galería interactiva
window.currentImageIndex = 0;
window.currentProductImages = [];
let touchStartX = 0;
let touchEndX = 0;

// --- 2. SELECTORES DEL DOM ---
const uiOverlay = document.getElementById('ui-overlay');
const sideDrawer = document.getElementById('side-drawer');
const cartSidebar = document.getElementById('cart-sidebar');
const appRoot = document.getElementById('app-root');

const menuTrigger = document.getElementById('menu-trigger');
const closeMenu = document.getElementById('close-menu');
const cartTrigger = document.getElementById('cart-trigger');
const closeCart = document.getElementById('close-cart');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalEl = document.getElementById('cart-total');
const cartCountEl = document.getElementById('cart-count');
const checkoutBtn = document.getElementById('checkout-btn');
const searchTrigger = document.getElementById('search-trigger');
const searchModal = document.getElementById('search-modal');
const closeSearch = document.getElementById('close-search');
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');

// --- 3. GESTIÓN DE INTERFACES (UI) ---
function toggleMenu() {
    sideDrawer.classList.add('active');
    uiOverlay.classList.add('active');
}

function toggleCart() {
    cartSidebar.classList.add('active');
    uiOverlay.classList.add('active');
    renderCart();
}

function closeAllUI() {
    sideDrawer.classList.remove('active');
    cartSidebar.classList.remove('active');
    uiOverlay.classList.remove('active');
}

menuTrigger.addEventListener('click', toggleMenu);
closeMenu.addEventListener('click', closeAllUI);
cartTrigger.addEventListener('click', toggleCart);
closeCart.addEventListener('click', closeAllUI);
uiOverlay.addEventListener('click', closeAllUI);

searchTrigger.addEventListener('click', () => {
    if (searchModal.classList.contains('active')) {
        closeSearchModal();
        return;
    }
    searchModal.style.display = 'block';
    setTimeout(() => {
        searchModal.classList.add('active');
        searchInput.focus();
    }, 10);
});

function closeSearchModal() {
    searchModal.classList.remove('active');
    setTimeout(() => {
        searchModal.style.display = 'none';
        searchInput.value = '';
        searchResults.innerHTML = '';
    }, 400); 
}
closeSearch.addEventListener('click', closeSearchModal);

// --- 4. ENRUTAMIENTO SPA (Sin #) ---
function navigateTo(url) {
    history.pushState(null, null, url);
    handleRoute();
}

// Interceptar clics en enlaces internos
document.body.addEventListener('click', e => {
    if (e.target.matches('[data-route], [data-route] *')) {
        e.preventDefault();
        const link = e.target.closest('[data-route]');
        navigateTo(link.getAttribute('href'));
    }
});

window.addEventListener('popstate', handleRoute);

function handleRoute() {
    const path = window.location.pathname;
    closeAllUI(); 
    closeSearchModal();
    
    if (path === '/' || path === '/index.html') {
        renderHome();
    } else if (path.startsWith('/catalogo/')) {
        const catSlug = path.split('/')[2];
        renderCategory(catSlug);
    } else if (path.startsWith('/categoria/')) {
        const catSlug = path.split('/')[2];
        renderCategory(catSlug);
    } else if (path.startsWith('/producto/')) {
        const prodId = parseInt(path.split('/')[2]);
        renderProduct(prodId);
    } else if (path.startsWith('/politica/')) {
        const policySlug = path.split('/')[2];
        renderPolicy(policySlug);
    } else {
        renderHome();
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.addEventListener('DOMContentLoaded', () => {
    handleRoute();
    initAccordions(); 
});

// --- 5. RENDERIZADO DE VISTAS ---

function renderHome() {
    const visibleProducts = products.filter(p => !p.hidden);
    const featured = visibleProducts.slice(0, 4); 
    const onSaleProducts = visibleProducts.filter(p => p.onSale).slice(0, 4); 
    
    appRoot.innerHTML = `
        <section class="hero hero-mobile" style="background-image: url('https://i.ibb.co/XZw4q7rX/IMG-20260318-171704.jpg');">
            <div style="position: absolute; inset: 0; background: rgba(0,0,0,0.5);"></div>
            <div style="position: relative; z-index: 1; text-align: center; color: white; padding: 20px; width: 100%; max-width: 800px; margin: auto;">
                <h1 class="fade-in" style="font-size: clamp(2rem, 5vw, 3.5rem); font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 15px;">Eleva tu estilo</h1>
                <p class="fade-in" style="font-size: 1rem; margin: 0 auto 30px; color: #f0f0f0;">Streetwear premium y ropa deportiva.</p>
                <div class="fade-in" style="display: flex; flex-direction: column; gap: 15px; justify-content: center; align-items: center;">
                    <a href="/catalogo/todos" data-route class="btn-primary" style="width: auto; padding: 15px 35px; background: white; color: black;">Ver Todo el Catálogo</a>
                    <div style="display: flex; gap: 10px;">
                        <a href="/categoria/hombre" data-route class="btn-primary" style="width: auto; padding: 10px 25px; background: transparent; border: 1px solid white; color: white; font-size: 0.8rem;">Hombre</a>
                        <a href="/categoria/mujer" data-route class="btn-primary" style="width: auto; padding: 10px 25px; background: transparent; border: 1px solid white; color: white; font-size: 0.8rem;">Mujer</a>
                    </div>
                </div>
            </div>
        </section>

        <section class="hero hero-desktop" style="background-image: url('https://i.ibb.co/XZw4q7rX/IMG-20260318-171704.jpg');">
            <div style="position: absolute; inset: 0; background: rgba(0,0,0,0.4);"></div>
            <div style="position: relative; z-index: 1; text-align: center; color: white; padding: 40px; width: 100%; max-width: 1000px; margin: auto;">
                <h1 class="fade-in" style="font-size: 4rem; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 20px;">Eleva tu estilo al máximo nivel</h1>
                <p class="fade-in" style="font-size: 1.2rem; margin: 0 auto 40px; color: #f0f0f0;">Descubre nuestra colección exclusiva de streetwear premium y ropa deportiva.</p>
                <div class="fade-in" style="display: flex; gap: 20px; justify-content: center;">
                    <a href="/categoria/hombre" data-route class="btn-primary" style="width: auto; padding: 18px 40px; background: white; color: black; font-size: 1rem;">Comprar Hombre</a>
                    <a href="/categoria/mujer" data-route class="btn-primary" style="width: auto; padding: 18px 40px; background: transparent; border: 2px solid white; color: white; font-size: 1rem;">Comprar Mujer</a>
                </div>
            </div>
        </section>
        
        <section style="padding: 50px 0;">
            <h2 style="text-align: center; text-transform: uppercase; font-size: 1.6rem; margin-bottom: 30px; font-weight: 800; letter-spacing: 1px;">Nuevos Drops</h2>
            <div class="catalog-grid">
                ${featured.map(createProductCard).join('')}
            </div>
            <div style="text-align: center; margin-top: 30px;">
                <a href="/catalogo/todos" data-route style="font-size: 0.9rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid var(--color-primary); padding-bottom: 5px;">Ver todo el catálogo</a>
            </div>
        </section>

        ${onSaleProducts.length > 0 ? `
        <section style="padding: 20px 0 50px; background-color: #fafafa; border-top: 1px solid var(--color-border);">
            <div style="max-width: 1200px; margin: 0 auto; padding-top: 40px;">
                <h2 style="text-align: center; text-transform: uppercase; font-size: 1.6rem; margin-bottom: 30px; font-weight: 800; letter-spacing: 1px; color: var(--color-danger);">Productos en Oferta</h2>
                <div class="catalog-grid">
                    ${onSaleProducts.map(createProductCard).join('')}
                </div>
                <div style="text-align: center; margin-top: 30px;">
                    <a href="/categoria/ofertas" data-route style="font-size: 0.9rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: var(--color-danger); border-bottom: 1px solid var(--color-danger); padding-bottom: 5px;">Ver todas las ofertas</a>
                </div>
            </div>
        </section>
        ` : ''}
    `;
}

function renderCategory(slug) {
    let catName = "";
    let filtered = [];
    const visibleProducts = products.filter(p => !p.hidden);

    if (slug === "todos") { catName = "Todo el Catálogo"; filtered = visibleProducts; }
    else if (slug === "mujer") { catName = "Colección Mujer"; filtered = visibleProducts.filter(p => p.category.includes("Damas")); }
    else if (slug === "hombre") { catName = "Colección Hombre"; filtered = visibleProducts.filter(p => p.category.includes("Caballeros")); }
    else if (slug === "ofertas") { catName = "Sale / Archivo"; filtered = visibleProducts.filter(p => p.onSale); }

    appRoot.innerHTML = `
        <div style="padding: 40px 10px; max-width: 1200px; margin: 0 auto; min-height: 60vh;">
            <h2 class="fade-in" style="text-transform: uppercase; font-size: 1.8rem; margin-bottom: 30px; font-weight: 800; text-align: center;">${catName}</h2>
            <div class="catalog-grid">
                ${filtered.length > 0 ? filtered.map(createProductCard).join('') : '<p style="grid-column: 1/-1; text-align: center; color: var(--color-text-light); padding: 50px 0;">No hay artículos disponibles por el momento.</p>'}
            </div>
        </div>
    `;
}

function renderPolicy(slug) {
    let title = "";
    if (slug === "envios") title = "Envíos y Entregas";
    else if (slug === "devoluciones") title = "Cambios y Devoluciones";
    else if (slug === "terminos") title = "Términos de Servicio";
    else if (slug === "privacidad") title = "Políticas de Privacidad";
    else if (slug === "faq") title = "Preguntas Frecuentes";
    else if (slug === "tallas") title = "Guía de Tallas";
    else title = "Información Legal";

    appRoot.innerHTML = `
        <div class="fade-in policy-container">
            <h1 class="policy-title">${title}</h1>
            <div class="policy-content">
                <p>Estamos trabajando para detallar y formalizar esta sección. Muy pronto estará disponible con toda la información correspondiente.</p>
                <br>
                <p>Si tienes alguna duda o requerimiento urgente relacionado con <strong>${title.toLowerCase()}</strong>, por favor comunícate con nosotros directamente a través de nuestro canal de <a href="https://wa.me/584125019508" style="color: var(--color-success); font-weight: bold; text-decoration: underline;">WhatsApp</a>.</p>
            </div>
        </div>
    `;
}

function renderProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) return renderHome();

    window.currentProductImages = product.images;
    window.currentImageIndex = 0;

    const colors = Object.keys(product.stock);
    const priceDisplay = (product.onSale && product.oldPrice) 
        ? `<span class="old-price" style="font-size: 1.2rem; margin-right: 15px;">$${product.oldPrice.toFixed(2)}</span> <span style="color: var(--color-danger);">$${product.price.toFixed(2)}</span>`
        : `$${product.price.toFixed(2)}`;

    const suggestions = products.filter(p => p.id !== product.id && !p.hidden && p.category.some(c => product.category.includes(c))).slice(0, 4);

    appRoot.innerHTML = `
        <div class="fade-in product-detail-container">
            <div style="position: relative; width: 100%;">
                
                <div class="main-image-wrapper" ontouchstart="handleTouchStart(event)" ontouchend="handleTouchEnd(event)">
                    ${product.outOfStock ? '<div class="badge" style="background:#555; top:20px; left:20px; z-index: 10;">AGOTADO</div>' : (product.onSale ? '<div class="badge" style="background:var(--color-danger); top:20px; left:20px; z-index: 10;">SALE</div>' : '')}
                    <img src="${product.images[0]}" id="main-product-img" alt="${product.name}">
                </div>

                ${product.images.length > 1 ? `
                <div class="thumbnail-gallery-container">
                    <div class="thumbnail-scroll" id="thumbnail-scroll">
                        ${product.images.map((img, idx) => `<img src="${img}" id="thumb-${idx}" class="${idx === 0 ? 'active' : ''}" onclick="setMainImage(${idx})" alt="Miniatura ${idx + 1}">`).join('')}
                    </div>
                    <div class="thumbnail-arrows">
                        <button class="thumb-arrow" onclick="scrollThumbnails(-1)" aria-label="Anterior"><i class="fas fa-chevron-left"></i></button>
                        <button class="thumb-arrow" onclick="scrollThumbnails(1)" aria-label="Siguiente"><i class="fas fa-chevron-right"></i></button>
                    </div>
                </div>
                ` : ''}
            </div>
            
            <div style="display: flex; flex-direction: column; justify-content: flex-start;">
                <h1 style="font-size: clamp(1.5rem, 4vw, 2.2rem); font-weight: 800; text-transform: uppercase; margin-bottom: 8px; line-height: 1.1;">${product.name}</h1>
                <p style="font-size: clamp(1.2rem, 3vw, 1.5rem); font-weight: 700; margin-bottom: 20px;">${priceDisplay}</p>
                <p style="color: var(--color-text-light); margin-bottom: 30px; font-size: 0.95rem; line-height: 1.6;">${product.description || 'Diseñado para el confort diario y el rendimiento óptimo.'}</p>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 1px;">Color Seleccionado</label>
                    <select id="select-color" style="width: 100%; padding: 15px; border: 1px solid var(--color-border); background: transparent; font-family: inherit; font-size: 1rem; outline: none; border-radius: 4px;" onchange="updateSizes()">
                        <option value="" disabled selected>Elige un color</option>
                        ${colors.map(c => `<option value="${c}">${c}</option>`).join('')}
                    </select>
                </div>
                
                <div style="margin-bottom: 25px; display: flex; gap: 15px;">
                    <div style="flex: 2;">
                        <label style="display: block; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 1px;">Talla</label>
                        <select id="select-size" style="width: 100%; padding: 15px; border: 1px solid var(--color-border); background: transparent; font-family: inherit; font-size: 1rem; outline: none; border-radius: 4px;" disabled>
                            <option value="" disabled selected>Elige una talla</option>
                        </select>
                    </div>
                    
                    <div style="flex: 1;">
                        <label style="display: block; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 1px;">Cantidad</label>
                        <div class="qty-selector-main">
                            <button onclick="changeMainQty(-1)">-</button>
                            <input type="number" id="main-qty" value="1" min="1" readonly>
                            <button onclick="changeMainQty(1)">+</button>
                        </div>
                    </div>
                </div>
                
                <button class="btn-primary" onclick="addToCart(${product.id})" ${product.outOfStock ? 'disabled style="background: #ccc; color: #666; cursor: not-allowed;"' : 'style="padding: 18px; font-size: 1rem;"'}>
                    ${product.outOfStock ? 'AGOTADO' : 'Añadir a la Bolsa'}
                </button>
                
                <div style="margin-top: 30px; border-top: 1px solid var(--color-border); padding-top: 20px;">
                    <p style="font-size: 0.85rem; color: var(--color-text-light); display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                        <i class="fas fa-truck"></i> Envíos nacionales por MRW y ZOOM
                    </p>
                    <p style="font-size: 0.85rem; color: var(--color-text-light); display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-shield-alt"></i> Compra garantizada
                    </p>
                </div>
            </div>
        </div>
        
        ${suggestions.length > 0 ? `
        <div style="max-width: 1200px; margin: 40px auto 0; padding: 0 10px 40px; border-top: 1px solid var(--color-border); padding-top: 40px;">
            <h3 style="text-align: center; text-transform: uppercase; font-size: 1.3rem; margin-bottom: 30px; font-weight: 800;">También te podría gustar</h3>
            <div class="catalog-grid">
                ${suggestions.map(createProductCard).join('')}
            </div>
        </div>
        ` : ''}
    `;

    window.currentProductStock = product.stock;
}

function createProductCard(p) {
    const badge = p.outOfStock ? '<div class="badge" style="background:#555;">AGOTADO</div>' : (p.onSale ? '<div class="badge" style="background:var(--color-danger);">SALE</div>' : '');
    const priceHTML = (p.onSale && p.oldPrice) 
        ? `<div class="price-container"><span class="old-price">$${p.oldPrice.toFixed(2)}</span> <span class="product-price" style="color:var(--color-danger);">$${p.price.toFixed(2)}</span></div>`
        : `<div class="price-container"><span class="product-price">$${p.price.toFixed(2)}</span></div>`;

    return `
        <a href="/producto/${p.id}" data-route class="product-card fade-in">
            ${badge}
            <div class="product-card-img-wrapper">
                <img src="${p.images[0]}" alt="${p.name}" loading="lazy">
            </div>
            <div class="product-info">
                <h3>${p.name}</h3>
                ${priceHTML}
            </div>
        </a>
    `;
}

// --- 6. LÓGICA DE GALERÍA INFINITA Y SWIPE ---

window.setMainImage = function(index) {
    const images = window.currentProductImages;
    
    // Bucle infinito: Si llega al final, pasa al principio y viceversa.
    if (index < 0) index = images.length - 1;
    if (index >= images.length) index = 0;
    
    window.currentImageIndex = index;
    document.getElementById('main-product-img').src = images[index];

    // Actualizar clase activa en miniaturas
    document.querySelectorAll('.thumbnail-scroll img').forEach((img, i) => {
        img.classList.toggle('active', i === index);
    });

    // Auto-centrar la miniatura activa en el contenedor
    const activeThumb = document.getElementById(`thumb-${index}`);
    if (activeThumb) {
        activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
}

// Cambiar la imagen principal (usado por el Swipe y las flechas de la miniatura)
window.changeImage = function(direction) {
    setMainImage(window.currentImageIndex + direction);
}

// Desplazar manualmente el contenedor de las miniaturas con las flechas
window.scrollThumbnails = function(direction) {
    const scroll = document.getElementById('thumbnail-scroll');
    // Mueve la tira aproximadamente el ancho de 2 miniaturas (150px)
    scroll.scrollBy({ left: direction * 150, behavior: 'smooth' });
}

// Eventos de Swipe táctil en la imagen principal (Mobile)
window.handleTouchStart = function(e) {
    touchStartX = e.changedTouches[0].screenX;
}

window.handleTouchEnd = function(e) {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
}

function handleSwipe() {
    const threshold = 40; // Distancia mínima para detectar un deslizamiento intencional
    if (touchStartX - touchEndX > threshold) {
        changeImage(1); // Deslizó el dedo a la izquierda -> Siguiente
    } else if (touchEndX - touchStartX > threshold) {
        changeImage(-1); // Deslizó el dedo a la derecha -> Anterior
    }
}

// --- 7. CANTIDADES, CARRITO Y TOASTS ---

window.changeMainQty = function(change) {
    const input = document.getElementById('main-qty');
    let val = parseInt(input.value) + change;
    if (val < 1) val = 1;
    input.value = val;
}

function showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fas fa-check-circle" style="color: var(--color-success); font-size: 1.1rem;"></i> ${message}`;
    container.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 2900);
}

window.updateSizes = function() {
    const colorSelect = document.getElementById('select-color');
    const sizeSelect = document.getElementById('select-size');
    const selectedColor = colorSelect.value;
    
    if(selectedColor && window.currentProductStock[selectedColor]) {
        const sizes = window.currentProductStock[selectedColor];
        sizeSelect.innerHTML = '<option value="" disabled selected>Elige una talla</option>' + 
                               sizes.map(s => `<option value="${s}">${s}</option>`).join('');
        sizeSelect.disabled = false;
    }
}

window.addToCart = function(id) {
    const color = document.getElementById('select-color')?.value;
    const size = document.getElementById('select-size')?.value;
    const qty = parseInt(document.getElementById('main-qty')?.value) || 1;
    
    if (!color || !size) {
        alert("Por favor, selecciona un color y una talla antes de continuar.");
        return;
    }

    const product = products.find(p => p.id === id);
    const existingItem = cart.find(item => item.id === id && item.selectedColor === color && item.selectedSize === size);
    
    if (existingItem) {
        existingItem.qty += qty;
    } else {
        cart.push({ ...product, selectedColor: color, selectedSize: size, qty: qty });
    }
    
    updateCartBadge();
    showToast("Añadido a la bolsa");
    toggleCart(); 
}

function updateCartBadge() {
    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
    cartCountEl.innerText = totalItems;
}

window.updateCartQty = function(index, change) {
    cart[index].qty += change;
    if (cart[index].qty < 1) {
        cart.splice(index, 1); 
    }
    updateCartBadge();
    renderCart();
}

window.removeFromCart = function(index) {
    cart.splice(index, 1);
    updateCartBadge();
    renderCart();
}

function renderCart() {
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div style="padding: 60px 20px; text-align: center; color: var(--color-text-light);">
                <i class="fas fa-shopping-bag" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.5;"></i>
                <p style="font-size: 1rem; font-weight: 500;">Tu bolsa está vacía.</p>
                <button onclick="navigateTo('/catalogo/todos')" class="btn-primary" style="margin-top: 20px; width: auto; display: inline-block; padding: 12px 25px;">Continuar Comprando</button>
            </div>`;
        cartTotalEl.innerText = '$0.00';
        return;
    }

    cartItemsContainer.innerHTML = cart.map((item, index) => `
        <div class="fade-in" style="display: flex; gap: 15px; padding: 20px; border-bottom: 1px solid var(--color-border);">
            <img src="${item.images[0]}" style="width: 80px; height: 100px; object-fit: cover; border-radius: 4px; background: #f4f4f4;">
            <div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
                <h4 style="font-size: 0.9rem; margin-bottom: 5px; font-weight: 700; text-transform: uppercase;">${item.name}</h4>
                <p style="font-size: 0.8rem; color: var(--color-text-light); margin-bottom: 5px;">Color: ${item.selectedColor} | Talla: ${item.selectedSize}</p>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 5px;">
                    <div style="display: flex; flex-direction: column;">
                        <span style="font-weight: 700; font-size: 1rem; ${item.onSale ? 'color: var(--color-danger);' : ''}">$${(item.price * item.qty).toFixed(2)}</span>
                        <div class="cart-qty-selector">
                            <button class="cart-qty-btn" onclick="updateCartQty(${index}, -1)">-</button>
                            <input type="text" class="cart-qty-input" value="${item.qty}" readonly>
                            <button class="cart-qty-btn" onclick="updateCartQty(${index}, 1)">+</button>
                        </div>
                    </div>
                    <button onclick="removeFromCart(${index})" style="color: var(--color-text-light); font-size: 1.2rem; padding: 10px; transition: color 0.2s;" onmouseover="this.style.color='var(--color-danger)'" onmouseout="this.style.color='var(--color-text-light)'"><i class="fas fa-trash-alt" style="font-size: 1rem;"></i></button>
                </div>
            </div>
        </div>
    `).join('');

    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    cartTotalEl.innerText = `$${total.toFixed(2)}`;
}

// --- 8. CHECKOUT A WHATSAPP ---
checkoutBtn.addEventListener('click', () => {
    if(cart.length === 0) return;

    let msg = "*ORDEN DE COMPRA | ROM STORE*\n";
    msg += "━━━━━━━━━━━━━━━━━━\n\n";

    cart.forEach((item, index) => {
        msg += `*${index + 1}. ${item.name.toUpperCase()} (x${item.qty})*\n`;
        msg += `- Color: ${item.selectedColor}\n`;
        msg += `- Talla: ${item.selectedSize}\n`;
        msg += `- Precio: $${(item.price * item.qty).toFixed(2)}\n\n`;
    });

    const total = cart.reduce((s, i) => s + (i.price * i.qty), 0).toFixed(2);
    msg += "━━━━━━━━━━━━━━━━━━\n";
    msg += `*TOTAL A PAGAR: $${total}*\n`;
    msg += "_(Sin incluir delivery o envíos nacionales)_\n\n";
    msg += "¡Hola! Quisiera procesar esta orden y conocer los métodos de pago disponibles.";

    const whatsappUrl = `https://wa.me/${wppNumber}?text=${encodeURIComponent(msg)}`;
    window.open(whatsappUrl, '_blank');
});

// --- 9. MOTOR DE BÚSQUEDA ---
searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    
    if (query.length < 2) {
        searchResults.innerHTML = '';
        return;
    }

    const results = products.filter(p => 
        (!p.hidden) && 
        (p.name.toLowerCase().includes(query) || 
        (p.tags && p.tags.some(t => t.toLowerCase().includes(query))))
    );

    if (results.length === 0) {
        searchResults.innerHTML = `
            <div style="padding: 30px; text-align: center; color: var(--color-text-light);">
                <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 15px; opacity: 0.3;"></i>
                <p style="font-size: 0.9rem;">No encontramos nada para "${query}".</p>
            </div>`;
        return;
    }

    searchResults.innerHTML = results.map(p => {
        const priceDisplay = (p.onSale && p.oldPrice) 
            ? `<span style="font-size: 0.8rem; text-decoration: line-through; color: #999; margin-right: 5px;">$${p.oldPrice.toFixed(2)}</span><span style="color: var(--color-danger);">$${p.price.toFixed(2)}</span>` 
            : `$${p.price.toFixed(2)}`;

        return `
            <a href="/producto/${p.id}" data-route class="fade-in" style="display: flex; gap: 15px; padding: 15px; border-bottom: 1px solid var(--color-border); align-items: center; transition: background 0.2s;" onmouseover="this.style.background='#f9f9f9'" onmouseout="this.style.background='transparent'" onclick="closeSearchModal()">
                <img src="${p.images[0]}" style="width: 50px; height: 60px; object-fit: cover; border-radius: 4px; background: #f4f4f4;">
                <div>
                    <h4 style="font-size: 0.9rem; font-weight: 600; margin-bottom: 3px; text-transform: uppercase;">${p.name}</h4>
                    <span style="font-weight: 700; font-size: 0.95rem;">${priceDisplay}</span>
                </div>
            </a>
        `;
    }).join('');
});

// --- 10. INICIALIZACIÓN DE ACORDEONES (FOOTER MÓVIL) ---
function initAccordions() {
    const accordions = document.querySelectorAll('.accordion-header');
    accordions.forEach(acc => {
        const newAcc = acc.cloneNode(true);
        acc.parentNode.replaceChild(newAcc, acc);
        
        newAcc.addEventListener('click', function() {
            if (window.innerWidth < 768) {
                this.parentElement.classList.toggle('active');
            }
        });
    });
}