import { db, collection, addDoc, getDocs, doc, deleteDoc, updateDoc, getDoc } from "../firebase-config.js";

const sizesConfig = {
    letters: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    numbers: ['1', '2', '3', '4', '5', '6', '7'],
    large: []
};

for (let i = 36; i <= 54; i += 2) {
    sizesConfig.large.push(i.toString());
}

const colorsConfig = [
    { name: 'celeste', hex: '#b2ebf2' },
    { name: 'negro', hex: '#000000' },
    { name: 'blanco', hex: '#ffffff' },
    { name: 'mostaza', hex: '#ffdb58' },
    { name: 'cafe', hex: '#6f4e37' },
    { name: 'natural', hex: '#fdfaf0' },
    { name: 'gris melange', hex: '#808080' },
    { name: 'verde claro', hex: '#90ee90' },
    { name: 'rosa', hex: '#ffc0cb' },
    { name: 'borravino', hex: '#800020' },
    { name: 'lavanda', hex: '#e6e6fa' },
    { name: 'verde beneton', hex: '#009e60' }
];

const productForm = document.getElementById('product-form');
const productsList = document.getElementById('products-list');
const imagePreviewContainer = document.getElementById('image-preview-container');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const formTitle = document.getElementById('form-title');

let selectedFiles = [];
let existingImages = [];

let allOrders = [];
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
    renderSizes();
    renderColors();
    loadProducts();
    
    if (sessionStorage.getItem('mirame_admin_auth') === 'true') {
        console.log('👤 Usuario ya autenticado, cargando órdenes...');
        setTimeout(() => {
            loadOrders();
            setupOrderFilters();
        }, 500);
    }
});

window.addEventListener('adminReady', () => {
    console.log('🎯 Evento adminReady recibido');
    setTimeout(() => {
        loadOrders();
        setupOrderFilters();
    }, 300);
});

function renderSizes() {
    const lettersContainer = document.getElementById('sizes-letters');
    const numbersContainer = document.getElementById('sizes-numbers');
    const largeContainer = document.getElementById('sizes-large');

    const createCheckbox = (value) => `
        <label class="size-card">
            <input type="checkbox" name="sizes" value="${value}">
            <span>${value}</span>
        </label>
    `;

    lettersContainer.innerHTML = sizesConfig.letters.map(createCheckbox).join('');
    numbersContainer.innerHTML = sizesConfig.numbers.map(createCheckbox).join('');
    largeContainer.innerHTML = sizesConfig.large.map(createCheckbox).join('');
}

function renderColors() {
    const container = document.getElementById('colors-container');
    container.innerHTML = colorsConfig.map(color => `
        <label class="color-card">
            <input type="checkbox" name="colors" value="${color.name}">
            <span class="color-circle" style="background-color: ${color.hex};"></span>
            <span class="color-name">${color.name}</span>
        </label>
    `).join('');
}

document.getElementById('images').addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    selectedFiles = selectedFiles.concat(files);
    renderImagePreviews();
    e.target.value = '';
});

function renderImagePreviews() {
    imagePreviewContainer.innerHTML = '';

    existingImages.forEach((url, index) => {
        const div = document.createElement('div');
        div.className = 'preview-item';
        div.innerHTML = `
            <img src="${url}">
            <button type="button" class="remove-img-btn" onclick="removeExistingImage(${index})">X</button>
        `;
        imagePreviewContainer.appendChild(div);
    });

    selectedFiles.forEach((file, index) => {
        const div = document.createElement('div');
        div.className = 'preview-item';
        const reader = new FileReader();
        reader.onload = (e) => {
            div.innerHTML = `
                <img src="${e.target.result}">
                <button type="button" class="remove-img-btn" onclick="removeNewImage(${index})">X</button>
            `;
        };
        reader.readAsDataURL(file);
        imagePreviewContainer.appendChild(div);
    });
}

window.removeNewImage = (index) => {
    selectedFiles.splice(index, 1);
    renderImagePreviews();
};

window.removeExistingImage = (index) => {
    existingImages.splice(index, 1);
    renderImagePreviews();
};

productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.textContent = 'Guardando...';

    try {
        const productId = document.getElementById('product-id').value;
        const isEdit = !!productId;

        const name = document.getElementById('name').value;
        const category = document.getElementById('category').value;
        const description = document.getElementById('description').value;
        const price = parseFloat(document.getElementById('price').value);
        const stock = parseInt(document.getElementById('stock').value);

        const sizes = Array.from(document.querySelectorAll('input[name="sizes"]:checked')).map(cb => cb.value);
        const colors = Array.from(document.querySelectorAll('input[name="colors"]:checked')).map(cb => cb.value);

        const newImageUrls = await Promise.all(selectedFiles.map(async (file) => {
            const formData = new FormData();
            formData.append('image', file);
            
            try {
                const response = await fetch('api/upload.php', {
                    method: 'POST',
                    body: formData
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                if (data.error) {
                    throw new Error(data.error);
                }
                return data.url;
            } catch (err) {
                console.error("Error subiendo imagen:", err);
                throw new Error("Error al subir imagen: " + file.name);
            }
        }));

        const finalImages = [...existingImages, ...newImageUrls];

        const productData = {
            name,
            category,
            description,
            price,
            stock,
            sizes,
            colors,
            images: finalImages,
            updatedAt: new Date()
        };

        if (isEdit) {
            await updateDoc(doc(db, "products", productId), productData);
            alert('Producto actualizado correctamente');
            resetForm();
        } else {
            productData.createdAt = new Date();
            await addDoc(collection(db, "products"), productData);
            alert('Producto creado correctamente');
            resetForm();
        }

        loadProducts();

    } catch (error) {
        console.error("Error al guardar:", error);
        alert("Error al guardar el producto: " + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Guardar Producto';
    }
});

async function loadProducts() {
    productsList.innerHTML = '<p>Cargando productos...</p>';
    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        productsList.innerHTML = '';
        
        querySnapshot.forEach((doc) => {
            const product = doc.data();
            const div = document.createElement('div');
            div.className = 'product-item';
            div.innerHTML = `
                <div class="product-info">
                    <img src="${product.images[0] || 'placeholder.png'}" class="product-thumb">
                    <div>
                        <strong>${product.name}</strong><br>
                        <small>${product.category} - $${product.price} - Stock: ${product.stock}</small>
                    </div>
                </div>
                <div class="action-buttons">
                    <button class="edit-btn" onclick="editProduct('${doc.id}')">Editar</button>
                    <button class="delete-btn" onclick="deleteProduct('${doc.id}')">Eliminar</button>
                </div>
            `;
            productsList.appendChild(div);
        });
    } catch (error) {
        console.error("Error loading products:", error);
    }
}

window.deleteProduct = async (id) => {
    if(!confirm('¿Estás seguro de eliminar este producto?')) return;

    try {
        await deleteDoc(doc(db, "products", id));
        loadProducts();
    } catch (error) {
        console.error("Error deleting:", error);
        alert("Error al eliminar");
    }
};

window.editProduct = async (id) => {
    try {
        const docSnap = await getDoc(doc(db, "products", id));
        if (docSnap.exists()) {
            const data = docSnap.data();
            
            document.getElementById('product-id').value = id;
            document.getElementById('name').value = data.name;
            document.getElementById('category').value = data.category;
            document.getElementById('description').value = data.description;
            document.getElementById('price').value = data.price;
            document.getElementById('stock').value = data.stock;

            document.querySelectorAll('input[name="sizes"]').forEach(cb => {
                cb.checked = data.sizes.includes(cb.value);
            });

            document.querySelectorAll('input[name="colors"]').forEach(cb => {
                cb.checked = data.colors.includes(cb.value);
            });

            existingImages = data.images || [];
            selectedFiles = [];
            renderImagePreviews();

            submitBtn.textContent = 'Actualizar Producto';
            cancelBtn.style.display = 'inline-block';
            formTitle.textContent = 'Editar Producto';

            document.querySelector('.admin-section').scrollIntoView({ behavior: 'smooth' });

        } else {
            console.log("No such document!");
        }
    } catch (error) {
        console.error("Error getting product:", error);
    }
};

cancelBtn.addEventListener('click', resetForm);

