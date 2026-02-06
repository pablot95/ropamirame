document.addEventListener('DOMContentLoaded', () => {
    // --- Configuración MercadoPago ---
    // Reemplaza YOUR_PUBLIC_KEY con la clave pública de tu cuenta de Mercado Pago
    const mp = new MercadoPago('YOUR_PUBLIC_KEY', {
        locale: 'es-AR'
    });

    const checkoutForm = document.getElementById('checkout-form');
    const billingCheckbox = document.getElementById('billing-same-shipping');
    const billingInfo = document.getElementById('billing-info');
    const totalEl = document.getElementById('checkout-total');

    // Cargar total
    const cart = JSON.parse(localStorage.getItem('mirame_cart')) || [];
    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    totalEl.textContent = `$${formatPrice(total)}`;

    if (cart.length === 0) {
        alert("El carrito está vacío");
        window.location.href = "index.html";
    }

    // Toggle Billing Info
    billingCheckbox.addEventListener('change', (e) => {
        billingInfo.style.display = e.target.checked ? 'none' : 'block';
    });

    // Manejar envío del formulario
    checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(checkoutForm);
        const customerData = Object.fromEntries(formData.entries());

        console.log("Datos del cliente:", customerData);
        console.log("Items:", cart);

        // Aquí deberías llamar a tu backend (o Firebase Cloud Function) para crear
        // la preferencia de MercadoPago.
        // Ejemplo de lo que se enviaría:
        /*
        const orderData = {
            items: cart.map(item => ({
                title: item.name,
                unit_price: item.price,
                quantity: item.quantity,
            })),
            payer: {
                name: customerData.firstName,
                surname: customerData.lastName,
                email: customerData.email,
                // ...
            }
        };
        */

        alert("Integración lista. Aquí se debe generar el ID de preferencia de MercadoPago.");

        // Simulación: Una vez obtenido el preferenceId del backend:
        // createCheckoutButton("YOUR_PREFERENCE_ID");
    });

    function createCheckoutButton(preferenceId) {
        const bricksBuilder = mp.bricks();

        bricksBuilder.create("wallet", "wallet_container", {
            initialization: {
                preferenceId: preferenceId,
            },
           customization: {
             texts: {
               valueProp: 'smart_option',
             },
           },
        });
    }

    function formatPrice(price) {
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }
});
