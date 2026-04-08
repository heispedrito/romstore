// admin.js - Lógica del Panel de Control (Supabase + Vanilla JS)

// --- 1. CONFIGURACIÓN DE SUPABASE ---
const supabaseUrl = 'https://hvgthlomkgzzibxaveap.supabase.co';
const supabaseKey = 'sb_publishable_BkKlInWSSDxn1AC-8IQ7yQ_3Ia_FqQT';
// SOLUCIÓN: Renombrado a supabaseClient
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// --- 2. ESTADO GLOBAL ---
let products = [];
let currentSession = null;

// --- 3. SELECTORES DEL DOM ---
const authView = document.getElementById('auth-view');
const adminView = document.getElementById('admin-view');

const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('admin-email');
const passwordInput = document.getElementById('admin-password');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');

const productsGrid = document.getElementById('admin-products-grid');
const searchInput = document.getElementById('admin-search');
const addProductBtn = document.getElementById('add-product-btn');

const productModal = document.getElementById('product-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const productForm = document.getElementById('product-form');
const modalTitle = document.getElementById('modal-title');
const saveProductBtn = document.getElementById('save-product-btn');

const inId = document.getElementById('prod-id');
const inName = document.getElementById('prod-name');
const inPrice = document.getElementById('prod-price');
const inOldPrice = document.getElementById('prod-oldprice');
const inOrder = document.getElementById('prod-order');
const inCategory = document.getElementById('prod-category');
const inTags = document.getElementById('prod-tags');
const inDesc = document.getElementById('prod-description');
const inOnSale = document.getElementById('prod-onsale');
const inOutOfStock = document.getElementById('prod-outofstock');
const inHidden = document.getElementById('prod-hidden');

const imagesContainer = document.getElementById('images-container');
const addImageBtn = document.getElementById('add-image-btn');
const stockContainer = document.getElementById('stock-container');
const addColorBtn = document.getElementById('add-color-btn');

// --- 4. AUTENTICACIÓN ---
async function checkSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    currentSession = session;
    toggleViews();
    if (session) fetchProducts();
}

supabaseClient.auth.onAuthStateChange((event, session) => {
    currentSession = session;
    toggleViews();
    if (session && event === 'SIGNED_IN') fetchProducts();
});

function toggleViews() {
    if (currentSession) {
        authView.classList.add('hidden');
        adminView.classList.remove('hidden');
    } else {
        authView.classList.remove('hidden');
        adminView.classList.add('hidden');
        loginForm.reset();
    }
}

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.classList.add('hidden');
    const loginBtn = document.getElementById('login-btn');
    loginBtn.innerHTML = 'Cargando...';

    const { error } = await supabaseClient.auth.signInWithPassword({
        email: emailInput.value,
        password: passwordInput.value
    });

    if (error) {
        loginError.innerText = "Credenciales incorrectas.";
        loginError.classList.remove('hidden');
        loginBtn.innerHTML = 'Iniciar Sesión <i class="fas fa-arrow-right"></i>';
    }
});

logoutBtn.addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
});

// --- 5. LECTURA DE PRODUCTOS (READ) ---
async function fetchProducts() {
    productsGrid.innerHTML = '<div class="loading-state">Descargando inventario...</div>';
    
    const { data, error } = await supabaseClient
        .from('products')
        .select('*')
        .order('order', { ascending: true });

    if (error) {
        alert("Error al cargar productos: " + error.message);
        return;
    }

    products = data;
    renderAdminProducts(products);
}

