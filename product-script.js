import { db, doc, getDoc } from "./firebase-config.js";

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');

    if (!productId) {
        window.location.href = 'index.html';
        return;
    }

    const mainImg = document.getElementById('main-img');
    const thumbnailsContainer = document.getElementById('thumbnails');
    const title = document.getElementById('p-title');
    const price = document.getElementById('p-price');
    const desc = document.getElementById('p-desc');
    const sizeOptionsContainer = document.getElementById('size-options');
    const colorOptionsContainer = document.getElementById('color-options');
    const addToCartBtn = document.getElementById('add-to-cart');
    
    let productData = null;
    let currentSelection = {
        size: null,
        color: null,
        quantity: 1
    };

    // --- Cargar Datos ---
    try {
        const docRef = doc(db, "products", productId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            productData = { id: docSnap.id, ...docSnap.data() };
            renderProduct(productData);
        } else {
            document.getElementById('product-content').innerHTML = '<p>Producto no encontrado.</p>';
        }
        document.getElementById('loading-msg').style.display = 'none';
        document.getElementById('product-content').style.display = 'grid'; // restaurar display grid

    } catch (error) {
        console.error("Error fetching product:", error);
    }

    function renderProduct(product) {
        // Info básica
        title.textContent = product.name;
        desc.textContent = product.description;
        price.textContent = `$${formatPrice(product.price)}`;

        // Imágenes
        if (product.images && product.images.length > 0) {
            mainImg.src = product.images[0];
            
            product.images.forEach((imgUrl, index) => {
                const img = document.createElement('img');
                img.src = imgUrl;
                if (index === 0) img.classList.add('active');
                
                img.addEventListener('click', () => {
                    mainImg.src = imgUrl;
                    document.querySelectorAll('.thumbnails img').forEach(i => i.classList.remove('active'));
                    img.classList.add('active');
                });
                thumbnailsContainer.appendChild(img);
            });
        } else {
            mainImg.src = 'images/placeholder.jpg';
        }

        // Talles
        if (product.sizes && product.sizes.length > 0) {
            product.sizes.forEach(size => {
                const btn = document.createElement('div');
                btn.className = 'option-btn';
                btn.textContent = size;
                btn.addEventListener('click', () => {
                    selectOption('size', size, btn, '.selector-group#size-selector-container .option-btn');
                });
                sizeOptionsContainer.appendChild(btn);
            });
        } else {
            document.getElementById('size-selector-container').style.display = 'none';
            currentSelection.size = 'N/A'; // No aplica
        }

        // Colores
        if (product.colors && product.colors.length > 0) {
            const colorMap = {
                'celeste': '#b2ebf2', 'negro': '#000000', 'blanco': '#ffffff',
                'mostaza': '#ffdb58', 'cafe': '#6f4e37', 'natural': '#fdfaf0',
                'gris melange': '#808080', 'verde claro': '#90ee90', 'rosa': '#ffc0cb',
                'borravino': '#800020', 'lavanda': '#e6e6fa', 'verde beneton': '#009e60'
            };

            product.colors.forEach(colorName => {
                const btn = document.createElement('div');
                btn.className = 'color-option';
                btn.title = colorName;
                btn.style.backgroundColor = colorMap[colorName] || '#ccc';
                
                btn.addEventListener('click', () => {
                    selectOption('color', colorName, btn, '.selector-group#color-selector-container .color-option');
                });
                colorOptionsContainer.appendChild(btn);
            });
        } else {
            document.getElementById('color-selector-container').style.display = 'none';
            currentSelection.color = 'N/A';
        }
    }

    function selectOption(type, value, element, selector) {
        currentSelection[type] = value;
        document.querySelectorAll(selector).forEach(el => el.classList.remove('selected'));
        element.classList.add('selected');
    }

    function formatPrice(price) {
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    // --- Cantidad ---
    const qtyInput = document.getElementById('qty-input');
    document.getElementById('qty-minus').addEventListener('click', () => {
        if (currentSelection.quantity > 1) {
            currentSelection.quantity--;
            qtyInput.value = currentSelection.quantity;
        }
    });

    document.getElementById('qty-plus').addEventListener('click', () => {
        currentSelection.quantity++;
        qtyInput.value = currentSelection.quantity;
    });

    // --- Agregar al Carrito ---
    addToCartBtn.addEventListener('click', () => {
        // Validar selección
        if (!currentSelection.size && document.getElementById('size-selector-container').style.display !== 'none') {
            alert('Por favor selecciona un talle.');
            return;
        }
        if (!currentSelection.color && document.getElementById('color-selector-container').style.display !== 'none') {
            alert('Por favor selecciona un color.');
            return;
        }

        addToCart(productData, currentSelection);
    });

    function addToCart(product, selection) {
        let cart = JSON.parse(localStorage.getItem('mirame_cart')) || [];
        
        // Verificar si ya existe el mismo producto con mismas opciones
        const existingIndex = cart.findIndex(item => 
            item.id === product.id && 
            item.size === selection.size && 
            item.color === selection.color
        );

        if (existingIndex > -1) {
            cart[existingIndex].quantity += selection.quantity;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.images[0],
                size: selection.size,
                color: selection.color,
                quantity: selection.quantity
            });
        }

        localStorage.setItem('mirame_cart', JSON.stringify(cart));
        updateCartCount();
        alert('Producto agregado al carrito!');
    }

    function updateCartCount() {
        const cart = JSON.parse(localStorage.getItem('mirame_cart')) || [];
        const count = cart.reduce((acc, item) => acc + item.quantity, 0);
        const countBadge = document.getElementById('cart-count');
        if(countBadge) countBadge.textContent = count;
    }
    
    updateCartCount();
});