function resetForm() {
    productForm.reset();
    document.getElementById('product-id').value = '';
    existingImages = [];
    selectedFiles = [];
    renderImagePreviews();
    
    submitBtn.textContent = 'Guardar Producto';
    cancelBtn.style.display = 'none';
    formTitle.textContent = 'Agregar Nuevo Producto';
}

const migrateBtn = document.getElementById('migrate-btn');
if (migrateBtn) {
    migrateBtn.addEventListener('click', async () => {
    const btn = document.getElementById('migrate-btn');
    const log = document.getElementById('migration-log');
    
    if(!confirm("¿Estás seguro de iniciar la migración? Esto descargará las imágenes de Firebase y las subirá a tu servidor Hostinger.")) return;

    btn.disabled = true;
    log.innerHTML = "Iniciando migración...<br>";

    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        let total = querySnapshot.size;
        let processed = 0;

        for (const docSnap of querySnapshot.docs) {
            const product = docSnap.data();
            const productId = docSnap.id;
            let needsUpdate = false;
            let newImages = [];
            
            log.innerHTML += `Procesando: ${product.name}... <br>`;

            if (product.images && product.images.length > 0) {
                for (const imgUrl of product.images) {
                    if (imgUrl.includes('firebasestorage.googleapis.com')) {
                        try {
                            log.innerHTML += ` -> Enviando URL al servidor para migración...<br>`;
                            
                            const formData = new FormData();
                            formData.append('imageUrl', imgUrl);

                            const uploadRes = await fetch('api/upload.php', {
                                method: 'POST',
                                body: formData
                            });

                            const uploadData = await uploadRes.json();
                            if(uploadData.error) throw new Error(uploadData.error);
                            
                            log.innerHTML += ` -> Subida a Hostinger OK: ${uploadData.url}<br>`;
                            newImages.push(uploadData.url);
                            needsUpdate = true;

                        } catch (err) {
                            console.error("Error migrando imagen:", err);
                            log.innerHTML += `<span style="color:red"> -> Error: ${err.message}</span><br>`;
                            newImages.push(imgUrl);
                        }
                    } else {
                        newImages.push(imgUrl);
                    }
                }
            }

            if (needsUpdate) {
                await updateDoc(doc(db, "products", productId), { images: newImages });
                log.innerHTML += `<span style="color:green"> -> ¡Producto actualizado en base de datos!</span><br>`;
            } else {
                log.innerHTML += ` -> No requiere cambios.<br>`;
            }
            
            processed++;
            log.scrollTop = log.scrollHeight;
        }
        
        log.innerHTML += "<strong>--- Migración completada ---</strong>";

    } catch (error) {
        console.error("Error general de migración:", error);
        log.innerHTML += `<span style="color:red">Error crítico: ${error.message}</span>`;
    } finally {
        btn.disabled = false;
    }
    });
}

async function loadOrders() {
    console.log('🔄 Cargando órdenes...');
    try {
        const ordersSnapshot = await getDocs(collection(db, "orders"));
        allOrders = [];
        
        ordersSnapshot.forEach((doc) => {
            allOrders.push({
                id: doc.id,
                ...doc.data()
            });
        });

        console.log(`✅ ${allOrders.length} órdenes cargadas:`, allOrders);

        allOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        renderOrders();
    } catch (error) {
        console.error("❌ Error al cargar órdenes:", error);
    }
}

function setupOrderFilters() {
    const filterAll = document.getElementById('filter-all');
    const filterPending = document.getElementById('filter-pending');
    const filterApproved = document.getElementById('filter-approved');

    if (!filterAll || !filterPending || !filterApproved) {
        console.log('Botones de filtro no encontrados, se configurarán después del login');
        return;
    }

    filterAll.addEventListener('click', () => {
        setActiveFilter('all');
    });
    
    filterPending.addEventListener('click', () => {
        setActiveFilter('pending');
    });
    
    filterApproved.addEventListener('click', () => {
        setActiveFilter('approved');
    });
}

function setActiveFilter(filter) {
    currentFilter = filter;
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`filter-${filter}`).classList.add('active');
    
    renderOrders();
}

