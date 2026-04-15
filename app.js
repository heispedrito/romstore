// app.js - Motor Lógico de ROM STORE (Conectado a Supabase + Funciones Premium)

// --- CONFIGURACIÓN SUPABASE ---
const supabaseUrl = 'https://hvgthlomkgzzibxaveap.supabase.co';
const supabaseKey = 'sb_publishable_BkKlInWSSDxn1AC-8IQ7yQ_3Ia_FqQT';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// --- 1. ESTADO GLOBAL Y PERSISTENCIA ---
let products = []; 
let cart = JSON.parse(localStorage.getItem('rom_cart')) || [];
const wppNumber = "584125019508"; 

// Variables para Vistas
window.currentCategoryProducts = []; 
window.currentProductStock = {};

// Variables para la Galería y Lightbox Interactiva
window.currentImageIndex = 0;
window.currentProductImages = [];
let touchStartX = 0;
let touchEndX = 0;

// Variables para el Paneo (Zoom Panning)
let isPanning = false;
let startPanX = 0, startPanY = 0;
let panX = 0, panY = 0;

// Orden personalizado de colores
window.currentColorOrder = [];

function saveCart() {
    localStorage.setItem('rom_cart', JSON.stringify(cart));
}

function getVisibleProducts() {
    return products
        .filter(p => !p.hidden)
        .sort((a, b) => (a.order || 999) - (b.order || 999));
}

// --- CARGA INICIAL DESDE BASE DE DATOS (SUPABASE) ---
window.addEventListener('DOMContentLoaded', async () => {
    const { data, error } = await supabaseClient
        .from('products')
        .select('*')
        .eq('hidden', false)
        .order('order', { ascending: true });
        
    if(data) {
        products = data;
    }
    
    handleRoute();
    initAccordions(); 
    updateCartBadge(); 
    initTypewriterEffect();
});

// --- 2. SELECTORES DEL DOM ---
const uiOverlay = document.getElementById('ui-overlay');
const modalOverlay = document.getElementById('modal-overlay');
const sideDrawer = document.getElementById('side-drawer');
const cartSidebar = document.getElementById('cart-sidebar');
const appRoot = document.getElementById('app-root');

const menuTrigger = document.getElementById('menu-trigger');
const closeMenu = document.getElementById('close-menu');
const cartTrigger = document.getElementById('cart-trigger');
const closeCart = document.getElementById('close-cart');
const cartItemsContainer = document.getElementById('cart-items');
const cartFooterEl = document.getElementById('cart-footer');
const cartTotalEl = document.getElementById('cart-total');
const cartCountEl = document.getElementById('cart-count');
const checkoutBtn = document.getElementById('checkout-btn');
const searchTrigger = document.getElementById('search-trigger');
const searchModal = document.getElementById('search-modal');
const closeSearch = document.getElementById('close-search');
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');

const wppModal = document.getElementById('wpp-modal');
const sizeGuideModal = document.getElementById('size-guide-modal');
const closeWppModal = document.getElementById('close-wpp-modal');
const closeSizeModal = document.getElementById('close-size-modal');
const confirmWppBtn = document.getElementById('confirm-wpp-btn');
const customerNameInput = document.getElementById('customer-name-input');

// --- HELPER: Generador de URLs Amigables ---
function generateSlug(text) {
    if (!text) return '';
    return text.toString().toLowerCase()
        .trim()
        .normalize("NFD")                   
        .replace(/[\u0300-\u036f]/g, "")    
        .replace(/\s+/g, '-')               
        .replace(/[^\w\-]+/g, '')           
        .replace(/\-\-+/g, '-');            
}

// --- 3. GESTIÓN DE INTERFACES Y SCROLL LOCK TOTAL ---
function lockScroll() {
    // Bloqueamos tanto en body como en html para garantizar inmovilidad en iOS/Android
    document.documentElement.classList.add('overflow-hidden');
    document.body.classList.add('overflow-hidden');
}
window.lockScroll = lockScroll; // Fix para poder usarse desde onclick inline

function unlockScroll() {
    document.documentElement.classList.remove('overflow-hidden');
    document.body.classList.remove('overflow-hidden');
}
window.unlockScroll = unlockScroll; // Fix para poder usarse desde onclick inline

function toggleMenu() {
    sideDrawer.classList.add('active');
    uiOverlay.classList.add('active');
    lockScroll();
}

function toggleCart() {
    cartSidebar.classList.add('active');
    uiOverlay.classList.add('active');
    renderCart();
    lockScroll();
}

function closeAllUI() {
    sideDrawer.classList.remove('active');
    cartSidebar.classList.remove('active');
    uiOverlay.classList.remove('active');
    
    if(wppModal) wppModal.classList.remove('active');
    if(sizeGuideModal) sizeGuideModal.classList.remove('active');
    if(modalOverlay) modalOverlay.classList.remove('active');
    
    closeLightbox();
    unlockScroll();
}
window.closeAllUI = closeAllUI; // Fix: expuesto globalmente para el botón "Continuar Comprando"

menuTrigger.addEventListener('click', toggleMenu);
closeMenu.addEventListener('click', closeAllUI);
cartTrigger.addEventListener('click', toggleCart);
closeCart.addEventListener('click', closeAllUI);
uiOverlay.addEventListener('click', closeAllUI);

if(closeWppModal) closeWppModal.addEventListener('click', closeAllUI);
if(closeSizeModal) closeSizeModal.addEventListener('click', closeAllUI);
if(modalOverlay) modalOverlay.addEventListener('click', closeAllUI);

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeAllUI();
        closeSearchModal();
    }
});

document.addEventListener('click', (e) => {
    if (searchModal.classList.contains('active')) {
        if (!searchModal.contains(e.target) && !searchTrigger.contains(e.target)) {
            closeSearchModal();
        }
    }
});

