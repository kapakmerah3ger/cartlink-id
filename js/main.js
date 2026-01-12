// ==================== DOM Ready ====================
document.addEventListener('DOMContentLoaded', function () {
    initNavbar();
    initMobileMenu();
    initAnimations();
    loadDynamicPageContent();

    // Initialize components that depend on data
    if (typeof productsData !== 'undefined' && productsData.length > 0) {
        initializeAppLogic();
    } else {
        document.addEventListener('dataReady', initializeAppLogic);
        // Fallback: if dataReady never fires (e.g. error), we might want to show error state
        // but initData in data.js logs errors.
    }
});

function initializeAppLogic() {
    console.log('Initializing app logic with data...');
    loadFeaturedProducts();
    updateWishlistUI();
    updateCartCounter();
    renderCategories(); // For categories.html

    // Page Specific Initializations
    if (document.getElementById('products-grid')) {
        // We are on products.html or similar
        initProductFilters();
    }

    if (document.getElementById('product-detail')) {
        // We are on product-detail.html
        // Note: initProductDetail might be called by inline script too, 
        // but it has checks. We call it here to ensure it runs after data is ready.
        initProductDetail();
        updateDetailWishlist();
    }

    if (document.getElementById('cart-container')) {
        // We are on cart.html
        if (typeof renderCart === 'function') renderCart();
    }

    if (document.getElementById('checkout-form')) {
        // We are on checkout.html
        if (typeof initCheckout === 'function') initCheckout();
    }

    // Customer Dashboard specific
    if (window.location.pathname.includes('customer/dashboard')) {
        // logic for dashboard if any special
    }
}

function loadDynamicPageContent() {
    // Determine current page ID
    const path = window.location.pathname;
    const page = path.split('/').pop().replace('.html', '') || 'home';

    // Map of pages that are editable
    const editablePages = ['home', 'about', 'terms', 'privacy', 'help', 'contact', 'index'];

    let pageId = page;
    if (page === 'index') pageId = 'home';
    if (page === 'help-center') pageId = 'help';

    if (editablePages.includes(pageId)) {
        const savedContent = localStorage.getItem('page_' + pageId);
        if (savedContent) {
            // Find a suitable container to inject content
            // This is a bit heuristic as each page has different structure
            const container = document.querySelector('.dynamic-content') || document.querySelector('section.section .container');
            if (container && pageId !== 'home') { // Don't overwrite home completely as it has complex layout
                container.innerHTML = savedContent;
            }
        }
    }
}

// ==================== Navbar ====================
function initNavbar() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    window.addEventListener('scroll', function () {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    updateNavbarAuth();
}

function updateNavbarAuth() {
    const navActions = document.querySelector('.nav-actions');
    if (!navActions) return;

    // Check if user is logged in
    const user = JSON.parse(localStorage.getItem('cartlink_user_session'));
    const adminBtn = navActions.querySelector('button[onclick*="admin/login"]');

    // Determine path prefix based on current location
    const isInsideFolder = window.location.pathname.includes('/admin/') || window.location.pathname.includes('/customer/') || window.location.pathname.includes('/pages/');
    const prefix = isInsideFolder ? '../' : '';

    if (adminBtn) {
        adminBtn.onclick = () => window.location.href = prefix + 'admin/login';
    }

    if (user) {
        // Replace admin button with account button if logged in as customer
        if (adminBtn) {
            const accountBtn = document.createElement('button');
            accountBtn.className = 'btn btn-primary btn-sm';
            accountBtn.innerHTML = `<i class="fas fa-user-circle"></i> Akun`;
            accountBtn.onclick = () => window.location.href = prefix + 'customer/dashboard';
            adminBtn.parentNode.replaceChild(accountBtn, adminBtn);
        }
    } else {
        // Add Login button if not logged in
        if (adminBtn && !navActions.querySelector('.btn-login-trigger')) {
            const loginBtn = document.createElement('button');
            loginBtn.className = 'btn btn-outline btn-sm btn-login-trigger';
            loginBtn.style.marginRight = '0.5rem';
            loginBtn.innerHTML = `<i class="fas fa-sign-in-alt"></i> Masuk`;
            loginBtn.onclick = () => window.location.href = prefix + 'customer/login';
            navActions.insertBefore(loginBtn, adminBtn);
        }
    }
}

// ==================== Mobile Menu ====================
function initMobileMenu() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');

    if (!hamburger || !navMenu) return;

    hamburger.addEventListener('click', function () {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close menu when clicking on a link
    navMenu.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function () {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', function (e) {
        if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        }
    });
}

