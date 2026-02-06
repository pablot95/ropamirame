document.addEventListener('DOMContentLoaded', () => {
    const cartItemsContainer = document.getElementById('cart-items');
    const emptyCartMsg = document.getElementById('empty-cart-msg');
    const cartContent = document.getElementById('cart-content');
    const subtotalEl = document.getElementById('cart-subtotal');
    const totalEl = document.getElementById('cart-total');

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

        // Event listeners for remove buttons
        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                removeItem(index);
            });
        });
    }

    function updateTotals(cart) {
        const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        const formatted = `$${formatPrice(total)}`;
        subtotalEl.textContent = formatted;
        totalEl.textContent = formatted;
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
