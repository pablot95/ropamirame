import { db, doc, getDoc } from "./firebase-config.js";

document.addEventListener('DOMContentLoaded', async () => {
    const cartItemsContainer = document.getElementById('cart-items');
    const emptyCartMsg = document.getElementById('empty-cart-msg');
    const cartContent = document.getElementById('cart-content');
    const subtotalEl = document.getElementById('cart-subtotal');
    const totalEl = document.getElementById('cart-total');
    const shippingEl = document.getElementById('cart-shipping');
    const shippingInfoEl = document.getElementById('cart-shipping-info');

    // Cargar configuración de envío desde Firebase
    let shippingPrice = 9000;
    let freeShippingThreshold = 120000;

    try {
        const shippingDoc = await getDoc(doc(db, "config", "shipping"));
        if (shippingDoc.exists()) {
            const data = shippingDoc.data();
            shippingPrice = data.shippingPrice || 9000;
            freeShippingThreshold = data.freeShippingThreshold || 120000;
        }
    } catch (error) {
        console.error("Error al cargar config de envío:", error);
    }

    function loadCart() {
        const cart = JSON.parse(localStorage.getItem('mirame_cart')) || [];
        
        if (cart.length === 0) {
            emptyCartMsg.style.display = 'block';
            cartContent.style.display = 'none';
            return;
        }

        emptyCartMsg.style.display = 'none';
        cartContent.style.display = 'grid';
        renderItems(cart);
        updateTotals(cart);
    }

    function renderItems(cart) {
        cartItemsContainer.innerHTML = '';
        cart.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'cart-item';
            div.innerHTML = `
                <img src="${item.image || 'images/placeholder.jpg'}" alt="${item.name}">
                <div class="item-details">
                    <h3>${item.name}</h3>
                    <p class="item-meta">Talle: ${item.size || '-'} | Color: ${item.color || '-'}</p>
                    <p class="item-price">$${formatPrice(item.price)} x ${item.quantity}</p>
                </div>
                <div class="item-actions">
                    <button class="remove-btn" data-index="${index}">Eliminar</button>
                    <p>Total: $${formatPrice(item.price * item.quantity)}</p>
                </div>
            `;
            cartItemsContainer.appendChild(div);
        });

        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                removeItem(index);
            });
        });
    }

    function updateTotals(cart) {
        const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        const isFreeShipping = subtotal >= freeShippingThreshold;
        const shippingCost = isFreeShipping ? 0 : shippingPrice;
        const total = subtotal + shippingCost;

        subtotalEl.textContent = `$${formatPrice(subtotal)}`;
        totalEl.textContent = `$${formatPrice(total)}`;

        if (shippingEl) {
            if (isFreeShipping) {
                shippingEl.innerHTML = `<span style="color: #28a745; font-weight: 600;">¡GRATIS!</span>`;
            } else {
                shippingEl.textContent = `$${formatPrice(shippingCost)}`;
            }
        }

        if (shippingInfoEl) {
            if (isFreeShipping) {
                shippingInfoEl.innerHTML = `<div class="free-ship-badge">🎉 ¡Tenés envío gratis!</div>`;
            } else {
                const remaining = freeShippingThreshold - subtotal;
                shippingInfoEl.innerHTML = `<div class="ship-hint">📦 Sumá $${formatPrice(remaining)} más para envío gratis</div>`;
            }
        }
    }

    function removeItem(index) {
        let cart = JSON.parse(localStorage.getItem('mirame_cart')) || [];
        cart.splice(index, 1);
        localStorage.setItem('mirame_cart', JSON.stringify(cart));
        loadCart();
    }

    function formatPrice(price) {
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    loadCart();
});