// ==================== Animations ====================
function initAnimations() {
    // Counter animation
    const counters = document.querySelectorAll('[data-count]');

    const observerOptions = {
        threshold: 0.5
    };

    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseInt(entry.target.dataset.count);
                animateCounter(entry.target, target);
                counterObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    counters.forEach(counter => counterObserver.observe(counter));

    // Fade in animations
    const fadeElements = document.querySelectorAll('.category-card, .product-card, .feature-card, .testimonial-card');

    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                fadeObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    fadeElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        fadeObserver.observe(el);
    });
}

function animateCounter(element, target) {
    let current = 0;
    const increment = target / 50;
    const duration = 2000;
    const stepTime = duration / 50;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target.toLocaleString();
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current).toLocaleString();
        }
    }, stepTime);
}

// ==================== Featured Products ====================
function loadFeaturedProducts() {
    const container = document.getElementById('featured-products');
    if (!container) return;

    const featuredProducts = getProducts({ featured: true, limit: 8 });
    renderProducts('featured-products', featuredProducts);

    // Re-apply animations after products load
    setTimeout(() => {
        updateWishlistUI();

        const productCards = container.querySelectorAll('.product-card');
        productCards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';

            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }, 100);
}

// ==================== Products Page Functions ====================
function loadAllProducts(filters = {}) {
    const container = document.getElementById('products-container');
    if (!container) return;

    const products = getProducts(filters);
    renderProducts('products-container', products);
    updateWishlistUI();
    initProductAnimations();
}

function initProductAnimations() {
    const container = document.getElementById('products-container');
    if (!container) return;

    const productCards = container.querySelectorAll('.product-card');
    productCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';

        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 50);
    });
}