// Búsqueda SIN bloqueo de scroll (se puede navegar de fondo)
searchTrigger.addEventListener('click', () => {
    if (searchModal.classList.contains('active')) {
        closeSearchModal();
        return;
    }
    searchModal.classList.add('active');
    setTimeout(() => {
        searchInput.focus();
    }, 300);
});

function closeSearchModal() {
    searchModal.classList.remove('active');
    setTimeout(() => {
        searchInput.value = '';
        searchResults.innerHTML = '';
    }, 400); 
}
window.closeSearchModal = closeSearchModal; // Fix para enlaces de resultados
closeSearch.addEventListener('click', closeSearchModal); // LÍNEA RESTAURADA: Hace funcionar el botón X

// --- EFECTO MÁQUINA DE ESCRIBIR (BUSCADOR) ---
function initTypewriterEffect() {
    if (!searchInput) return;
    const searchTerms = ["prendas...", "estilos...", "marcas...", "novedades..."];
    let termIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    function type() {
        const currentTerm = searchTerms[termIndex];
        
        if (isDeleting) {
            searchInput.setAttribute('placeholder', 'Buscar ' + currentTerm.substring(0, charIndex - 1));
            charIndex--;
        } else {
            searchInput.setAttribute('placeholder', 'Buscar ' + currentTerm.substring(0, charIndex + 1));
            charIndex++;
        }

        let typeSpeed = isDeleting ? 50 : 100;

        if (!isDeleting && charIndex === currentTerm.length) {
            typeSpeed = 2000; 
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            termIndex = (termIndex + 1) % searchTerms.length;
            typeSpeed = 500; 
        }

        setTimeout(type, typeSpeed);
    }
    type();
}

