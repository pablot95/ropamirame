document.addEventListener('DOMContentLoaded', () => {
    /* ... (código existente) ... */
    
    // Al final del DOMContentLoaded o en una función separada común
    updateCartCount();
});

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('mirame_cart')) || [];
    const count = cart.reduce((acc, item) => acc + item.quantity, 0);
    const badge = document.getElementById('cart-count');
    if (badge) badge.textContent = count;
}
