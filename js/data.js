// ==================== Supabase Initialization ====================
// Use a different name to avoid conflict with global 'supabase' from CDN
const supabaseClient = (typeof getSupabase === 'function') ? getSupabase() : null;

// ==================== Global Data Containers ====================
// Use window.* to ensure these are globally accessible across all scripts
window.productsData = window.productsData || [];
window.ordersData = window.ordersData || [];

// Also create local references for convenience
let productsData = window.productsData;
let ordersData = window.ordersData;

// ==================== Default Categories ====================
// These are used as fallback if database is empty or unavailable
// ID values match the form select options in products.html
const defaultCategories = [
    { id: 'ebook', title: 'Ebook', slug: 'ebook', icon: '📚', description: 'Koleksi ebook digital berkualitas' },
    { id: 'kelas', title: 'Kelas Digital', slug: 'kelas-digital', icon: '🎓', description: 'Kelas online dan kursus digital' },
    { id: 'video', title: 'Video Animasi', slug: 'video-animasi', icon: '🎬', description: 'Video animasi dan konten multimedia' },
    { id: 'template', title: 'Template', slug: 'template', icon: '📝', description: 'Template desain dan dokumen' },
    { id: 'software', title: 'Software & Plugin', slug: 'software-plugin', icon: '💻', description: 'Software, tools, dan plugin' },
    { id: 'audio', title: 'Audio & Musik', slug: 'audio-musik', icon: '🎵', description: 'Audio, musik, dan sound effect' }
];

// Initialize categoriesData with defaults immediately (will be updated when DB data loads)
window.categoriesData = window.categoriesData || defaultCategories;
let categoriesData = window.categoriesData;

// ==================== Helper: Slugify ====================
function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start
        .replace(/-+$/, '');            // Trim - from end
}

// ==================== Data Fetching Functions ====================
async function fetchProducts() {
    if (!supabaseClient) {
        console.warn('Supabase client not available for fetching products');
        return [];
    }
    try {
        console.log('Fetching products from Supabase...');
        const { data, error } = await supabaseClient
            .from('products')
            .select('*')
            .order('id', { ascending: true });

        if (error) throw error;

        console.log('Products fetched:', data?.length || 0);
        // Map snake_case database columns to camelCase for frontend
        // Also generate slug from title for SEO-friendly URLs
        return (data || []).map(p => ({
            ...p,
            categoryLabel: p.category_label,
            originalPrice: p.original_price,
            slug: p.slug || slugify(p.title) // Use existing slug or generate from title
        }));
    } catch (err) {
        console.error('Error fetching products:', err);
        return [];
    }
}

async function fetchCategories() {
    if (!supabaseClient) {
        console.warn('Supabase client not available for fetching categories');
        return [];
    }
    try {
        console.log('Fetching categories from Supabase...');
        const { data, error } = await supabaseClient
            .from('categories')
            .select('*');

        if (error) throw error;
        console.log('Categories fetched:', data?.length || 0);
        return data || [];
    } catch (err) {
        console.error('Error fetching categories:', err);
        return [];
    }
}

async function initData() {
    console.log('Initializing data from Supabase...');
    try {
        const [products, categories] = await Promise.all([
            fetchProducts(),
            fetchCategories()
        ]);

        // Assign to global variables for backward compatibility
        const mappedProducts = products.map(p => ({
            ...p,
            id: p.id // Ensure ID is preserved
        }));

        // Use default categories if database returns empty
        const finalCategories = (categories && categories.length > 0) ? categories : defaultCategories;

        // Update both local and window references
        productsData = mappedProducts;
        categoriesData = finalCategories;
        window.productsData = mappedProducts;
        window.categoriesData = finalCategories;

        console.log('Data loaded:', { products: productsData.length, categories: categoriesData.length });

        // Dispatch event so main.js knows to re-render
        document.dispatchEvent(new CustomEvent('dataReady'));

    } catch (error) {
        console.error('Failed to init data:', error);
        // Use default categories on error
        categoriesData = defaultCategories;
        window.categoriesData = defaultCategories;
        document.dispatchEvent(new CustomEvent('dataReady'));
    }
}

