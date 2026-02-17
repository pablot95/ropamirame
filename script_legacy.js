document.addEventListener('DOMContentLoaded', () => {

    const products = [
        { 
            id: 1, 
            name: "Vestido Floral de Verano", 
            price: 45000, 
            image: "images/ropa1.jpeg", 
            description: "Un vestido ligero y fresco con estampado floral, ideal para los días soleados. Fabricado en algodón orgánico.",
            category: "vestidos",
            season: "spring-summer"
        },
        { 
            id: 2, 
            name: "Blusa Elegante Beige", 
            price: 32000, 
            image: "images/ropa2.jpeg", 
            description: "Blusa de seda suave en tono beige neutro. Perfecta para la oficina o una cena casual.",
            category: "tops",
            season: "spring-summer"
        },
        { 
            id: 3, 
            name: "Conjunto Urbano Chic", 
            price: 55000, 
            image: "images/ropa3.jpeg", 
            description: "Conjunto de dos piezas moderno y cómodo. Estilo urbano con un toque sofisticado.",
            category: "conjuntos",
            season: "timeless"
        },
        { 
            id: 4, 
            name: "Chaqueta de Entretiempo", 
            price: 68000, 
            image: "images/ropa4.jpeg", 
            description: "Chaqueta ligera para esas noches frescas. Diseño atemporal con acabados dorados.",
            category: "abrigos",
            season: "timeless"
        },
        { 
            id: 5, 
            name: "Falda Plisada Dorada", 
            price: 38000, 
            image: "images/ropa5.jpeg", 
            description: "Falda midi plisada con un sutil brillo dorado. Elegancia en movimiento.",
            category: "bottoms",
            season: "timeless"
        },
        { 
            id: 6, 
            name: "Suéter Tejido Natural", 
            price: 42000, 
            image: "images/ropa6.jpeg", 
            description: "Suéter tejido a mano con fibras naturales. Calidez y estilo en una sola prenda.",
            category: "abrigos",
            season: "autumn-winter"
        },
        { 
            id: 7, 
            name: "Pantalón Palazzo Blanco", 
            price: 49000, 
            image: "images/ropa7.jpeg", 
            description: "Pantalón de corte ancho y fluido. Comodidad suprema sin sacrificar el estilo.",
            category: "bottoms",
            season: "spring-summer"
        },
        { 
            id: 8, 
            name: "Camisa Clásica Aesthetic", 
            price: 29000, 
            image: "images/ropa8.jpeg", 
            description: "La camisa blanca básica reinventada. Corte oversize para un look relajado.",
            category: "tops",
            season: "timeless"
        },
        { 
            id: 9, 
            name: "Vestido de Noche", 
            price: 85000, 
            image: "images/ropa9.jpeg", 
            description: "Vestido largo para ocasiones especiales. Sencillez y elegancia minimalista.",
            category: "vestidos",
            season: "timeless"
        },
        { 
            id: 10, 
            name: "Top de Lino", 
            price: 25000, 
            image: "images/ropa10.jpeg", 
            description: "Top fresco de lino puro. El básico perfecto para combinar con todo.",
            category: "tops",
            season: "spring-summer"
        },
        { 
            id: 11, 
            name: "Abrigo de Lana", 
            price: 120000, 
            image: "images/ropa11.jpeg", 
            description: "Abrigo estructurado de lana virgen. Una prenda de inversión para tu armario.",
            category: "abrigos",
            season: "autumn-winter"
        },
    ];

    const productGrid = document.getElementById('product-grid');
    const modal = document.getElementById('product-modal');
    const modalImg = document.getElementById('modal-img');
    const modalTitle = document.getElementById('modal-title');
    const modalPrice = document.getElementById('modal-price');
    const modalDesc = document.getElementById('modal-desc');
    const closeBtn = document.querySelector('.close-btn');
    const loadMoreBtn = document.getElementById('load-more-btn');
    const loadMoreContainer = document.getElementById('load-more-container');

    let activeCategory = 'all';
    let activeSeason = 'all';
    let currentFilteredProducts = [];
    let itemsToShow = 6;
    const ITEMS_PER_PAGE = 6;

    function renderGrid(productsList) {
        productGrid.innerHTML = '';

        if (productsList.length === 0) {
            productGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No se encontraron productos con estos filtros.</p>';
            return;
        }

        productsList.forEach(product => {
            const productCard = document.createElement('div');
            productCard.classList.add('product-card');
            productCard.setAttribute('data-id', product.id);

            productCard.innerHTML = `
                <div class="card-image-wrapper">
                    <img src="${product.image}" alt="${product.name}" class="product-image">
                    <div class="card-overlay">
                        <span class="view-details-txt">Ver Detalles</span>
                    </div>
                </div>
                <div class="product-info">
                    <h3 class="product-title">${product.name}</h3>
                    <p class="product-price">$${product.price.toFixed(2)}</p>
                </div>
            `;

            productCard.addEventListener('click', () => {
                openModal(product);
            });

            productGrid.appendChild(productCard);
        });
    }

    function updateProductView() {
        const visibleHelper = currentFilteredProducts.slice(0, itemsToShow);
        renderGrid(visibleHelper);

        if (itemsToShow >= currentFilteredProducts.length) {
            loadMoreContainer.style.display = 'none';
        } else {
            loadMoreContainer.style.display = 'block';
        }
    }

    currentFilteredProducts = products;
    updateProductView();

    loadMoreBtn.addEventListener('click', () => {
        itemsToShow += ITEMS_PER_PAGE;
        updateProductView();
    });

    const filterButtons = document.querySelectorAll('.filter-btn');

    function setActiveFilterBtn(type, value) {
        document.querySelectorAll(`.filter-btn[data-type="${type}"]`).forEach(b => {
             if (b.getAttribute('data-filter') === value) {
                 b.classList.add('active');
             } else {
                 b.classList.remove('active');
             }
        });
    }

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const filterType = btn.getAttribute('data-type');
            const filterValue = btn.getAttribute('data-filter');

            if (filterType === 'category') {
                activeCategory = filterValue;
            } else if (filterType === 'season') {
                activeSeason = filterValue;
            }

            setActiveFilterBtn(filterType, filterValue);

            applyFilters();
        });
    });

    const navFilters = document.querySelectorAll('.nav-filter');
    navFilters.forEach(link => {
        link.addEventListener('click', (e) => {
            const filterValue = link.getAttribute('data-filter');
            
            activeCategory = filterValue;
            
            setActiveFilterBtn('category', filterValue);

            applyFilters();
        });
    });

    function applyFilters() {
        currentFilteredProducts = products.filter(product => {
            const matchCategory = activeCategory === 'all' || product.category === activeCategory;
            const matchSeason = activeSeason === 'all' || product.season === activeSeason;
            return matchCategory && matchSeason;
        });

        itemsToShow = ITEMS_PER_PAGE;

        updateProductView();
    }

    function openModal(product) {
        modal.style.display = "flex";
        modalImg.src = product.image;
        modalTitle.textContent = product.name;
        modalPrice.textContent = `$${product.price.toFixed(2)}`;
        modalDesc.textContent = product.description;
        document.body.style.overflow = "hidden";
    }

    closeBtn.addEventListener('click', () => {
        closeModal();
    });

    window.addEventListener('click', (e) => {
        if (e.target == modal) {
            closeModal();
        }
    });

    function closeModal() {
        modal.style.display = "none";
        document.body.style.overflow = "auto";
    }

});
