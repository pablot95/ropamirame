import { db, storage, collection, addDoc, getDocs, doc, deleteDoc, updateDoc, getDoc, ref, uploadBytes, getDownloadURL, deleteObject } from "../firebase-config.js";

// --- Configuración y Datos Estáticos ---
const sizesConfig = {
    letters: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    numbers: ['1', '2', '3', '4', '5', '6', '7'],
    large: [] // Generated dynamically below 36-54
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

// --- Elementos del DOM ---
const productForm = document.getElementById('product-form');
const productsList = document.getElementById('products-list');
const imagePreviewContainer = document.getElementById('image-preview-container');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const formTitle = document.getElementById('form-title');

let selectedFiles = []; // Array files nuevos
let existingImages = []; // Array urls existentes (modo edición)

// --- Inicialización ---
document.addEventListener('DOMContentLoaded', () => {
    renderSizes();
    renderColors();
    loadProducts();
});

// --- Renderizado de UI ---
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

// --- Manejo de Imágenes ---
document.getElementById('images').addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    selectedFiles = selectedFiles.concat(files);
    renderImagePreviews();
    // Limpiamos el input para permitir seleccionar la misma imagen nuevamente si fuera necesario
    // y manejamos nuestro propio array de archivos
    e.target.value = ''; 
});

function renderImagePreviews() {
    imagePreviewContainer.innerHTML = '';

    // Renderizar imágenes existentes (Edición)
    existingImages.forEach((url, index) => {
        const div = document.createElement('div');
        div.className = 'preview-item';
        div.innerHTML = `
            <img src="${url}">
            <button type="button" class="remove-img-btn" onclick="removeExistingImage(${index})">X</button>
        `;
        imagePreviewContainer.appendChild(div);
    });

    // Renderizar nuevas imágenes seleccionadas
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

// --- CRUD ---

// 1. Crear / Editar
productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.textContent = 'Guardando...';

    try {
        const productId = document.getElementById('product-id').value;
        const isEdit = !!productId;

        // Recolectar datos
        const name = document.getElementById('name').value;
        const category = document.getElementById('category').value;
        const description = document.getElementById('description').value;
        const price = parseFloat(document.getElementById('price').value);
        const stock = parseInt(document.getElementById('stock').value);

        const sizes = Array.from(document.querySelectorAll('input[name="sizes"]:checked')).map(cb => cb.value);
        const colors = Array.from(document.querySelectorAll('input[name="colors"]:checked')).map(cb => cb.value);

        // Subir nuevas imágenes
        const newImageUrls = await Promise.all(selectedFiles.map(async (file) => {
            const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            return await getDownloadURL(snapshot.ref);
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
            resetForm(); // Resetear solo al crear, al editar se resetea por el botón cancelar
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

// 2. Leer
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

// 3. Eliminar
window.deleteProduct = async (id) => {
    if(!confirm('¿Estás seguro de eliminar este producto?')) return;

    try {
        // Opcional: Eliminar imágenes de Storage (requeriría lógica extra para rastrear refs)
        // Por simplicidad en MVP, solo eliminamos el documento
        await deleteDoc(doc(db, "products", id));
        loadProducts();
    } catch (error) {
        console.error("Error deleting:", error);
        alert("Error al eliminar");
    }
};

// 4. Preparar Edición
window.editProduct = async (id) => {
    try {
        const docSnap = await getDoc(doc(db, "products", id));
        if (docSnap.exists()) {
            const data = docSnap.data();
            
            // Llenar campos
            document.getElementById('product-id').value = id;
            document.getElementById('name').value = data.name;
            document.getElementById('category').value = data.category;
            document.getElementById('description').value = data.description;
            document.getElementById('price').value = data.price;
            document.getElementById('stock').value = data.stock;

            // Checkboxes Talles
            document.querySelectorAll('input[name="sizes"]').forEach(cb => {
                cb.checked = data.sizes.includes(cb.value);
            });

            // Checkboxes Colores
            document.querySelectorAll('input[name="colors"]').forEach(cb => {
                cb.checked = data.colors.includes(cb.value);
            });

            // Imágenes con manejo de estado
            existingImages = data.images || [];
            selectedFiles = []; // Limpiar nuevos archivos
            renderImagePreviews();

            // Cambiar UI a modo edición
            submitBtn.textContent = 'Actualizar Producto';
            cancelBtn.style.display = 'inline-block';
            formTitle.textContent = 'Editar Producto';

            // Scroll al form
            document.querySelector('.admin-section').scrollIntoView({ behavior: 'smooth' });

        } else {
            console.log("No such document!");
        }
    } catch (error) {
        console.error("Error getting product:", error);
    }
};

// Cancelar Edición
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