// --- 4. ENRUTAMIENTO SPA ---
function navigateTo(url) {
    history.pushState(null, null, url);
    handleRoute();
}
window.navigateTo = navigateTo; // Fix: expuesto globalmente para el botón "Continuar Comprando"

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
        const prodSlug = path.split('/')[2]; 
        renderProduct(prodSlug);
    } else if (path === '/checkout/gracias') {
        renderThankYou();
    } else if (path.startsWith('/politica/')) {
        const policySlug = path.split('/')[2];
        renderPolicy(policySlug);
    } else {
        renderHome();
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- 5. RENDERIZADO DE VISTAS ---

function renderHome() {
    document.title = "Rom Store | Elite Sportswear & Streetwear";
    
    const visibleProducts = getVisibleProducts();
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

// --- FILTROS Y ORDENAMIENTO (SORTING) CON LÓGICA DE AGOTADOS ---
window.applySort = function() {
    const sortValue = document.getElementById('catalog-sort').value;
    let sortedList = [...window.currentCategoryProducts];

    // Empujar los agotados siempre al final
    if (sortValue === 'price-asc') {
        sortedList.sort((a, b) => {
            if (a.outOfStock && !b.outOfStock) return 1;
            if (!a.outOfStock && b.outOfStock) return -1;
            return a.price - b.price;
        });
    } else if (sortValue === 'price-desc') {
        sortedList.sort((a, b) => {
            if (a.outOfStock && !b.outOfStock) return 1;
            if (!a.outOfStock && b.outOfStock) return -1;
            return b.price - a.price;
        });
    } else if (sortValue === 'available') {
        sortedList = sortedList.filter(p => !p.outOfStock);
    } else {
        sortedList.sort((a, b) => (a.order || 999) - (b.order || 999));
    }

    const grid = document.getElementById('category-grid');
    if (grid) {
        grid.innerHTML = sortedList.length > 0 
            ? sortedList.map(createProductCard).join('') 
            : '<p style="grid-column: 1/-1; text-align: center; color: var(--color-text-light); padding: 50px 0;">No hay artículos disponibles con este filtro.</p>';
    }
};

function renderCategory(slug) {
    let catName = "";
    let filtered = [];
    const visibleProducts = getVisibleProducts();

    if (slug === "todos") { catName = "Todo el Catálogo"; filtered = visibleProducts; }
    else if (slug === "mujer") { catName = "Colección Mujer"; filtered = visibleProducts.filter(p => (p.category || []).includes("Damas")); }
    else if (slug === "hombre") { catName = "Colección Hombre"; filtered = visibleProducts.filter(p => (p.category || []).includes("Caballeros")); }
    else if (slug === "ofertas") { catName = "Sale / Ofertas"; filtered = visibleProducts.filter(p => p.onSale); }
    else { return renderHome(); }

    document.title = `${catName} | Rom Store`;
    window.currentCategoryProducts = filtered;

    appRoot.innerHTML = `
        <div style="padding: 40px 10px; max-width: 1200px; margin: 0 auto; min-height: 60vh;">
            <h2 class="fade-in" style="text-transform: uppercase; font-size: 1.8rem; margin-bottom: 20px; font-weight: 800; text-align: center;">${catName}</h2>
            
            ${filtered.length > 0 ? `
            <div class="filters-container">
                <select class="sort-select" id="catalog-sort" onchange="applySort()">
                    <option value="default">Recomendados</option>
                    <option value="price-asc">Precio: Menor a Mayor</option>
                    <option value="price-desc">Precio: Mayor a Menor</option>
                    <option value="available">Solo disponibles</option>
                </select>
            </div>
            ` : ''}

            <div class="catalog-grid" id="category-grid">
                ${filtered.length > 0 ? filtered.map(createProductCard).join('') : '<p style="grid-column: 1/-1; text-align: center; color: var(--color-text-light); padding: 50px 0;">No hay artículos disponibles por el momento.</p>'}
            </div>
        </div>
    `;
}

// --- VISTAS LEGALES Y DE SOPORTE (POLÍTICAS) ---
function renderPolicy(slug) {
    let title = "";
    let content = "";

    if (slug === "envios") {
        title = "Envíos y Entregas";
        content = `
            <h3>1. Entregas Personales y Delivery</h3>
            <p>Realizamos entregas personales en <strong>Barcelona, Edo. Anzoátegui (Urb. Cortijo de Oriente)</strong> sin costo adicional, previo acuerdo de horario. También contamos con servicio de Delivery a zonas céntricas y aledañas con un costo extra, el cual será calculado dependiendo de tu ubicación exacta al momento de procesar tu orden.</p>
            
            <h3>2. Envíos Nacionales</h3>
            <p>Llegamos a toda Venezuela a través de nuestras agencias aliadas <strong>MRW y Zoom</strong>. Todos los envíos nacionales se despachan bajo la modalidad de <strong>Cobro en Destino (COD)</strong>. Esto significa que el cliente es responsable de cancelar el costo del flete directamente a la agencia al momento de retirar su paquete.</p>
            
            <h3>3. Tiempos de Procesamiento y Despacho</h3>
            <p>Entendemos que quieres lucir tus prendas lo antes posible. Una vez que envíes tu comprobante y el pago sea verificado por nuestro equipo, tu pedido será empaquetado y despachado el día hábil siguiente. Los tiempos de tránsito estimados dependen exclusivamente de la logística de la agencia de encomiendas (generalmente demoran entre 2 a 4 días hábiles).</p>
        `;
    } else if (slug === "devoluciones") {
        title = "Cambios y Devoluciones";
        content = `
            <h3>1. Condiciones para Cambios</h3>
            <p>En ROM STORE garantizamos la calidad de nuestras prendas. Si necesitas un cambio de talla, aceptamos solicitudes dentro de los <strong>7 días continuos</strong> tras haber recibido tu pedido. Las prendas deben estar en su estado original e impecable: sin signos de uso, sin lavar, sin olores a perfume o detergente, sin manchas y con todas sus etiquetas originales adheridas.</p>
            
            <h3>2. Artículos No Retornables</h3>
            <p>Por razones estrictas de higiene y salud pública, <strong>no aceptamos cambios ni devoluciones en Ropa Interior (Ej: Boxers Calvin Klein) ni Medias</strong>. Asimismo, todos los artículos adquiridos en la sección de "Sale / Ofertas" o con descuentos aplicados son considerados ventas finales y no admiten cambio.</p>
            
            <h3>3. Costos de Envío por Cambio</h3>
            <p>Para gestionar un cambio, debes comunicarte con nuestro equipo vía WhatsApp. Los costos de envío (ida y vuelta) generados por cambios de talla o color corren por cuenta y responsabilidad del cliente. ROM STORE únicamente asumirá los costos de envío si el producto enviado presenta un defecto de fábrica comprobado al momento de su apertura.</p>
            
            <h3>4. Política de Reembolsos</h3>
            <p><strong>No realizamos devoluciones de dinero</strong> bajo ninguna circunstancia. Si tu cambio es aprobado, procesaremos la sustitución por otra talla, otro color, o por otro artículo de la tienda que tenga el mismo valor (o puedes pagar la diferencia si eliges un producto de mayor valor).</p>
        `;
    } else if (slug === "terminos") {
        title = "Términos de Servicio";
        content = `
            <h3>1. Aceptación de los Términos</h3>
            <p>Al acceder, navegar y utilizar la plataforma de ROM STORE, aceptas estar sujeto a estos términos y condiciones. Nos reservamos el derecho de modificar, actualizar o cambiar cualquier parte de nuestras políticas en cualquier momento, siendo tu responsabilidad revisarlas periódicamente.</p>
            
            <h3>2. Precios, Pagos y Disponibilidad</h3>
            <p>Todos los precios publicados están sujetos a cambios sin previo aviso. Nuestro inventario es dinámico y de alta rotación; en el caso excepcional de que un producto se agote tras haber generado tu orden, nuestro equipo te contactará de inmediato para ofrecerte una alternativa premium o la devolución íntegra de tu pago.</p>
            
            <h3>3. Exactitud de Colores y Diseños</h3>
            <p>Hacemos el mayor esfuerzo para mostrar los colores y detalles de nuestras prendas con la mayor precisión fotográfica posible. Sin embargo, debido a las diferencias de calibración en pantallas, monitores y dispositivos móviles, no podemos garantizar que el color visualizado sea 100% idéntico a la prenda física.</p>
            
            <h3>4. Prevención de Fraudes y Canales Oficiales</h3>
            <p>Para garantizar tu seguridad y evitar estafas, te recordamos que nuestro <strong>ÚNICO</strong> número oficial de atención y ventas vía WhatsApp es el <strong style="color: var(--color-success); font-size: 1.1rem;">+58 412-5019508</strong>. Nuestras únicas redes sociales oficiales son Instagram (<strong><a href="https://instagram.com/rom.vzla" target="_blank">@rom.vzla</a></strong>) y TikTok (<strong><a href="https://tiktok.com/@rom.vzla" target="_blank">@rom.vzla</a></strong>).</p>
            <p style="color: var(--color-danger); font-weight: 600; margin-top: 10px; padding: 10px; border-left: 3px solid var(--color-danger); background: #fff5f5;">ROM STORE no se hace responsable por compras, transferencias de dinero o acuerdos realizados a través de números de teléfono, perfiles falsos o intermediarios no autorizados. ¡Verifica siempre nuestros canales antes de pagar!</p>
        `;
    } else if (slug === "privacidad") {
        title = "Políticas de Privacidad";
        content = `
            <h3>1. Recopilación de Datos y Propósito</h3>
            <p>En ROM STORE valoramos y respetamos tu privacidad al máximo. Solo recopilamos la información estrictamente necesaria para procesar, despachar y dar seguimiento a tu orden (nombre completo, número de teléfono, dirección de envío o agencia y comprobantes de pago).</p>
            
            <h3>2. Protección de la Información</h3>
            <p>Tus datos personales son utilizados de manera exclusiva para la logística de tu compra, para contactarte en caso de alguna eventualidad con tu pedido y para brindarte soporte personalizado. <strong>Garantizamos que no vendemos, no alquilamos, ni compartimos tu información personal con terceros.</strong></p>
            
            <h3>3. Transacciones Seguras</h3>
            <p>Nuestra web funciona como un catálogo digital avanzado. Toda la gestión de pagos, envío de datos sensibles y confirmación final se realiza de forma cifrada y directa a través del cifrado de extremo a extremo de nuestro canal oficial de WhatsApp, brindándote una capa extra de seguridad financiera.</p>
        `;
    } else if (slug === "faq") {
        title = "Preguntas Frecuentes";
        content = `
            <div style="margin-bottom: 25px;">
                <h3 style="margin-bottom: 8px;">¿Cuáles son los métodos de pago?</h3>
                <p>Aceptamos Pago Móvil, Transferencias (Bs), Efectivo (Solo para entregas personales en Barcelona) y Binance Pay (USDT). <strong style="color: var(--color-success);">¡Ofrecemos descuentos exclusivos si pagas en divisas en efectivo o por Binance!</strong></p>
            </div>
            <div style="margin-bottom: 25px;">
                <h3 style="margin-bottom: 8px;">¿Dónde están ubicados?</h3>
                <p>Somos una tienda online operando desde Barcelona, Edo. Anzoátegui. Realizamos entregas personales previo acuerdo en Urb. Cortijo de Oriente y hacemos envíos diarios a todo el país.</p>
            </div>
            <div style="margin-bottom: 25px;">
                <h3 style="margin-bottom: 8px;">¿Hacen ventas al mayor?</h3>
                <p>Actualmente trabajamos únicamente con ventas al detal para garantizar la exclusividad de nuestros drops y mantener el control de calidad en cada pieza enviada.</p>
            </div>
            <div style="margin-bottom: 25px;">
                <h3 style="margin-bottom: 8px;">¿Puedo apartar una prenda?</h3>
                <p>Por la alta rotación de nuestro inventario, no realizamos apartados sin previo pago. Las prendas solo se aseguran una vez confirmado el comprobante.</p>
            </div>
        `;
    } else if (slug === "tallas") {
        title = "Guía de Tallas";
        content = `
            <p style="margin-bottom: 25px;">La mayoría de nuestras prendas tienen un corte estándar o un ajuste <em>oversize</em> (dependiendo de la colección). A continuación, te dejamos una guía referencial. Si tienes dudas con una prenda específica o sobre cómo te quedará, ¡escríbenos al WhatsApp y te asesoraremos!</p>
            
            <h3>Franelas y Suéteres (Corte Regular / Oversize)</h3>
            <ul style="list-style: inside; margin-bottom: 25px; color: var(--color-text-light);">
                <li><strong>S (Small):</strong> Ideal para contexturas delgadas.</li>
                <li><strong>M (Medium):</strong> Ajuste clásico y versátil.</li>
                <li><strong>L (Large):</strong> Mayor holgura. Si eres M y buscas un estilo <em>baggy</em> (ancho), esta es tu talla.</li>
                <li><strong>XL (Extra Large):</strong> Corte amplio y relajado para estilo streetwear puro.</li>
            </ul>

            <p style="color: var(--color-text-light); margin-bottom: 25px; border-left: 3px solid var(--color-primary); padding-left: 15px;"><em>* Nota: Las prendas marcadas explícitamente como "Oversize" están diseñadas para quedar holgadas. Te recomendamos pedir tu talla habitual para lograr ese look, o pedir una talla menos si prefieres un ajuste más a la medida.</em></p>
            
            <h3>Shorts, Biker y Leggins (Damas)</h3>
            <ul style="list-style: inside; color: var(--color-text-light);">
                <li><strong>XS / S:</strong> Tallas pequeñas, alta compresión.</li>
                <li><strong>M:</strong> Talla media estándar.</li>
                <li><strong>L / XL:</strong> Mayor rango de elasticidad.</li>
                <li><strong>Talla Única:</strong> Prendas fabricadas con licra inteligente de alta elongación, que se adaptan cómodamente desde una talla S hasta una L.</li>
            </ul>
        `;
    } else {
        return renderHome();
    }

    document.title = `${title} | Rom Store`;

    appRoot.innerHTML = `
        <div class="fade-in policy-container">
            <h1 class="policy-title">${title}</h1>
            <div class="policy-content">
                ${content}
                
                <div style="margin-top: 60px; padding-top: 40px; border-top: 1px solid var(--color-border); text-align: center;">
                    <h3 style="margin-bottom: 10px; font-size: 1.3rem;">¿Tienes alguna otra duda?</h3>
                    <p style="color: var(--color-text-light); margin-bottom: 20px;">Nuestro equipo de soporte está listo para ayudarte directamente en nuestro chat oficial.</p>
                    <a href="https://wa.me/${wppNumber}" target="_blank" class="btn-primary" style="display: inline-flex; width: auto; align-items: center; justify-content: center; gap: 10px; padding: 15px 35px; background: var(--color-success); color: white;">
                        <i class="fab fa-whatsapp" style="font-size: 1.2rem;"></i> Contáctanos por WhatsApp
                    </a>
                </div>
            </div>
        </div>
    `;
}

function renderThankYou() {
    document.title = "Pedido Confirmado | Rom Store";
    const retryUrl = localStorage.getItem('rom_last_order_url') || `https://wa.me/${wppNumber}`;

    appRoot.innerHTML = `
        <div class="fade-in policy-container" style="text-align: center; padding: 60px 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh;">
            <i class="fas fa-check-circle" style="font-size: 4.5rem; color: var(--color-success); margin-bottom: 25px;"></i>
            <h1 class="policy-title" style="margin-bottom: 15px; font-size: clamp(1.8rem, 4vw, 2.5rem);">¡Gracias por tu pedido!</h1>
            <p style="font-size: 1.1rem; color: var(--color-text-light); max-width: 600px; margin: 0 auto 30px; line-height: 1.6;">
                Tu carrito ha sido procesado. Se acaba de abrir una pestaña para enviar tu orden por WhatsApp. <br><br>
                <strong>Por favor, envía el mensaje y te atenderemos en breve para confirmar el pago y la entrega.</strong>
            </p>

            <div style="display: flex; flex-direction: column; gap: 15px; width: 100%; max-width: 350px; margin-bottom: 50px;">
                <a href="${retryUrl}" target="_blank" class="btn-primary" style="background: var(--color-success); color: white; display: flex; align-items: center; justify-content: center; gap: 10px;">
                    <i class="fab fa-whatsapp" style="font-size: 1.2rem;"></i> ¿No se abrió el chat? Reintentar
                </a>
                <button onclick="navigateTo('/catalogo/todos')" class="btn-primary" style="background: var(--color-primary); color: var(--color-bg); display: flex; align-items: center; justify-content: center; gap: 10px;">
                    <i class="fas fa-shopping-bag" style="font-size: 1.1rem;"></i> Seguir Comprando
                </button>
            </div>

            <div style="margin-top: 20px; text-align: center; border-top: 1px solid var(--color-border); padding-top: 30px; width: 100%; max-width: 400px;">
                <h3 style="font-size: 1.1rem; margin-bottom: 15px; text-transform: uppercase; font-weight: 800; letter-spacing: 1px;">Únete a nuestra comunidad</h3>
                <div style="display: flex; gap: 25px; justify-content: center; font-size: 2rem;">
                    <a href="https://instagram.com/rom.vzla" target="_blank" style="color: var(--color-text); transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'"><i class="fab fa-instagram"></i></a>
                    <a href="https://www.tiktok.com/@rom.vzla" target="_blank" style="color: var(--color-text); transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'"><i class="fab fa-tiktok"></i></a>
                </div>
            </div>
        </div>
    `;
}

// --- SELECCIÓN BIDIRECCIONAL (PRIORIDAD TALLA -> COLOR EN MISMA LÍNEA) ---
window.updateVariantSelection = function(changedType) {
    const sizeSel = document.getElementById('select-size');
    const colorSel = document.getElementById('select-color');
    const stockObj = window.currentProductStock;

    if (changedType === 'size') {
        const size = sizeSel.value;
        colorSel.innerHTML = '<option value="" disabled selected>Elige color</option>';
        
        if (size) {
            colorSel.disabled = false;
            colorSel.style.background = 'transparent';
            
            // Leemos los colores y los ordenamos usando nuestro array global (alimentado en renderProduct)
            let colors = Object.keys(stockObj);
            colors.sort((a, b) => {
                let idxA = window.currentColorOrder.indexOf(a);
                let idxB = window.currentColorOrder.indexOf(b);
                if (idxA === -1) idxA = 999;
                if (idxB === -1) idxB = 999;
                return idxA - idxB;
            });
            
            colors.forEach(c => {
                if (stockObj[c][size] === true) {
                    colorSel.innerHTML += `<option value="${c}">${c}</option>`;
                } else {
                    colorSel.innerHTML += `<option value="${c}" disabled>${c} (Agotado)</option>`;
                }
            });
        }
    }
}

// --- LÓGICA LIGHTBOX Y ZOOM (PANEO INTERACTIVO) ---
window.openLightbox = function() {
    const overlay = document.getElementById('lightbox-overlay');
    if(overlay) {
        overlay.classList.add('active');
        updateLightboxImage();
        lockScroll();
    }
}

window.closeLightbox = function() {
    const overlay = document.getElementById('lightbox-overlay');
    if(overlay) {
        overlay.classList.remove('active');
        const img = document.getElementById('lightbox-img');
        if(img) {
            img.classList.remove('zoomed');
            img.style.transform = '';
        }
        isPanning = false;
    }
    unlockScroll();
}

window.updateLightboxImage = function() {
    const img = document.getElementById('lightbox-img');
    if(img && window.currentProductImages.length > 0) {
        img.src = window.currentProductImages[window.currentImageIndex];
    }
    document.querySelectorAll('.lightbox-thumb-container img').forEach((thumb, i) => {
        thumb.classList.toggle('active', i === window.currentImageIndex);
    });
}

window.setLightboxImage = function(index) {
    window.currentImageIndex = index;
    updateLightboxImage();
    setMainImage(index); // Sincroniza la imagen del fondo
}

window.toggleZoom = function(e) {
    // Si se hizo clic en las flechas o algo que no sea la imagen principal, no hacer nada
    if(e.target.tagName !== 'IMG') return;

    const img = document.getElementById('lightbox-img');
    if(!img) return;

    if(img.classList.contains('zoomed')) {
        img.classList.remove('zoomed');
        img.style.transform = '';
        panX = 0; panY = 0;
    } else {
        img.classList.add('zoomed');
        img.style.transform = `scale(2.5) translate(0px, 0px)`;
        panX = 0; panY = 0;
    }
}

// Funciones de Paneo (Arrastre de la imagen en el Lightbox)
window.startPan = function(e) {
    const img = document.getElementById('lightbox-img');
    if(!img || !img.classList.contains('zoomed')) return;
    isPanning = true;
    img.classList.add('no-transition');
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    startPanX = clientX - panX;
    startPanY = clientY - panY;
}

window.doPan = function(e) {
    if(!isPanning) return;
    e.preventDefault(); // Evitar scroll nativo en móvil
    
    const img = document.getElementById('lightbox-img');
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    panX = clientX - startPanX;
    panY = clientY - startPanY;
    
    // Aplicamos el movimiento respetando la escala (2.5)
    img.style.transform = `scale(2.5) translate(${panX / 2.5}px, ${panY / 2.5}px)`;
}

window.endPan = function(e) {
    isPanning = false;
    const img = document.getElementById('lightbox-img');
    if(img) img.classList.remove('no-transition');
}

// Funciones especiales de Swipe combinadas para el Lightbox
window.handleLightboxTouchStart = function(e) {
    const img = document.getElementById('lightbox-img');
    if(img && img.classList.contains('zoomed')) {
        startPan(e);
    } else {
        touchStartX = e.changedTouches[0].screenX;
    }
}

window.handleLightboxTouchMove = function(e) {
    const img = document.getElementById('lightbox-img');
    if(img && img.classList.contains('zoomed')) {
        doPan(e);
    }
}

window.handleLightboxTouchEnd = function(e) {
    const img = document.getElementById('lightbox-img');
    if(img && img.classList.contains('zoomed')) {
        endPan(e);
    } else {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }
}

function renderProduct(slug) {
    const product = products.find(p => generateSlug(p.name) === slug);
    if (!product) return renderHome();

    document.title = `${product.name} | Rom Store`;

    window.currentProductImages = product.images || [];
    window.currentImageIndex = 0;
    
    const stockObj = product.stock || {};
    window.currentProductStock = stockObj;

    // Detectamos el algoritmo invisible guardado en Admin para el orden de colores
    window.currentColorOrder = [];
    if (product.tags) {
        const orderTag = product.tags.find(t => typeof t === 'string' && t.startsWith('color_order:'));
        if (orderTag) {
            window.currentColorOrder = orderTag.replace('color_order:', '').split('|');
        }
    }

    // Extraer todos los colores y todas las tallas
    const allColors = Object.keys(stockObj);
    const allSizesSet = new Set();
    
    allColors.forEach(c => {
        Object.keys(stockObj[c]).forEach(s => {
            allSizesSet.add(s); 
        });
    });
    
    // Tallas que existen en al menos un color (para poblar el select principal)
    const availableSizes = Array.from(allSizesSet).map(s => {
        const hasStock = allColors.some(c => stockObj[c][s] === true);
        return { name: s, available: hasStock };
    });

    const priceDisplay = (product.onSale && product.oldPrice) 
        ? `<span class="old-price" style="font-size: 1.2rem; margin-right: 15px;">$${product.oldPrice.toFixed(2)}</span> <span style="color: var(--color-danger);">$${product.price.toFixed(2)}</span>`
        : `$${product.price.toFixed(2)}`;

    const suggestions = getVisibleProducts().filter(p => 
        p.id !== product.id && 
        (p.category || []).some(c => (product.category || []).includes(c))
    ).slice(0, 4);

    appRoot.innerHTML = `
        <div class="fade-in product-detail-container">
            <div style="position: relative; width: 100%;">
                <div class="main-image-wrapper" ontouchstart="handleTouchStart(event)" ontouchend="handleTouchEnd(event)">
                    ${product.outOfStock ? '<div class="badge" style="background:#555; top:20px; left:20px; z-index: 10;">AGOTADO</div>' : (product.onSale ? '<div class="badge" style="background:var(--color-danger); top:20px; left:20px; z-index: 10;">SALE</div>' : '')}
                    
                    ${(product.images && product.images.length > 1) ? `
                        <button class="main-img-arrow left" aria-label="Anterior" onclick="changeImage(-1); event.stopPropagation();"><i class="fas fa-chevron-left"></i></button>
                        <button class="main-img-arrow right" aria-label="Siguiente" onclick="changeImage(1); event.stopPropagation();"><i class="fas fa-chevron-right"></i></button>
                    ` : ''}

                    <img src="${product.images && product.images.length > 0 ? product.images[0] : '/placeholder.jpg'}" id="main-product-img" alt="${product.name}" onclick="openLightbox()">
                </div>

                ${(product.images && product.images.length > 1) ? `
                <div class="thumbnail-gallery-container">
                    <div class="thumbnail-scroll" id="thumbnail-scroll">
                        ${product.images.map((img, idx) => `<img src="${img}" id="thumb-${idx}" class="${idx === 0 ? 'active' : ''}" onclick="setMainImage(${idx})" alt="Miniatura ${idx + 1}">`).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
            
            <div style="display: flex; flex-direction: column; justify-content: flex-start;">
                <h1 style="font-size: clamp(1.5rem, 4vw, 2.2rem); font-weight: 800; text-transform: uppercase; margin-bottom: 8px; line-height: 1.1;">${product.name}</h1>
                <p style="font-size: clamp(1.2rem, 3vw, 1.5rem); font-weight: 700; margin-bottom: 20px;">${priceDisplay}</p>
                <p style="color: var(--color-text-light); margin-bottom: 30px; font-size: 0.95rem; line-height: 1.6;">${product.description || 'Diseñado para el confort diario y el rendimiento óptimo.'}</p>
                
                <div class="variant-row">
                    <div class="variant-col">
                        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
                            <label style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Talla</label>
                            <button type="button" onclick="document.getElementById('size-guide-modal').classList.add('active'); document.getElementById('modal-overlay').classList.add('active'); lockScroll();" class="guide-text-prof">Guía de Tallas</button>
                        </div>
                        <select id="select-size" style="width: 100%; padding: 15px; border: 1px solid var(--color-border); background: transparent; font-family: inherit; font-size: 1rem; outline: none; border-radius: 4px;" onchange="updateVariantSelection('size')">
                            <option value="" disabled selected>Elige talla</option>
                            ${availableSizes.map(s => `<option value="${s.name}" ${!s.available ? 'disabled' : ''}>${s.name} ${!s.available ? '(Agotado)' : ''}</option>`).join('')}
                        </select>
                    </div>
                    <div class="variant-col">
                        <label style="display: block; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 1px;">Color</label>
                        <select id="select-color" disabled style="width: 100%; padding: 15px; border: 1px solid var(--color-border); background: #f9f9f9; font-family: inherit; font-size: 1rem; outline: none; border-radius: 4px;">
                            <option value="" disabled selected>Primero elige talla</option>
                        </select>
                    </div>
                </div>
                
                <button class="btn-primary" onclick="addToCart(${product.id})" ${product.outOfStock ? 'disabled style="background: #ccc; color: #666; cursor: not-allowed; box-shadow: none;"' : 'style="padding: 18px; font-size: 1rem; margin-top: 10px;"'}>
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

        <div class="lightbox-overlay" id="lightbox-overlay">
            <button class="lightbox-close" onclick="closeLightbox()" aria-label="Cerrar"><i class="fas fa-times"></i></button>
            <div class="lightbox-content" id="lightbox-content"
                 onmousedown="startPan(event)" onmousemove="doPan(event)" onmouseup="endPan(event)" onmouseleave="endPan(event)"
                 ontouchstart="handleLightboxTouchStart(event)" ontouchmove="handleLightboxTouchMove(event)" ontouchend="handleLightboxTouchEnd(event)">
                <img id="lightbox-img" src="" alt="Zoom de producto" onclick="toggleZoom(event)">
            </div>
            ${(product.images && product.images.length > 1) ? `
            <div class="lightbox-thumb-container">
                ${product.images.map((img, idx) => `<img src="${img}" onclick="setLightboxImage(${idx}); event.stopPropagation();" class="${idx === 0 ? 'active' : ''}" alt="Miniatura">`).join('')}
            </div>
            ` : ''}
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

    updateVariantSelection('init');
}

function createProductCard(p) {
    const badge = p.outOfStock ? '<div class="badge" style="background:#555;">AGOTADO</div>' : (p.onSale ? '<div class="badge" style="background:var(--color-danger);">SALE</div>' : '');
    const priceHTML = (p.onSale && p.oldPrice) 
        ? `<div class="price-container"><span class="old-price">$${p.oldPrice.toFixed(2)}</span> <span class="product-price" style="color:var(--color-danger);">$${p.price.toFixed(2)}</span></div>`
        : `<div class="price-container"><span class="product-price">$${p.price.toFixed(2)}</span></div>`;

    return `
        <a href="/producto/${generateSlug(p.name)}" data-route class="product-card fade-in">
            ${badge}
            <div class="product-card-img-wrapper">
                <img src="${p.images && p.images.length > 0 ? p.images[0] : '/placeholder.jpg'}" alt="${p.name}" loading="lazy">
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
    if (!images || images.length === 0) return;
    
    if (index < 0) index = images.length - 1;
    if (index >= images.length) index = 0;
    
    window.currentImageIndex = index;
    const mainImg = document.getElementById('main-product-img');
    if(mainImg) {
        mainImg.style.opacity = '0';
        setTimeout(() => {
            mainImg.src = images[index];
            mainImg.style.opacity = '1';
        }, 150);
    }

    document.querySelectorAll('.thumbnail-scroll img').forEach((img, i) => {
        img.classList.toggle('active', i === index);
    });

    const activeThumb = document.getElementById(`thumb-${index}`);
    if (activeThumb) {
        activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
}

window.changeImage = function(direction) {
    setMainImage(window.currentImageIndex + direction);
    // Si el lightbox está abierto, también sincronizamos el cambio allí
    if (document.getElementById('lightbox-overlay') && document.getElementById('lightbox-overlay').classList.contains('active')) {
        updateLightboxImage();
    }
}

window.scrollThumbnails = function(direction) {
    const scroll = document.getElementById('thumbnail-scroll');
    if(scroll) scroll.scrollBy({ left: direction * 150, behavior: 'smooth' });
}

window.handleTouchStart = function(e) {
    touchStartX = e.changedTouches[0].screenX;
}

window.handleTouchEnd = function(e) {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
}

function handleSwipe() {
    const threshold = 40; 
    if (touchStartX - touchEndX > threshold) {
        changeImage(1); 
    } else if (touchEndX - touchStartX > threshold) {
        changeImage(-1); 
    }
}

// --- 7. CARRITO Y TOASTS (CANTIDAD EN PDP ELIMINADA, SOLO 1 POR DEFECTO) ---

function showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fas fa-check-circle" style="color: var(--color-success); font-size: 1.1rem;"></i> ${message}`;
    container.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 2900);
}

window.addToCart = function(id) {
    const sizeSel = document.getElementById('select-size');
    const colorSel = document.getElementById('select-color');
    const size = sizeSel ? sizeSel.value : null;
    const color = colorSel ? colorSel.value : null;
    const qty = 1; // Fijo a 1
    
    if (!size || !color) {
        alert("Por favor, selecciona una talla y un color antes de continuar.");
        return;
    }

    const product = products.find(p => p.id === id);
    const existingItem = cart.find(item => item.id === id && item.selectedColor === color && item.selectedSize === size);
    
    if (existingItem) {
        existingItem.qty += qty;
    } else {
        cart.push({ ...product, selectedColor: color, selectedSize: size, qty: qty });
    }
    
    saveCart(); 
    updateCartBadge();
    showToast("Añadido a la bolsa");
    
    // Reinicio de los selectores luego de añadir al carrito
    if (sizeSel) sizeSel.value = "";
    if (colorSel) {
        colorSel.innerHTML = '<option value="" disabled selected>Primero elige talla</option>';
        colorSel.disabled = true;
        colorSel.style.background = '#f9f9f9';
    }

    toggleCart(); 
}

function updateCartBadge() {
    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
    if(cartCountEl) {
        cartCountEl.innerText = totalItems;
        if (totalItems === 0) {
            cartCountEl.style.display = 'none';
        } else {
            cartCountEl.style.display = 'flex';
        }
    }
}

window.updateCartQty = function(index, change) {
    cart[index].qty += change;
    if (cart[index].qty < 1) {
        cart.splice(index, 1); 
    }
    saveCart(); 
    updateCartBadge();
    renderCart();
}

window.removeFromCart = function(index) {
    cart.splice(index, 1);
    saveCart(); 
    updateCartBadge();
    renderCart();
}

window.clearCart = function() {
    if (confirm("¿Estás seguro de que deseas vaciar tu bolsa?")) {
        cart = [];
        saveCart();
        updateCartBadge();
        renderCart();
    }
}

function renderCart() {
    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart-container">
                <i class="fas fa-shopping-bag" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.5;"></i>
                <p style="font-size: 1rem; font-weight: 500; margin-bottom: 20px;">Tu bolsa está vacía.</p>
                <button onclick="closeAllUI(); navigateTo('/catalogo/todos')" class="btn-primary" style="width: auto; display: inline-block; padding: 12px 25px;">Continuar Comprando</button>
            </div>`;
        if (cartFooterEl) cartFooterEl.classList.add('d-none');
        return;
    }

    if (cartFooterEl) cartFooterEl.classList.remove('d-none');

    let clearCartHTML = '';
    // Vaciar bolsa aparece SOLO si hay MÁS de 3 productos distintos (filas) en el carrito
    if (cart.length > 3) {
        clearCartHTML = `
        <div class="clear-cart-container">
            <button onclick="clearCart()" class="clear-cart-btn">Vaciar Bolsa</button>
        </div>`;
    }

    cartItemsContainer.innerHTML = clearCartHTML + cart.map((item, index) => `
        <div class="fade-in" style="display: flex; gap: 15px; padding: 20px; border-bottom: 1px solid var(--color-border);">
            <img src="${item.images && item.images.length > 0 ? item.images[0] : '/placeholder.jpg'}" style="width: 80px; height: 100px; object-fit: cover; border-radius: 4px; background: #f4f4f4;">
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

    if (cartTotalEl) {
        const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        cartTotalEl.innerText = `$${total.toFixed(2)}`;
    }
}

// --- 8. CHECKOUT A WHATSAPP ---

if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
        if(cart.length === 0) return;
        
        wppModal.classList.add('active');
        modalOverlay.classList.add('active');
        lockScroll();
        customerNameInput.focus();
    });
}

