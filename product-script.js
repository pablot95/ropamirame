import { db, doc, getDoc, collection, getDocs } from "./firebase-config.js";

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
            loadSimilarProducts(productData);
        } else {
            document.getElementById('product-content').innerHTML = '<p>Producto no encontrado.</p>';
        }
        document.getElementById('loading-msg').style.display = 'none';
        document.getElementById('product-content').style.display = 'grid';

    } catch (error) {
        console.error("Error fetching product:", error);
    }

    function renderProduct(product) {
        // Info básica
        title.textContent = product.name;
        desc.textContent = product.description;
        price.textContent = `$${formatPrice(product.price)}`;

        // Stock info
        const stockEl = document.getElementById('stock-info');
        if (stockEl && product.stock !== undefined) {
            if (product.stock > 0) {
                stockEl.textContent = `${product.stock} disponibles`;
                stockEl.className = 'stock-info in-stock';
            } else {
                stockEl.textContent = 'Sin stock';
                stockEl.className = 'stock-info out-of-stock';
                addToCartBtn.disabled = true;
                addToCartBtn.textContent = 'Sin Stock';
            }
        }

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
            currentSelection.size = 'N/A';
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

    // --- Cantidad con límite de stock ---
    const qtyInput = document.getElementById('qty-input');
    document.getElementById('qty-minus').addEventListener('click', () => {
        if (currentSelection.quantity > 1) {
            currentSelection.quantity--;
            qtyInput.value = currentSelection.quantity;
        }
    });

    document.getElementById('qty-plus').addEventListener('click', () => {
        const maxStock = productData?.stock || 999;
        if (currentSelection.quantity < maxStock) {
            currentSelection.quantity++;
            qtyInput.value = currentSelection.quantity;
        } else {
            alert(`Solo hay ${maxStock} unidades disponibles.`);
        }
    });

    // --- Agregar al Carrito ---
    addToCartBtn.addEventListener('click', () => {
        if (!currentSelection.size && document.getElementById('size-selector-container').style.display !== 'none') {
            alert('Por favor selecciona un talle.');
            return;
        }
        if (!currentSelection.color && document.getElementById('color-selector-container').style.display !== 'none') {
            alert('Por favor selecciona un color.');
            return;
        }

        // Verificar stock al agregar
        const maxStock = productData?.stock || 999;
        let cart = JSON.parse(localStorage.getItem('mirame_cart')) || [];
        const existingItem = cart.find(item => 
            item.id === productData.id && 
            item.size === currentSelection.size && 
            item.color === currentSelection.color
        );
        const currentInCart = existingItem ? existingItem.quantity : 0;
        
        if (currentInCart + currentSelection.quantity > maxStock) {
            alert(`No puedes agregar más. Ya tienes ${currentInCart} en el carrito y solo hay ${maxStock} en stock.`);
            return;
        }

        addToCart(productData, currentSelection);
    });

    function addToCart(product, selection) {
        let cart = JSON.parse(localStorage.getItem('mirame_cart')) || [];
        
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
        
        // Feedback visual
        addToCartBtn.textContent = '✓ Agregado!';
        addToCartBtn.style.backgroundColor = '#28a745';
        setTimeout(() => {
            addToCartBtn.textContent = 'Agregar al Carrito';
            addToCartBtn.style.backgroundColor = '';
        }, 1500);
    }

    // --- Productos Similares ---
    async function loadSimilarProducts(currentProduct) {
        try {
            const querySnapshot = await getDocs(collection(db, "products"));
            let allProducts = [];
            querySnapshot.forEach((doc) => {
                const data = { id: doc.id, ...doc.data() };
                if (doc.id !== currentProduct.id) {
                    allProducts.push(data);
                }
            });

            // Preferir misma categoría, luego aleatorios
            let sameCategory = allProducts.filter(p => p.category === currentProduct.category);
            let others = allProducts.filter(p => p.category !== currentProduct.category);
            
            // Mezclar aleatoriamente
            sameCategory.sort(() => Math.random() - 0.5);
            others.sort(() => Math.random() - 0.5);
            
            // Tomar 4 productos: primero de la misma categoría, luego del resto
            let similar = [...sameCategory, ...others].slice(0, 4);
            
            renderSimilarProducts(similar);
        } catch (error) {
            console.error("Error cargando productos similares:", error);
        }
    }

    function renderSimilarProducts(products) {
        const container = document.getElementById('similar-products-grid');
        if (!container || products.length === 0) return;

        document.getElementById('similar-section').style.display = 'block';

        container.innerHTML = products.map(product => {
            const mainImage = (product.images && product.images.length > 0) 
                ? product.images[0] : 'images/placeholder.jpg';
            return `
                <div class="similar-card" onclick="window.location.href='product.html?id=${product.id}'">
                    <div class="similar-card-img">
                        <img src="${mainImage}" alt="${product.name}">
                    </div>
                    <div class="similar-card-info">
                        <h4>${product.name}</h4>
                        <span class="similar-price">$${formatPrice(product.price)}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    function updateCartCount() {
        const cart = JSON.parse(localStorage.getItem('mirame_cart')) || [];
        const count = cart.reduce((acc, item) => acc + item.quantity, 0);
        const countBadge = document.getElementById('cart-count');
        if(countBadge) countBadge.textContent = count;
    }
    
    updateCartCount();
});