// ==================== Product Filters ====================
function initProductFilters() {
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    const sortFilter = document.getElementById('sort-filter');

    // Populate categories dynamic
    if (categoryFilter) {
        const currentVal = categoryFilter.value;
        categoryFilter.innerHTML = '<option value="">Semua Kategori</option>' +
            categoriesData.map(cat => `<option value="${cat.id}">${cat.title}</option>`).join('');
        categoryFilter.value = currentVal;
    }

    const applyFilters = () => {
        const filters = {
            search: searchInput?.value || '',
            category: categoryFilter?.value || '',
            sort: sortFilter?.value || ''
        };
        loadAllProducts(filters);
    };

    searchInput?.addEventListener('input', debounce(applyFilters, 300));
    categoryFilter?.addEventListener('change', applyFilters);
    sortFilter?.addEventListener('change', applyFilters);

    // Check URL params for initial category filter
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    if (category && categoryFilter) {
        categoryFilter.value = category;
    }

    applyFilters();
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ==================== Checkout Functions ====================
// ==================== Checkout Functions ====================
function initCheckout() {
    const urlParams = new URLSearchParams(window.location.search);
    const fromCart = urlParams.get('from') === 'cart';

    // Pre-fill user data if logged in
    const user = JSON.parse(localStorage.getItem('cartlink_user_session'));
    if (user) {
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const whatsappInput = document.getElementById('whatsapp');

        if (nameInput) nameInput.value = user.name;
        if (emailInput) {
            emailInput.value = user.email;
            emailInput.readOnly = true;
            emailInput.style.opacity = '0.7';
        }
        if (whatsappInput) whatsappInput.value = user.whatsapp || '';

        // Add note about account
        const form = document.querySelector('.checkout-form');
        if (form) {
            const note = document.createElement('p');
            note.style.fontSize = '0.85rem';
            note.style.color = '#818cf8';
            note.style.marginBottom = '1.5rem';
            note.innerHTML = `<i class="fas fa-info-circle"></i> Pesanan ini akan otomatis ditambahkan ke akun <strong>${user.email}</strong> Anda.`;
            form.insertBefore(note, form.querySelector('form'));
        }
    }

    if (fromCart) {
        const cart = getCart();
        if (cart.length === 0) {
            window.location.href = 'products';
            return;
        }
        displayCartCheckout(cart);
        initCartCheckoutForm(cart);
    } else {
        const productId = urlParams.get('id');
        const quantity = parseInt(urlParams.get('qty')) || 1;

        if (!productId) {
            window.location.href = 'products';
            return;
        }

        const product = getProductById(productId);
        if (!product) {
            window.location.href = 'products';
            return;
        }

        // Store for later use
        window.checkoutProduct = product;
        window.checkoutQuantity = quantity;

        displayCheckoutProduct(product, quantity);
        initCheckoutForm(product, quantity);
    }
}

function displayCartCheckout(cart) {
    const container = document.getElementById('checkout-product');
    if (!container) return;

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    container.innerHTML = `
        <div class="checkout-summary">
            <h4>Ringkasan Pesanan</h4>
            <div class="checkout-cart-items" style="margin-bottom: 1.5rem;">
                ${cart.map(item => `
                    <div class="cart-summary-item" style="display: flex; justify-content: space-between; margin-bottom: 0.75rem; font-size: 0.875rem;">
                        <span style="color: var(--gray-300);">${item.title} (x${item.quantity})</span>
                        <span style="font-weight: 600;">${formatPrice(item.price * item.quantity)}</span>
                    </div>
                `).join('')}
            </div>
            <div class="summary-row total">
                <span>Total</span>
                <span>${formatPrice(total)}</span>
            </div>
        </div>
    `;
}

function initCartCheckoutForm(cart) {
    const form = document.getElementById('checkout-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const formData = new FormData(form);
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        const orderData = {
            orderId: generateOrderId(),
            items: cart,
            totalPrice: total,
            customer: {
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                whatsapp: formData.get('whatsapp') || formData.get('phone')
            },
            paymentMethod: formData.get('payment'),
            notes: formData.get('notes'),
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        saveOrder(orderData);

        // Grant access if logged in
        if (typeof addPurchasedProduct === 'function') {
            orderData.items.forEach(item => {
                addPurchasedProduct(item.id);
            });
        }

        clearCart(); // Clear cart after successful order
        showOrderSuccess(orderData);
    });
}

function displayCheckoutProduct(product, quantity = 1) {
    const container = document.getElementById('checkout-product');
    if (!container) return;

    const subtotal = product.price * quantity;
    const originalTotal = product.originalPrice * quantity;
    const discount = originalTotal - subtotal;

    container.innerHTML = `
        <div class="checkout-product-card">
            <div class="checkout-product-image">
                <img src="${product.image}" alt="${product.title}" onerror="this.src='https://via.placeholder.com/400x300?text=Image'">
            </div>
            <div class="checkout-product-info">
                <span class="checkout-product-category">${product.categoryLabel}</span>
                <h3 class="checkout-product-title">${product.title}</h3>
                <p class="checkout-product-desc">${product.description}</p>
                <div class="checkout-product-rating">
                    <i class="fas fa-star"></i>
                    <span>${product.rating} (${product.reviews} ulasan)</span>
                </div>
            </div>
        </div>
        <div class="checkout-quantity-section">
            <h4><i class="fas fa-shopping-bag"></i> Jumlah Pesanan</h4>
            <div class="checkout-quantity-controls">
                <button type="button" class="qty-btn" onclick="changeCheckoutQuantity(-1)">
                    <i class="fas fa-minus"></i>
                </button>
                <input type="number" id="checkout-quantity" value="${quantity}" min="1" max="99" onchange="validateCheckoutQuantity(this)">
                <button type="button" class="qty-btn" onclick="changeCheckoutQuantity(1)">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
            <div class="price-per-unit">@ ${formatPrice(product.price)}/item</div>
        </div>
        <div class="checkout-summary">
            <h4>Ringkasan Pesanan</h4>
            <div class="summary-row">
                <span>Harga Produk (${quantity}x)</span>
                <span id="summary-original">${formatPrice(originalTotal)}</span>
            </div>
            <div class="summary-row discount">
                <span>Diskon</span>
                <span id="summary-discount">-${formatPrice(discount)}</span>
            </div>
            <div class="summary-row total">
                <span>Total</span>
                <span id="summary-total">${formatPrice(subtotal)}</span>
            </div>
        </div>
    `;
}

function initCheckoutForm(product, quantity = 1) {
    const form = document.getElementById('checkout-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const currentQty = parseInt(document.getElementById('checkout-quantity')?.value) || quantity;
        const totalPrice = product.price * currentQty;

        const formData = new FormData(form);
        const orderData = {
            orderId: generateOrderId(),
            productId: product.id,
            productTitle: product.title,
            quantity: currentQty,
            pricePerUnit: product.price,
            productPrice: totalPrice, // For backward compatibility with simpler table
            totalPrice: totalPrice,
            customer: {
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                whatsapp: formData.get('whatsapp') || formData.get('phone')
            },
            paymentMethod: formData.get('payment'),
            notes: formData.get('notes'),
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        saveOrder(orderData);

        // Grant access if logged in
        if (typeof addPurchasedProduct === 'function') {
            addPurchasedProduct(product.id);
        }

        showOrderSuccess(orderData);
    });
}

// Checkout quantity functions
function changeCheckoutQuantity(delta) {
    const input = document.getElementById('checkout-quantity');
    if (!input) return;

    let value = parseInt(input.value) || 1;
    value += delta;

    if (value < 1) value = 1;
    if (value > 99) value = 99;

    input.value = value;
    window.checkoutQuantity = value;
    updateCheckoutSummary();
}

function validateCheckoutQuantity(input) {
    let value = parseInt(input.value) || 1;

    if (value < 1) value = 1;
    if (value > 99) value = 99;

    input.value = value;
    window.checkoutQuantity = value;
    updateCheckoutSummary();
}

function updateCheckoutSummary() {
    const product = window.checkoutProduct;
    const quantity = window.checkoutQuantity || 1;

    if (!product) return;

    const subtotal = product.price * quantity;
    const originalTotal = product.originalPrice * quantity;
    const discount = originalTotal - subtotal;

    const summaryOriginal = document.getElementById('summary-original');
    const summaryDiscount = document.getElementById('summary-discount');
    const summaryTotal = document.getElementById('summary-total');
    const priceLabel = document.querySelector('.summary-row:first-child span:first-child');

    if (summaryOriginal) summaryOriginal.textContent = formatPrice(originalTotal);
    if (summaryDiscount) summaryDiscount.textContent = '-' + formatPrice(discount);
    if (summaryTotal) summaryTotal.textContent = formatPrice(subtotal);
    if (priceLabel) priceLabel.textContent = `Harga Produk (${quantity}x)`;
}

function showOrderSuccess(order) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';

    const productDisplay = order.items
        ? `${order.items.length} Produk`
        : order.productTitle;

    const totalDisplay = order.totalPrice || order.productPrice;

    const user = JSON.parse(localStorage.getItem('cartlink_user_session'));
    const loginPrompt = !user ? `
        <div class="guest-access-notice" style="margin-top: 1.5rem; padding: 1.25rem; background: rgba(99, 102, 241, 0.1); border-radius: 12px; border: 1px solid rgba(99, 102, 241, 0.2); text-align: left;">
            <h4 style="color: #818cf8; margin-bottom: 0.5rem;"><i class="fas fa-unlock-alt"></i> Akses Produk Instan?</h4>
            <p style="font-size: 0.85rem; color: var(--gray-400); margin-bottom: 1rem;">Daftar akun sekarang menggunakan email <strong>${order.customer.email}</strong> untuk mendapatkan akses langsung ke produk digital Anda setelah pembayaran dikonfirmasi.</p>
            <a href="customer/register?email=${encodeURIComponent(order.customer.email)}" class="btn btn-outline btn-sm" style="width: 100%;">Buat Akun Sekarang</a>
        </div>
    ` : '';

    modal.innerHTML = `
        <div class="modal success-modal">
            <div class="success-icon">
                <i class="fas fa-check-circle"></i>
            </div>
            <h2>Pesanan Berhasil!</h2>
            <p>Terima kasih atas pesanan Anda</p>
            <div class="order-details">
                <div class="order-detail-row">
                    <span>No. Pesanan</span>
                    <strong>${order.orderId}</strong>
                </div>
                <div class="order-detail-row">
                    <span>Produk</span>
                    <strong>${productDisplay}</strong>
                </div>
                <div class="order-detail-row">
                    <span>Total</span>
                    <strong>${formatPrice(totalDisplay)}</strong>
                </div>
            </div>
            ${loginPrompt}
            <p class="order-instruction" style="margin-top: 1.5rem;">Silakan lakukan pembayaran sesuai metode yang dipilih. Kami akan menghubungi Anda via WhatsApp untuk konfirmasi.</p>
            <div class="modal-buttons">
                <a href="index" class="btn btn-primary">Kembali ke Beranda</a>
                <a href="https://wa.me/${siteSettings.whatsapp}?text=Halo, saya sudah melakukan order dengan ID: ${order.orderId}" class="btn btn-success" target="_blank">
                    <i class="fab fa-whatsapp"></i> Konfirmasi via WhatsApp
                </a>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
}

// ==================== Product Detail Functions ====================
function initProductDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        displayProductNotFound();
        return;
    }

    // Ensure data is ready. If called before data load, retry shortly (though DOMContentLoaded usually handles this)
    if (!productsData || productsData.length === 0) {
        console.warn('Products data not ready, retrying...');
        setTimeout(initProductDetail, 100);
        return;
    }

    const product = getProductById(productId);
    if (!product) {
        console.error('Product not found:', productId);
        displayProductNotFound();
        return;
    }

    displayProductDetail(product);
    loadRelatedProducts(product.category, product.id);
}

function displayProductNotFound() {
    const container = document.getElementById('product-detail');
    if (container) {
        container.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 4rem 2rem;">
                <i class="fas fa-exclamation-circle" style="font-size: 3rem; color: var(--gray-400); margin-bottom: 1rem;"></i>
                <h3 style="color: white; margin-bottom: 0.5rem;">Produk Tidak Ditemukan</h3>
                <p style="color: var(--gray-400); margin-bottom: 2rem;">Maaf, produk yang Anda cari tidak tersedia atau ID tidak valid.</p>
                <a href="products" class="btn btn-primary">Lihat Semua Produk</a>
            </div>
        `;
    }
}