function renderAdminProducts(items) {
    if (items.length === 0) {
        productsGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #666;">No hay productos en el inventario.</div>';
        return;
    }

    productsGrid.innerHTML = items.map(p => `
        <div class="admin-card">
            <img src="${p.images && p.images.length > 0 ? p.images[0] : '/placeholder.jpg'}" alt="Img">
            <div class="admin-card-info">
                <h4>${p.name}</h4>
                <p>$${p.price.toFixed(2)} | Orden: ${p.order}</p>
            </div>
            <div class="admin-card-status">
                ${p.hidden ? '<span class="badge-status hidden">Oculto</span>' : '<span class="badge-status active">Público</span>'}
                ${p.outOfStock ? '<span class="badge-status out">Agotado</span>' : ''}
                ${p.onSale ? '<span class="badge-status active" style="background:#fce8e6; color:var(--color-danger);">Oferta</span>' : ''}
            </div>
            <div style="display: flex; gap: 10px;">
                <button onclick="editProduct(${p.id})" class="btn-icon" title="Editar"><i class="fas fa-edit"></i></button>
                <button onclick="deleteProduct(${p.id})" class="btn-icon danger" title="Eliminar"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

searchInput.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    const filtered = products.filter(p => p.name.toLowerCase().includes(q));
    renderAdminProducts(filtered);
});

// --- 6. GESTIÓN DEL MODAL ---
function openModal(isEdit = false) {
    modalTitle.innerText = isEdit ? "Editar Producto" : "Nuevo Drop";
    productModal.classList.remove('hidden');
}

function closeModal() {
    productModal.classList.add('hidden');
    productForm.reset();
    inId.value = '';
    imagesContainer.innerHTML = '';
    stockContainer.innerHTML = '';
}

closeModalBtn.addEventListener('click', closeModal);
addProductBtn.addEventListener('click', () => {
    closeModal();
    openModal(false);
    addImageInput('');
});

// --- 7. LÓGICA DINÁMICA DE IMÁGENES ---
function addImageInput(val = '') {
    const div = document.createElement('div');
    div.className = 'dynamic-row';
    div.innerHTML = `
        <input type="url" class="img-input full-width" placeholder="URL de ImgBB" value="${val}">
        <button type="button" class="btn-icon danger" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
    `;
    imagesContainer.appendChild(div);
}
addImageBtn.addEventListener('click', () => addImageInput(''));

// --- 8. LÓGICA DINÁMICA DE STOCK (JSONB) ---
function addColorBlock(colorName = '', sizesObj = {}) {
    const blockId = 'color-' + Date.now() + Math.random().toString(36).substring(7);
    const div = document.createElement('div');
    div.className = 'color-block';
    div.id = blockId;
    
    let sizesHTML = '';
    if (Object.keys(sizesObj).length > 0) {
        for (const [size, isAvailable] of Object.entries(sizesObj)) {
            sizesHTML += createSizeBadge(size, isAvailable);
        }
    }

    div.innerHTML = `
        <div class="color-header">
            <input type="text" class="color-name-input" placeholder="Nombre del Color (Ej: Negro)" value="${colorName}">
            <div>
                <button type="button" class="btn-secondary" onclick="promptAddSize('${blockId}')"><i class="fas fa-plus"></i> Talla</button>
                <button type="button" class="btn-icon danger" onclick="this.closest('.color-block').remove()"><i class="fas fa-trash"></i></button>
            </div>
        </div>
        <div class="sizes-grid" id="sizes-${blockId}">
            ${sizesHTML}
        </div>
    `;
    stockContainer.appendChild(div);
}

function createSizeBadge(sizeName, isAvailable = true) {
    const checked = isAvailable ? 'checked' : '';
    return `
        <label class="size-badge">
            <input type="checkbox" class="size-checkbox" value="${sizeName}" ${checked}> 
            ${sizeName}
            <i class="fas fa-times" style="color: red; margin-left: 5px; cursor:pointer;" onclick="this.parentElement.remove()"></i>
        </label>
    `;
}

window.promptAddSize = function(blockId) {
    const size = prompt("Nombre de la talla (Ej: M, Única):");
    if (size && size.trim() !== '') {
        const grid = document.getElementById(`sizes-${blockId}`);
        grid.insertAdjacentHTML('beforeend', createSizeBadge(size.trim(), true));
    }
}

addColorBtn.addEventListener('click', () => addColorBlock());

// --- 9. CREAR / ACTUALIZAR PRODUCTO (CREATE & UPDATE) ---
window.editProduct = function(id) {
    const p = products.find(x => x.id === id);
    if (!p) return;

    closeModal();
    
    inId.value = p.id;
    inName.value = p.name;
    inPrice.value = p.price;
    inOldPrice.value = p.oldPrice || '';
    inOrder.value = p.order || 999;
    inCategory.value = (p.category || []).join(', ');
    inTags.value = (p.tags || []).join(', ');
    inDesc.value = p.description || '';
    inOnSale.checked = p.onSale || false;
    inOutOfStock.checked = p.outOfStock || false;
    inHidden.checked = p.hidden || false;

    if (p.images && p.images.length > 0) {
        p.images.forEach(img => addImageInput(img));
    } else {
        addImageInput('');
    }

    if (p.stock && Object.keys(p.stock).length > 0) {
        for (const [color, sizes] of Object.entries(p.stock)) {
            addColorBlock(color, sizes);
        }
    }

    openModal(true);
}

saveProductBtn.addEventListener('click', async () => {
    if (!inName.value.trim() || !inPrice.value) {
        alert("El nombre y el precio son obligatorios.");
        return;
    }

    saveProductBtn.innerHTML = "Guardando... <i class='fas fa-spinner fa-spin'></i>";
    saveProductBtn.disabled = true;

    const categoryArr = inCategory.value.split(',').map(s => s.trim()).filter(s => s);
    const tagsArr = inTags.value.split(',').map(s => s.trim()).filter(s => s);
    
    const imgInputs = document.querySelectorAll('.img-input');
    const imagesArr = Array.from(imgInputs).map(inp => inp.value.trim()).filter(val => val !== '');

    const stockData = {};
    const colorBlocks = document.querySelectorAll('.color-block');
    
    colorBlocks.forEach(block => {
        const colorName = block.querySelector('.color-name-input').value.trim();
        if (colorName !== '') {
            stockData[colorName] = {};
            const sizeCheckboxes = block.querySelectorAll('.size-checkbox');
            sizeCheckboxes.forEach(chk => {
                stockData[colorName][chk.value] = chk.checked;
            });
        }
    });

    const productData = {
        name: inName.value.trim(),
        price: parseFloat(inPrice.value),
        oldPrice: inOldPrice.value ? parseFloat(inOldPrice.value) : null,
        order: parseInt(inOrder.value) || 999,
        category: categoryArr,
        tags: tagsArr,
        description: inDesc.value.trim(),
        images: imagesArr,
        stock: stockData,
        "onSale": inOnSale.checked,
        "outOfStock": inOutOfStock.checked,
        hidden: inHidden.checked
    };

    const isEdit = inId.value !== '';
    let response;

    if (isEdit) {
        response = await supabaseClient.from('products').update(productData).eq('id', inId.value);
    } else {
        response = await supabaseClient.from('products').insert([productData]);
    }

    saveProductBtn.disabled = false;
    saveProductBtn.innerHTML = "Guardar Producto <i class='fas fa-save'></i>";

    if (response.error) {
        alert("Error al guardar: " + response.error.message);
    } else {
        closeModal();
        fetchProducts(); 
    }
});

// --- 10. ELIMINAR PRODUCTO (DELETE) ---
window.deleteProduct = async function(id) {
    if (confirm("¿Estás seguro de eliminar este producto PERMANENTEMENTE? Es recomendable usar la opción 'Ocultar' en su lugar.")) {
        const { error } = await supabaseClient.from('products').delete().eq('id', id);
        if (error) {
            alert("Error al eliminar: " + error.message);
        } else {
            fetchProducts();
        }
    }
}

// INICIAR
checkSession();