import { db, collection, addDoc, doc, getDoc } from "./firebase-config.js";

document.addEventListener('DOMContentLoaded', async () => {
    const mp = new MercadoPago('APP_USR-0105d511-0e85-4b9f-b131-ae47ad7210a6', {
        locale: 'es-AR'
    });

    const checkoutForm = document.getElementById('checkout-form');
    const billingCheckbox = document.getElementById('billing-same-shipping');
    const billingInfo = document.getElementById('billing-info');
    const totalEl = document.getElementById('checkout-total');
    const subtotalEl = document.getElementById('checkout-subtotal');
    const shippingEl = document.getElementById('checkout-shipping');
    const shippingInfoEl = document.getElementById('shipping-info-badge');

    const cart = JSON.parse(localStorage.getItem('mirame_cart')) || [];
    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    // Cargar configuración de envío desde Firebase
    let shippingPrice = 9000;
    let freeShippingThreshold = 120000;

    try {
        const shippingDoc = await getDoc(doc(db, "config", "shipping"));
        if (shippingDoc.exists()) {
            const shippingData = shippingDoc.data();
            shippingPrice = shippingData.shippingPrice || 9000;
            freeShippingThreshold = shippingData.freeShippingThreshold || 120000;
        }
    } catch (error) {
        console.error("Error al cargar config de envío:", error);
    }

    const isFreeShipping = subtotal >= freeShippingThreshold;
    const shippingCost = isFreeShipping ? 0 : shippingPrice;
    const total = subtotal + shippingCost;

    if (subtotalEl) subtotalEl.textContent = `$${formatPrice(subtotal)}`;
    if (shippingEl) {
        if (isFreeShipping) {
            shippingEl.innerHTML = `<span style="color: #28a745; font-weight: 600;">¡GRATIS!</span>`;
        } else {
            shippingEl.textContent = `$${formatPrice(shippingCost)}`;
        }
    }
    if (totalEl) totalEl.textContent = `$${formatPrice(total)}`;

    // Mostrar badge de envío gratis o cuánto falta
    if (shippingInfoEl) {
        if (isFreeShipping) {
            shippingInfoEl.innerHTML = `<span class="free-shipping-badge">🎉 ¡Tenés envío gratis!</span>`;
        } else {
            const remaining = freeShippingThreshold - subtotal;
            shippingInfoEl.innerHTML = `<span class="shipping-hint">📦 Sumá $${formatPrice(remaining)} más para envío gratis</span>`;
        }
    }

    if (cart.length === 0) {
        alert("El carrito está vacío");
        window.location.href = "index.html";
        return;
    }

    renderCheckoutSummary(cart);

    billingCheckbox.addEventListener('change', (e) => {
        billingInfo.style.display = e.target.checked ? 'none' : 'block';
    });

    checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = checkoutForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Procesando...';

        const formData = new FormData(checkoutForm);
        const customerData = Object.fromEntries(formData.entries());

        console.log("Datos del cliente:", customerData);
        console.log("Items:", cart);

        const orderData = {
            items: cart.map(item => ({
                title: item.name,
                unit_price: Number(item.price),
                quantity: Number(item.quantity),
                currency_id: "ARS",
                size: item.size || "Único",
                color: item.color || "N/A"
            })),
            payer: {
                name: customerData.firstName || "Test",
                surname: customerData.lastName || "User",
                email: customerData.email || "test_user_123456@testuser.com"
            }
        };

        try {
            const response = await fetch("admin/api/create_preference.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(orderData),
            });

            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }

            const preference = await response.json();
            
            if (preference.error) {
                throw new Error(preference.error);
            }

            if (preference.id) {
                await saveOrderToFirebase(orderData, customerData, preference.id, total);
                submitBtn.style.display = 'none';
                createCheckoutButton(preference.id);
            } else {
                throw new Error('No se recibió ID de preferencia');
            }
        } catch (error) {
            console.error("Error completo:", error);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Confirmar Datos y Pagar';
            
            await saveOrderToFirebase(orderData, customerData, 'pending-mp', total);
            alert("La orden fue registrada. El pago con MercadoPago no pudo conectarse (requiere servidor PHP en Hostinger). Error: " + error.message);
        }
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

    function renderCheckoutSummary(cart) {
        const container = document.getElementById('checkout-summary-items');
        if (!container) return;

        container.innerHTML = cart.map(item => `
            <div class="summary-item">
                <img src="${item.image}" alt="${item.name}">
                <div class="summary-item-info">
                    <h4>${item.name}</h4>
                    <span class="item-meta">
                        ${item.size !== 'N/A' ? 'Talle: ' + item.size : ''}
                        ${item.color !== 'N/A' ? ' | Color: ' + item.color : ''}
                        | Cant: ${item.quantity}
                    </span>
                </div>
                <span class="summary-item-price">$${formatPrice(item.price * item.quantity)}</span>
            </div>
        `).join('');
    }

    async function saveOrderToFirebase(orderData, customerData, preferenceId, total) {
        try {
            const billingSameAsShipping = document.getElementById('billing-same-shipping').checked;
            
            const orderDoc = {
                preferenceId: preferenceId,
                customer: {
                    firstName: customerData.firstName,
                    lastName: customerData.lastName,
                    email: customerData.email,
                    phone: customerData.phone,
                    address: customerData.address,
                    city: customerData.city,
                    zipCode: customerData.zipCode,
                    billingAddress: billingSameAsShipping ? customerData.address : (customerData.billingAddress || customerData.address)
                },
                items: orderData.items,
                subtotal: subtotal,
                shippingCost: shippingCost,
                isFreeShipping: isFreeShipping,
                total: total,
                status: 'pending',
                createdAt: new Date().toISOString(),
            };

            await addDoc(collection(db, "orders"), orderDoc);
            console.log("Orden guardada en Firebase");
        } catch (error) {
            console.error("Error al guardar orden:", error);
        }
    }

    function updateCartCount() {
        const cart = JSON.parse(localStorage.getItem('mirame_cart')) || [];
        const count = cart.reduce((acc, item) => acc + item.quantity, 0);
        const badge = document.getElementById('cart-count');
        if (badge) badge.textContent = count;
    }
    updateCartCount();
});