function displayProductDetail(product) {
    const container = document.getElementById('product-detail');
    if (!container) return;

    const badgeHtml = product.badge
        ? `<span class="detail-badge">${product.badge}</span>`
        : '';

    const discount = Math.round((1 - product.price / product.originalPrice) * 100);

    container.innerHTML = `
        <div class="detail-gallery">
            <div class="main-image">
                <img src="${product.image}" alt="${product.title}" onerror="this.src='https://via.placeholder.com/600x450?text=Image'">
                ${badgeHtml}
            </div>
        </div>
        <div class="detail-info">
            <span class="detail-category">${product.categoryLabel}</span>
            <h1 class="detail-title">${product.title}</h1>
            <div class="detail-rating">
                <div class="stars">
                    ${generateStars(product.rating)}
                </div>
                <span class="rating-text">${product.rating} (${product.reviews} ulasan)</span>
            </div>
            <div class="detail-price">
                <span class="current-price">${formatPrice(product.price)}</span>
                <span class="original-price">${formatPrice(product.originalPrice)}</span>
                <span class="discount-badge">-${discount}%</span>
            </div>
            <div class="detail-description">
                <h3>Deskripsi Produk</h3>
                <p>${product.description}</p>
            </div>
            <div class="detail-features">
                <div class="feature-item">
                    <i class="fas fa-download"></i>
                    <span>Akses Instan</span>
                </div>
                <div class="feature-item">
                    <i class="fas fa-infinity"></i>
                    <span>Akses Selamanya</span>
                </div>
                <div class="feature-item">
                    <i class="fas fa-sync"></i>
                    <span>Update Gratis</span>
                </div>
                <div class="feature-item">
                    <i class="fas fa-headset"></i>
                    <span>Support 24/7</span>
                </div>
            </div>
            <div class="quantity-selector">
                <label>Jumlah:</label>
                <div class="quantity-controls">
                    <button type="button" class="qty-btn" onclick="changeQuantity(-1)">
                        <i class="fas fa-minus"></i>
                    </button>
                    <input type="number" id="product-quantity" value="1" min="1" max="99" onchange="validateQuantity(this)">
                    <button type="button" class="qty-btn" onclick="changeQuantity(1)">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <div class="quantity-total">
                    Total: <strong id="total-price">${formatPrice(product.price)}</strong>
                </div>
            </div>
            <div class="detail-actions">
                ${isInCart(product.id) ? `
                    <button onclick="removeFromCart(${product.id}); showNotification('Produk dihapus dari keranjang', 'info'); location.reload();" class="btn btn-primary btn-lg">
                        <i class="fas fa-check"></i> Sudah di Keranjang
                    </button>
                ` : `
                    <button onclick="addToCart(${product.id}, parseInt(document.getElementById('product-quantity').value)); showNotification('Produk berhasil ditambahkan ke keranjang!', 'success'); location.reload();" class="btn btn-outline btn-lg">
                        <i class="fas fa-cart-plus"></i> Tambah ke Keranjang
                    </button>
                `}
                <a href="javascript:void(0)" onclick="buyNow(${product.id})" class="btn btn-primary btn-lg">
                    <i class="fas fa-shopping-cart"></i> Beli Sekarang
                </a>
                <button class="btn btn-outline btn-lg product-wishlist-detail" onclick="toggleWishlist(${product.id}); updateDetailWishlist();">
                    <i class="far fa-heart"></i> <span>Wishlist</span>
                </button>
            </div>
        </div>
    `;

    // Update page title
    document.title = `${product.title} - CartLink.id`;

    // Store product price for quantity calculations
    window.currentProductPrice = product.price;
    updateDetailWishlist();
}

