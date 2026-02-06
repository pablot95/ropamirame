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

            // Estructura HTML que coincide con style.css existente (card-overlay)
            card.innerHTML = `
                <div class="card-image-wrapper">
                    <img src="${mainImage}" alt="${product.name}" class="product-image">
                    <div class="card-overlay">
                        <span class="view-details-txt">Ver Detalles</span>
                    </div>
                </div>
                <div class="product-info">
                    <h3 class="product-title">${product.name}</h3>
                    <p class="product-category">${product.category}</p>
                    <div class="product-price">$${formatPrice(product.price)}</div>
                </div>
            `;

            // Hacer toda la tarjeta clickeable
            card.addEventListener('click', () => {
                window.location.href = `product.html?id=${product.id}`;
            });

            productGrid.appendChild(card);
        });
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