// Start fetching immediately
initData();

// ==================== Site Settings ====================
let siteSettings = {
    siteName: "CartLink.id",
    tagline: "Platform Produk Digital #1 di Indonesia",
    email: "support@cartlink.id",
    phone: "+62 812-3456-7890",
    whatsapp: "6281234567890",
    address: "Jakarta, Indonesia",
    socialMedia: {
        facebook: "#",
        instagram: "#",
        twitter: "#",
        youtube: "#",
        tiktok: "#"
    }
};

// ==================== Helper Functions ====================
function formatPrice(price) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(price);
}

function generateOrderId() {
    return 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

async function saveOrder(order) {
    ordersData.push(order); // Local update

    if (supabaseClient) {
        try {
            const dbOrder = {
                id: order.orderId,
                customer_info: order.customer,
                items: order.items,
                total: order.total,
                payment_method: order.paymentMethod,
                status: 'pending'
            };

            const { error } = await supabaseClient.from('orders').insert([dbOrder]);
            if (error) throw error;
            console.log('Order saved to Supabase');
        } catch (err) {
            console.error('Failed to save order to Supabase:', err);
            // Fallback to localStorage if needed
            const localOrders = JSON.parse(localStorage.getItem('orders')) || [];
            localOrders.push(order);
            localStorage.setItem('orders', JSON.stringify(localOrders));
        }
    }
}

function getProducts(filters = {}) {
    let filtered = [...productsData];

    if (filters.category) {
        filtered = filtered.filter(p => p.category === filters.category);
    }

    if (filters.featured) {
        filtered = filtered.filter(p => p.featured);
    }

    if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filtered = filtered.filter(p =>
            p.title.toLowerCase().includes(searchLower) ||
            p.description.toLowerCase().includes(searchLower) ||
            p.categoryLabel.toLowerCase().includes(searchLower)
        );
    }

    if (filters.sort) {
        switch (filters.sort) {
            case 'price-low':
                filtered.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                filtered.sort((a, b) => b.price - a.price);
                break;
            case 'rating':
                filtered.sort((a, b) => b.rating - a.rating);
                break;
            case 'newest':
                filtered.sort((a, b) => b.id - a.id);
                break;
        }
    }

    if (filters.limit) {
        filtered = filtered.slice(0, filters.limit);
    }

    return filtered;
}

function getProductById(id) {
    return productsData.find(p => p.id === parseInt(id));
}

// Get product by slug
function getProductBySlug(slug) {
    return productsData.find(p => p.slug === slug);
}

function isInCart(productId) {
    const cart = getCart();
    return cart.some(item => item.id === parseInt(productId));
}