function updateDetailWishlist() {
    const productId = new URLSearchParams(window.location.search).get('id');
    if (!productId) return;

    const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    const btn = document.querySelector('.product-wishlist-detail');
    if (!btn) return;

    const icon = btn.querySelector('i');
    const text = btn.querySelector('span');

    if (wishlist.includes(parseInt(productId))) {
        icon.classList.remove('far');
        icon.classList.add('fas');
        text.textContent = 'Di Wishlist';
        btn.classList.add('active');
    } else {
        icon.classList.remove('fas');
        icon.classList.add('far');
        text.textContent = 'Wishlist';
        btn.classList.remove('active');
    }
}

function generateStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<i class="fas fa-star"></i>';
        } else if (i - 0.5 <= rating) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        } else {
            stars += '<i class="far fa-star"></i>';
        }
    }
    return stars;
}

function loadRelatedProducts(category, excludeId) {
    const container = document.getElementById('related-products');
    if (!container) return;

    let relatedProducts = getProducts({ category: category, limit: 4 });
    relatedProducts = relatedProducts.filter(p => p.id !== parseInt(excludeId));

    if (relatedProducts.length === 0) {
        relatedProducts = getProducts({ limit: 4 });
        relatedProducts = relatedProducts.filter(p => p.id !== parseInt(excludeId));
    }

    renderProducts('related-products', relatedProducts.slice(0, 4));
    updateWishlistUI();
}