if (confirmWppBtn) {
    confirmWppBtn.addEventListener('click', () => {
        const customerName = customerNameInput.value;

        let msg = "*ORDEN DE COMPRA | ROM STORE*\n";
        msg += "━━━━━━━━━━━━━━━━━━\n\n";
        
        if (customerName.trim() !== '') {
            msg += `*Cliente:* ${customerName.trim()}\n\n`;
        }

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
        msg += "¡Hola! Quisiera procesar esta orden y conocer los métodos de entrega y de pago disponibles.";

        const whatsappUrl = `https://wa.me/${wppNumber}?text=${encodeURIComponent(msg)}`;
        
        localStorage.setItem('rom_last_order_url', whatsappUrl);

        cart = [];
        saveCart();
        updateCartBadge();
        closeAllUI(); 
        
        customerNameInput.value = '';

        window.open(whatsappUrl, '_blank');
        
        navigateTo('/checkout/gracias');
    });
}

// --- 9. MOTOR DE BÚSQUEDA EXCLUYENDO AGOTADOS ---
let searchTimeout;
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const query = e.target.value.toLowerCase().trim();
            
            if (query.length < 2) {
                searchResults.innerHTML = '';
                return;
            }

            // Excluir productos agotados del resultado de búsqueda
            const results = getVisibleProducts().filter(p => 
                !p.outOfStock && 
                (p.name.toLowerCase().includes(query) || 
                ((p.tags || []).some(t => t.toLowerCase().includes(query))))
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
                    <a href="/producto/${generateSlug(p.name)}" data-route class="fade-in" style="display: flex; gap: 15px; padding: 15px; border-bottom: 1px solid var(--color-border); align-items: center; transition: background 0.2s;" onmouseover="this.style.background='#f9f9f9'" onmouseout="this.style.background='transparent'" onclick="closeSearchModal()">
                        <img src="${p.images && p.images.length > 0 ? p.images[0] : '/placeholder.jpg'}" style="width: 50px; height: 60px; object-fit: cover; border-radius: 4px; background: #f4f4f4;">
                        <div>
                            <h4 style="font-size: 0.9rem; font-weight: 600; margin-bottom: 3px; text-transform: uppercase;">${p.name}</h4>
                            <span style="font-weight: 700; font-size: 0.95rem;">${priceDisplay}</span>
                        </div>
                    </a>
                `;
            }).join('');
        }, 300); 
    });
}

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