function renderOrders() {
    const ordersList = document.getElementById('orders-list');
    
    if (!ordersList) {
        console.error('❌ Elemento orders-list no encontrado en el DOM');
        return;
    }
    
    console.log(`📦 Renderizando ${allOrders.length} órdenes totales`);
    console.log(`🔍 Filtro actual: ${currentFilter}`);
    
    let filteredOrders = allOrders;
    if (currentFilter !== 'all') {
        filteredOrders = allOrders.filter(order => order.status === currentFilter);
    }
    
    console.log(`📋 ${filteredOrders.length} órdenes después de filtrar`);
    
    if (filteredOrders.length === 0) {
        ordersList.innerHTML = '<p style="text-align: center; color: #666;">No hay órdenes para mostrar</p>';
        return;
    }
    
    ordersList.innerHTML = filteredOrders.map(order => `
        <div class="order-card" data-order-id="${order.id}">
            <div class="order-header">
                <div>
                    <strong>Orden #${order.id.substring(0, 8)}</strong>
                    <span class="order-status order-status-${order.status}">${getStatusText(order.status)}</span>
                </div>
                <span class="order-date">${formatDate(order.createdAt)}</span>
            </div>
            
            <div class="order-customer">
                <h4>Cliente:</h4>
                <p><strong>Nombre: ${order.customer.firstName} ${order.customer.lastName}</strong></p>
                <p>📧 Email: ${order.customer.email}</p>
                <p>📱 Teléfono: ${order.customer.phone || 'No especificado'}</p>
                <p>📍 Dirección de envío: ${order.customer.address}, ${order.customer.city} (CP: ${order.customer.zipCode})</p>
                ${order.customer.billingAddress && order.customer.billingAddress !== order.customer.address ? 
                    `<p>💳 Dirección de facturación: ${order.customer.billingAddress}</p>` : ''}
            </div>
                
                <div class="order-items">
                <h4>Productos:</h4>
                ${order.items.map(item => `
                    <div class="order-item">
                        <span>
                            ${item.title} x${item.quantity}
                            ${item.size ? `<br><small style="color: #666;">Talle: ${item.size}</small>` : ''}
                            ${item.color ? `<small style="color: #666;"> | Color: ${item.color}</small>` : ''}
                        </span>
                        <span>$${formatPrice(item.unit_price * item.quantity)}</span>
                    </div>
                `).join('')}
            </div>
            
            <div class="order-total">
                <strong>Total: $${formatPrice(order.total)}</strong>
            </div>
            
            <div class="order-actions">
                <select class="order-status-select" data-order-id="${order.id}">
                    <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pendiente</option>
                    <option value="approved" ${order.status === 'approved' ? 'selected' : ''}>Aprobada</option>
                    <option value="rejected" ${order.status === 'rejected' ? 'selected' : ''}>Rechazada</option>
                    <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completada</option>
                </select>
                <button class="btn-delete-order" data-order-id="${order.id}">Eliminar</button>
            </div>
        </div>
    `).join('');
    
    document.querySelectorAll('.order-status-select').forEach(select => {
        select.addEventListener('change', async (e) => {
            const orderId = e.target.dataset.orderId;
            const newStatus = e.target.value;
            await updateOrderStatus(orderId, newStatus);
        });
    });
    
    document.querySelectorAll('.btn-delete-order').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const orderId = e.target.dataset.orderId;
            if (confirm('¿Estás seguro de eliminar esta orden?')) {
                await deleteOrder(orderId);
            }
        });
    });
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        await updateDoc(doc(db, "orders", orderId), {
            status: newStatus
        });
        
        const order = allOrders.find(o => o.id === orderId);
        if (order) {
            order.status = newStatus;
        }
        
        renderOrders();
        alert('Estado actualizado correctamente');
    } catch (error) {
        console.error("Error al actualizar estado:", error);
        alert('Error al actualizar el estado');
    }
}

async function deleteOrder(orderId) {
    try {
        await deleteDoc(doc(db, "orders", orderId));
        allOrders = allOrders.filter(o => o.id !== orderId);
        renderOrders();
        alert('Orden eliminada correctamente');
    } catch (error) {
        console.error("Error al eliminar orden:", error);
        alert('Error al eliminar la orden');
    }
}

function getStatusText(status) {
    const statusMap = {
        pending: 'Pendiente',
        approved: 'Aprobada',
        rejected: 'Rechazada',
        completed: 'Completada'
    };
    return statusMap[status] || status;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatPrice(price) {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