// ==================== Render Functions ====================
function renderProductCard(product) {
    const badgeHtml = product.badge
        ? `<span class="product-badge">${product.badge}</span>`
        : '';

    // Use query param for product detail (works on static hosting)
    const productSlug = product.slug || slugify(product.title);
    const productUrl = `product-detail?slug=${productSlug}`;

    return `
        <div class="product-card" data-id="${product.id}" data-slug="${product.slug}" onclick="window.location.href='${productUrl}'" style="cursor: pointer;">
            <div class="product-image">
                <img src="${product.image}" alt="${product.title}" onerror="this.src='https://via.placeholder.com/400x300?text=Image'">
                ${badgeHtml}
                <button class="product-wishlist" onclick="event.stopPropagation(); toggleWishlist(${product.id})">
                    <i class="far fa-heart"></i>
                </button>
            </div>
            <div class="product-content">
                <span class="product-category">${product.categoryLabel}</span>
                <h3 class="product-title">
                    <a href="${productUrl}" onclick="event.stopPropagation()">${product.title}</a>
                </h3>
                <div class="product-rating">
                    <i class="fas fa-star"></i>
                    <span>${product.rating} (${product.reviews} ulasan)</span>
                </div>
                <div class="product-footer">
                    <div class="product-price">
                        ${formatPrice(product.price)}
                        ${product.originalPrice > product.price ? `<span class="original">${formatPrice(product.originalPrice)}</span>` : ''}
                    </div>
                    <div class="product-actions" style="display: flex; gap: 0.5rem;" onclick="event.stopPropagation()">
                        ${isInCart(product.id) ? `
                            <button class="btn btn-sm btn-primary" onclick="removeFromCart(${product.id}); showNotification('Produk dihapus dari keranjang', 'info'); if(typeof renderCart === 'function') renderCart(); this.closest('.product-grid')?.querySelectorAll('.product-card[data-id=\'${product.id}\']').forEach(c => { const btn = c.querySelector('.product-actions .btn-primary'); if(btn) { btn.className = 'btn btn-sm btn-outline'; btn.innerHTML = '<i class=\'fas fa-cart-plus\'></i>'; btn.onclick = function(e) { e.stopPropagation(); addToCart(${product.id}, 1); showNotification(\'Produk ditambahkan ke keranjang\', \'success\'); location.reload(); }; } }); location.reload();" title="Hapus dari Keranjang">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : `
                            <button class="btn btn-sm btn-outline" onclick="addToCart(${product.id}, 1); showNotification('Produk berhasil ditambahkan ke keranjang!', 'success'); location.reload();" title="Tambah ke Keranjang">
                                <i class="fas fa-cart-plus"></i>
                            </button>
                        `}
                        <a href="javascript:void(0)" onclick="buyNow(${product.id})" class="product-btn" title="Beli Sekarang">
                            <i class="fas fa-shopping-cart"></i>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderProducts(containerId, products) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (products.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>Produk Tidak Ditemukan</h3>
                <p>Coba gunakan kata kunci lain atau lihat semua produk</p>
            </div>
        `;
        return;
    }

    container.innerHTML = products.map(p => renderProductCard(p)).join('');
}

// ==================== Wishlist Functions ====================
function toggleWishlist(productId) {
    let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    const index = wishlist.indexOf(productId);

    if (index > -1) {
        wishlist.splice(index, 1);
    } else {
        wishlist.push(productId);
    }

    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    updateWishlistUI();
}

function updateWishlistUI() {
    const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    document.querySelectorAll('.product-wishlist').forEach(btn => {
        const card = btn.closest('.product-card');
        if (card) {
            const productId = parseInt(card.dataset.id);
            const icon = btn.querySelector('i');
            if (wishlist.includes(productId)) {
                icon.classList.remove('far');
                icon.classList.add('fas');
                btn.style.background = 'var(--danger)';
            } else {
                icon.classList.remove('fas');
                icon.classList.add('far');
                btn.style.background = 'rgba(255, 255, 255, 0.1)';
            }
        }
    });
}

// ==================== Cart Functions ====================
function getCart() {
    return JSON.parse(localStorage.getItem('cart')) || [];
}

function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCounter();
}

function addToCart(productId, quantity = 1) {
    const cart = getCart();
    const product = getProductById(productId);

    if (!product) return;

    const existingIndex = cart.findIndex(item => item.id === productId);

    if (existingIndex > -1) {
        cart[existingIndex].quantity += quantity;
    } else {
        cart.push({
            id: product.id,
            title: product.title,
            price: product.price,
            image: product.image,
            categoryLabel: product.categoryLabel,
            quantity: quantity
        });
    }

    saveCart(cart);
}

function updateCartQuantity(productId, quantity) {
    let cart = getCart();
    const index = cart.findIndex(item => item.id === productId);

    if (index > -1) {
        if (quantity <= 0) {
            cart.splice(index, 1);
        } else {
            cart[index].quantity = quantity;
        }
        saveCart(cart);
    }
}

function removeFromCart(productId) {
    let cart = getCart();
    cart = cart.filter(item => item.id !== productId);
    saveCart(cart);
}

function clearCart() {
    saveCart([]);
}

function getCartTotal() {
    const cart = getCart();
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

function getCartCount() {
    const cart = getCart();
    return cart.reduce((count, item) => count + item.quantity, 0);
}

function updateCartCounter() {
    const counters = document.querySelectorAll('.cart-counter');
    const count = getCartCount();

    counters.forEach(counter => {
        counter.textContent = count;
        if (count > 0) {
            counter.classList.add('active');
        } else {
            counter.classList.remove('active');
        }
    });
}