function updateDetailWishlist() {
    const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get('id'));

    const btn = document.querySelector('.detail-actions .btn-outline');
    if (btn) {
        const icon = btn.querySelector('i');
        if (wishlist.includes(productId)) {
            icon.classList.remove('far');
            icon.classList.add('fas');
            btn.innerHTML = '<i class="fas fa-heart"></i> Di Wishlist';
        } else {
            icon.classList.remove('fas');
            icon.classList.add('far');
            btn.innerHTML = '<i class="far fa-heart"></i> Wishlist';
        }
    }
}

// ==================== Contact Form ====================
function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const formData = new FormData(form);
        const message = {
            name: formData.get('name'),
            email: formData.get('email'),
            subject: formData.get('subject'),
            message: formData.get('message'),
            createdAt: new Date().toISOString()
        };

        // Save to localStorage (in real app, send to server)
        let messages = JSON.parse(localStorage.getItem('contactMessages')) || [];
        messages.push(message);
        localStorage.setItem('contactMessages', JSON.stringify(messages));

        // Show success message
        showNotification('Pesan berhasil dikirim! Kami akan segera menghubungi Anda.', 'success');
        form.reset();
    });
}

// ==================== Notifications ====================
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 100);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// ==================== Smooth Scroll ====================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// ==================== Quantity Selector Functions ====================
function changeQuantity(delta) {
    const input = document.getElementById('product-quantity');
    if (!input) return;

    let value = parseInt(input.value) || 1;
    value += delta;

    if (value < 1) value = 1;
    if (value > 99) value = 99;

    input.value = value;
    updateTotalPrice();
}

