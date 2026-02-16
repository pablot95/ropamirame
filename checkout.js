import { db, collection, addDoc } from "./firebase-config.js";

document.addEventListener('DOMContentLoaded', () => {
    // --- Configuración MercadoPago ---
    const mp = new MercadoPago('APP_USR-0105d511-0e85-4b9f-b131-ae47ad7210a6', {
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

        // Preparar datos para el backend
        const orderData = {
            items: cart.map(item => ({
                title: item.name,
                unit_price: Number(item.price),
                quantity: Number(item.quantity),
                currency_id: "ARS"
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

            const preference = await response.json();
            
            if (preference.id) {
                // Guardar orden en Firebase antes de mostrar el botón
                await saveOrderToFirebase(orderData, customerData, preference.id, total);
                createCheckoutButton(preference.id);
            } else {
                alert("Error al crear la preferencia de pago");
            }
        } catch (error) {
            alert("Error al crear la preferencia de pago: " + error);
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

    async function saveOrderToFirebase(orderData, customerData, preferenceId, total) {
        try {
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
                },
                items: orderData.items,
                total: total,
                status: 'pending', // pending, approved, rejected
                createdAt: new Date().toISOString(),
            };

            await addDoc(collection(db, "orders"), orderDoc);
            console.log("Orden guardada en Firebase");
        } catch (error) {
            console.error("Error al guardar orden:", error);
        }
    }
});
