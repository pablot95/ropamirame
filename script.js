import { db, collection, getDocs } from "./firebase-config.js";

document.addEventListener('DOMContentLoaded', async () => {
    
    // Elementos del DOM
    const productGrid = document.getElementById('product-grid');
    const categoriesBtns = document.querySelectorAll('.filter-btn'); // Botones de la barra lateral
    const navLinks = document.querySelectorAll('.nav-filter'); // Enlaces del menú desplegable

    let allProducts = [];

    // --- Cargar Productos desde Firebase ---
    async function loadProducts() {
        productGrid.innerHTML = '<div class="loader">Cargando colección...</div>';
        
        try {
            const querySnapshot = await getDocs(collection(db, "products"));
            
            allProducts = [];
            querySnapshot.forEach((doc) => {
                allProducts.push({ id: doc.id, ...doc.data() });
            });

            renderProducts(allProducts);

        } catch (error) {
            console.error("Error al cargar productos:", error);
            productGrid.innerHTML = '<p>Lo sentimos, hubo un error al cargar los productos.</p>';
        }
    }

    // --- Renderizar Productos ---
    function renderProducts(productsToRender) {
        productGrid.innerHTML = '';

        if (productsToRender.length === 0) {
            productGrid.innerHTML = '<p>No se encontraron productos en esta categoría.</p>';
            return;
        }

        productsToRender.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
            
            // Usar la primera imagen o un placeholder
            const mainImage = (product.images && product.images.length > 0) 
                              ? product.images[0] 
                              : 'images/placeholder.jpg';

            card.innerHTML = `
                <div class="card-image-wrapper" data-product-id="${product.id}">
                    <img src="${mainImage}" alt="${product.name}" class="product-image">
                    <div class="card-overlay">
                        <span class="view-details-txt">Ver Detalles</span>
                    </div>
                </div>
                <div class="product-info">
                    <h3 class="product-title">${product.name}</h3>
                    <div class="product-price">$${formatPrice(product.price)}</div>
                    <div class="card-cart-actions">
                        <div class="card-qty-selector">
                            <button class="card-qty-btn card-qty-minus" data-id="${product.id}">-</button>
                            <span class="card-qty-value" id="qty-${product.id}">1</span>
                            <button class="card-qty-btn card-qty-plus" data-id="${product.id}" data-stock="${product.stock || 999}">+</button>
                        </div>
                        <button class="card-add-to-cart" data-id="${product.id}">Agregar</button>
                    </div>
                </div>
            `;

            // Hacer click en la imagen para ir al detalle
            card.querySelector('.card-image-wrapper').addEventListener('click', () => {
                window.location.href = `product.html?id=${product.id}`;
            });

            // Título también clickeable
            card.querySelector('.product-title').addEventListener('click', () => {
                window.location.href = `product.html?id=${product.id}`;
            });
            card.querySelector('.product-title').style.cursor = 'pointer';

            // Botones de cantidad
            card.querySelector('.card-qty-minus').addEventListener('click', (e) => {
                e.stopPropagation();
                const qtyEl = document.getElementById(`qty-${product.id}`);
                let qty = parseInt(qtyEl.textContent);
                if (qty > 1) {
                    qtyEl.textContent = qty - 1;
                }
            });

            card.querySelector('.card-qty-plus').addEventListener('click', (e) => {
                e.stopPropagation();
                const qtyEl = document.getElementById(`qty-${product.id}`);
                let qty = parseInt(qtyEl.textContent);
                const maxStock = parseInt(e.target.dataset.stock);
                if (qty < maxStock) {
                    qtyEl.textContent = qty + 1;
                }
            });

            // Botón agregar al carrito
            card.querySelector('.card-add-to-cart').addEventListener('click', (e) => {
                e.stopPropagation();
                const qtyEl = document.getElementById(`qty-${product.id}`);
                const qty = parseInt(qtyEl.textContent);
                
                addToCartFromHome(product, qty);
                
                // Feedback visual
                const btn = e.target;
                btn.textContent = '✓ Agregado';
                btn.style.backgroundColor = '#28a745';
                btn.style.borderColor = '#28a745';
                setTimeout(() => {
                    btn.textContent = 'Agregar';
                    btn.style.backgroundColor = '';
                    btn.style.borderColor = '';
                    qtyEl.textContent = '1';
                }, 1500);
            });

            productGrid.appendChild(card);
        });
    }

    function addToCartFromHome(product, quantity) {
        let cart = JSON.parse(localStorage.getItem('mirame_cart')) || [];
        
        // Buscar si ya existe (sin talle/color específico)
        const existingIndex = cart.findIndex(item => 
            item.id === product.id && 
            item.size === 'N/A' && 
            item.color === 'N/A'
        );

        if (existingIndex > -1) {
            cart[existingIndex].quantity += quantity;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: (product.images && product.images.length > 0) ? product.images[0] : 'images/placeholder.jpg',
                size: 'N/A',
                color: 'N/A',
                quantity: quantity
            });
        }

        localStorage.setItem('mirame_cart', JSON.stringify(cart));
        updateCartCount();
    }

    function formatPrice(price) {
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    // --- Filtrado ---
    function filterProducts(category) {
        // Actualizar UI activa
        categoriesBtns.forEach(btn => {
            if(btn.dataset.filter === category) btn.classList.add('active');
            else btn.classList.remove('active');
        });

        if (category === 'all') {
            renderProducts(allProducts);
        } else {
            const filtered = allProducts.filter(p => p.category === category);
            renderProducts(filtered);
        }
    }

    // Event Listeners Sidebar
    categoriesBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // e.preventDefault(); // Button doesn't need preventDefault
            const filter = btn.getAttribute('data-filter');
            filterProducts(filter);
        });
    });

    // Event Listeners Nav Dropdown
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            // No prevenimos default para que haga scroll al anchor #collection si es necesario
            const filter = link.getAttribute('data-filter');
            filterProducts(filter);
        });
    });

    // Iniciar
    loadProducts();
    updateCartCount();
});

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('mirame_cart')) || [];
    const count = cart.reduce((acc, item) => acc + item.quantity, 0);
    const badge = document.getElementById('cart-count');
    if (badge) badge.textContent = count;
}