function validateQuantity(input) {
    let value = parseInt(input.value) || 1;

    if (value < 1) value = 1;
    if (value > 99) value = 99;

    input.value = value;
    updateTotalPrice();
}

function updateTotalPrice() {
    const quantity = parseInt(document.getElementById('product-quantity')?.value) || 1;
    const totalPriceEl = document.getElementById('total-price');

    if (totalPriceEl && window.currentProductPrice) {
        const total = window.currentProductPrice * quantity;
        totalPriceEl.textContent = formatPrice(total);
    }
}

function buyNow(productId) {
    const qtyInput = document.getElementById('product-quantity');
    const quantity = qtyInput ? parseInt(qtyInput.value) : 1;

    // Check if we are in a subdirectory
    const isInsideFolder = window.location.pathname.includes('/admin/') || window.location.pathname.includes('/customer/') || window.location.pathname.includes('/pages/');
    const prefix = isInsideFolder ? '../' : '';

    window.location.href = `${prefix}checkout?id=${productId}&qty=${quantity}`;
}
function renderCategories() {
    const container = document.getElementById('categories-container');
    if (!container) return;

    if (categoriesData.length === 0) {
        container.innerHTML = '<p>Belum ada kategori.</p>';
        return;
    }

    container.innerHTML = categoriesData.map(cat => `
        <a href="products?category=${cat.id}" class="category-card">
            <div class="category-icon"><i class="fas ${cat.icon}"></i></div>
            <h3>${cat.title}</h3>
            <p>${cat.description}</p>
            <span class="category-count">${cat.count || ''}</span>
        </a>
    `).join('');
}
