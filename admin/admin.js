// ==================== Admin Authentication ====================
// Use existing Supabase Client (defined in data.js or supabase-config.js)
// This avoids re-declaring the const which would cause an error
const adminSupabase = window._supabaseClient || ((typeof getSupabase === 'function') ? getSupabase() : null);

// ==================== Safe Data Access Helpers ====================
// These ensure we always access the window.* versions of the data arrays
function getProductsData() {
    return window.productsData || [];
}

function getCategoriesData() {
    return window.categoriesData || [];
}

function getOrdersData() {
    return window.ordersData || [];
}

// Format price helper 
function formatPrice(price) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(price || 0);
}

function checkAuth() {
    if (localStorage.getItem('adminLoggedIn') !== 'true') {
        window.location.href = '/admin/login';
        return false;
    }

    const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
    const adminName = document.getElementById('admin-name');
    if (adminName) {
        adminName.textContent = adminUser.name || 'Admin';
    }
    return true;
}

function logout() {
    if (confirm('Apakah Anda yakin ingin keluar?')) {
        localStorage.removeItem('adminLoggedIn');
        localStorage.removeItem('adminUser');
        window.location.href = '/admin/login';
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('active');
}

function initSidebar() {
    // Initial setup if needed, or mobile handling
    const sidebar = document.getElementById('sidebar');
    const toggleBtns = document.querySelectorAll('.sidebar-toggle');

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function (e) {
        if (window.innerWidth < 1024 && sidebar && sidebar.classList.contains('active')) {
            let isClickInside = sidebar.contains(e.target);
            let isToggle = false;

            toggleBtns.forEach(btn => {
                if (btn.contains(e.target)) isToggle = true;
            });

            if (!isClickInside && !isToggle) {
                sidebar.classList.remove('active');
            }
        }
    });
}

// ==================== Dashboard Functions ====================
async function loadDashboardStats() {
    console.log('Loading dashboard stats...');
    try {
        // 1. Products Count
        // Use productsData from memory if available (since it's loaded by initData)
        // Fallback to direct DB count if empty (maybe initData didn't finish)
        let productCount = getProductsData().length;
        if (productCount === 0 && adminSupabase) {
            const { count } = await adminSupabase.from('products').select('*', { count: 'exact', head: true });
            productCount = count || 0;
        }
        const prodEl = document.getElementById('total-products');
        if (prodEl) prodEl.textContent = productCount;

        // 2. Orders Info (Fetch from DB)
        if (!adminSupabase) return;

        const { data: orders, error } = await adminSupabase
            .from('orders')
            .select('*');

        if (error) throw error;

        const orderCount = orders ? orders.length : 0;
        const totalRevenue = (orders || []).reduce((sum, order) => sum + (Number(order.total) || 0), 0);
        const pendingOrders = (orders || []).filter(order => order.status === 'pending').length;

        const ordEl = document.getElementById('total-orders');
        const revEl = document.getElementById('total-revenue');
        const pendEl = document.getElementById('pending-orders');

        if (ordEl) ordEl.textContent = orderCount;
        if (revEl) revEl.textContent = formatPrice(totalRevenue);
        if (pendEl) pendEl.textContent = pendingOrders;

        console.log('Stats loaded:', { productCount, orderCount, totalRevenue });

    } catch (err) {
        console.error('Error loading stats:', err);
    }
}

async function loadRecentOrders() {
    const tbody = document.getElementById('recent-orders');
    if (!tbody) return;

    if (!adminSupabase) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center">Database unavailable</td></tr>`;
        return;
    }

    try {
        const { data: orders, error } = await adminSupabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10); // Last 10

        if (error) throw error;

        if (!orders || orders.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center;padding:2rem;color:var(--gray-500)">
                        Belum ada pesanan
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = orders.map(order => {
            const items = order.items || [];
            const productDisplay = items.length
                ? (items.length > 1 ? `${items.length} Produk` : (items[0]?.title || 'Produk'))
                : '-';

            const totalQty = items.reduce((s, i) => s + (i.quantity || 1), 0);

            // Access customer info safely
            const customerName = order.customer_info ? (order.customer_info.name || '-') : '-';

            return `
                <tr>
                    <td><strong>${order.id.substring(0, 8)}...</strong></td>
                    <td>${customerName}</td>
                    <td>${productDisplay}</td>
                    <td>${totalQty}x</td>
                    <td>${formatPrice(order.total)}</td>
                    <td><span class="status-badge ${order.status}">${getStatusLabel(order.status)}</span></td>
                    <td>${new Date(order.created_at).toLocaleDateString()}</td>
                </tr>
            `;
        }).join('');

    } catch (err) {
        console.error('Error loading recent orders:', err);
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Gagal memuat: ${err.message}</td></tr>`;
    }
}

function getStatusLabel(status) {
    const labels = {
        'pending': 'Menunggu',
        'paid': 'Dibayar',
        'completed': 'Selesai',
        'cancelled': 'Dibatalkan'
    };
    return labels[status] || status;
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ==================== Products Management ====================
async function loadAdminProducts() {
    const container = document.getElementById('products-table-body');
    if (!container) return;

    // First try to get products from window cache
    let products = getProductsData();

    // If empty, try fetching directly from Supabase
    if (products.length === 0 && adminSupabase) {
        console.log('Products cache empty, fetching from Supabase directly...');
        try {
            const { data, error } = await adminSupabase
                .from('products')
                .select('*')
                .order('id', { ascending: true });

            if (error) throw error;

            // Map to expected format
            products = (data || []).map(p => ({
                ...p,
                categoryLabel: p.category_label || getCategoryLabel(p.category),
                originalPrice: p.original_price
            }));

            // Update global cache
            window.productsData = products;
            console.log('Loaded', products.length, 'products from Supabase');
        } catch (err) {
            console.error('Error fetching products:', err);
        }
    }

    if (products.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:2rem;color:var(--gray-500)">
                    Belum ada produk
                </td>
            </tr>
        `;
        return;
    }

    container.innerHTML = products.map(product => `
        <tr>
            <td>${product.id}</td>
            <td>
                <div class="table-product">
                    <div class="table-product-img"><img src="${product.image}" alt="${product.title}" onerror="this.src='https://via.placeholder.com/50'"></div>
                    <div class="table-product-info">
                        <h4>${product.title}${product.badge ? ` <span class="product-badge-small">${product.badge}</span>` : ''}</h4>
                        <span>${product.categoryLabel || product.category_label || product.category}</span>
                    </div>
                </div>
            </td>
            <td>${product.categoryLabel || product.category_label || product.category}</td>
            <td>${formatPrice(product.price)}</td>
            <td>${product.rating ? `<span style="color:var(--warning)">★</span> ${product.rating}` : '-'}${product.reviews ? ` (${product.reviews})` : ''}</td>
            <td><span class="status-badge ${product.featured ? 'featured' : 'active'}">${product.featured ? 'Featured' : 'Aktif'}</span></td>
            <td>
                <div class="table-actions">
                    <button class="table-btn edit" onclick="editProduct(${product.id})"><i class="fas fa-edit"></i></button>
                    <button class="table-btn delete" onclick="deleteProduct(${product.id})"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');

    // Update product count
    const countEl = document.getElementById('product-count');
    if (countEl) {
        countEl.textContent = products.length + ' produk';
    }
}

function openProductModal(productId = null) {
    const modal = document.getElementById('product-modal');
    const title = document.getElementById('modal-title');
    const form = document.getElementById('product-form');

    if (!modal) {
        console.error('Product modal not found');
        return;
    }

    // Reset image upload state first
    const uploadPlaceholder = document.getElementById('upload-placeholder');
    const uploadPreview = document.getElementById('upload-preview');
    const urlPreview = document.getElementById('url-preview');
    const imageData = document.getElementById('product-image-data');
    const imageFile = document.getElementById('product-image-file');
    const imageUrlInput = document.getElementById('product-image');

    if (uploadPlaceholder) uploadPlaceholder.style.display = 'block';
    if (uploadPreview) uploadPreview.style.display = 'none';
    if (urlPreview) urlPreview.style.display = 'none';
    if (imageData) imageData.value = '';
    if (imageFile) imageFile.value = '';
    if (imageUrlInput) imageUrlInput.value = '';

    // Switch to upload tab by default
    if (typeof switchImageTab === 'function') switchImageTab('upload');

    // ALWAYS populate categories first (from getCategoriesData or window.categoriesData)
    const categorySelect = document.getElementById('product-category');
    const categories = getCategoriesData();
    console.log('Populating categories:', categories.length, 'items');
    if (categorySelect && categories.length > 0) {
        categorySelect.innerHTML = '<option value="">Pilih Kategori</option>' +
            categories.map(cat => `<option value="${cat.id}">${cat.title}</option>`).join('');
    }

    if (productId) {
        const product = getProductsData().find(p => p.id === parseInt(productId));
        if (product) {
            title.textContent = 'Edit Produk';
            document.getElementById('product-id').value = product.id;
            document.getElementById('product-title').value = product.title;
            document.getElementById('product-category').value = product.category;
            document.getElementById('product-price').value = product.price;
            document.getElementById('product-original-price').value = product.originalPrice || product.original_price || '';
            document.getElementById('product-description').value = product.description;
            document.getElementById('product-featured').checked = product.featured;

            // Populate rating, reviews, badge fields
            const ratingField = document.getElementById('product-rating');
            const reviewsField = document.getElementById('product-reviews');
            const badgeField = document.getElementById('product-badge');
            if (ratingField) ratingField.value = product.rating || '';
            if (reviewsField) reviewsField.value = product.reviews || '';
            if (badgeField) badgeField.value = product.badge || '';

            // Handle image preview for editing
            if (product.image) {
                if (product.image.startsWith('data:')) {
                    // It's a base64 image
                    if (imageData) imageData.value = product.image;
                    const previewImg = document.getElementById('preview-image');
                    if (previewImg) previewImg.src = product.image;
                    if (uploadPlaceholder) uploadPlaceholder.style.display = 'none';
                    if (uploadPreview) uploadPreview.style.display = 'block';
                } else {
                    // It's a URL
                    if (typeof switchImageTab === 'function') switchImageTab('url');
                    if (imageUrlInput) imageUrlInput.value = product.image;
                    if (typeof previewUrlImage === 'function') previewUrlImage(product.image);
                }
            }
        }
    } else {
        title.textContent = 'Tambah Produk Baru';
        if (form) form.reset();
        document.getElementById('product-id').value = '';
    }

    // IMPORTANT: Add active class to show the modal
    modal.classList.add('active');
    console.log('Modal opened, active class added:', modal.classList.contains('active'));
}

function closeProductModal() {
    document.getElementById('product-modal').classList.remove('active');
}

// Make functions global
window.logout = logout;
window.toggleSidebar = toggleSidebar;
window.saveProduct = saveProduct;
window.openProductModal = openProductModal;
window.closeProductModal = closeProductModal;
window.deleteProduct = deleteProduct;
window.editProduct = editProduct;
window.switchImageTab = switchImageTab;
window.previewUrlImage = previewUrlImage;
window.handleImageUpload = handleImageUpload;
window.removeImage = removeImage;

// ==================== Save Product with Debugging ====================
async function saveProduct(e) {
    e.preventDefault();
    console.log('Save Product Triggered');

    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
    }

    const id = document.getElementById('product-id').value;
    const activeTab = document.querySelector('.image-tab.active')?.textContent.includes('Upload') ? 'upload' : 'url';

    // Get image from either upload or URL based on active tab
    let productImage = 'https://via.placeholder.com/400x300?text=No+Image';
    const imageData = document.getElementById('product-image-data')?.value;
    const imageUrl = document.getElementById('product-image')?.value;

    if (activeTab === 'upload' && imageData) {
        productImage = imageData;
    } else if (activeTab === 'url' && imageUrl) {
        productImage = imageUrl;
    } else {
        productImage = imageData || imageUrl || productImage;
    }

    const price = parseInt(document.getElementById('product-price').value) || 0;
    const originalPrice = parseInt(document.getElementById('product-original-price').value) || price;
    const rating = parseFloat(document.getElementById('product-rating')?.value) || 0;
    const reviews = parseInt(document.getElementById('product-reviews')?.value) || 0;
    const badge = document.getElementById('product-badge')?.value || '';

    const productData = {
        title: document.getElementById('product-title').value,
        category: document.getElementById('product-category').value,
        category_label: getCategoryLabel(document.getElementById('product-category').value),
        price: price,
        original_price: originalPrice,
        image: productImage,
        description: document.getElementById('product-description').value,
        rating: rating,
        reviews: reviews,
        badge: badge,
        featured: document.getElementById('product-featured').checked
    };

    console.log('Product Payload:', productData);

    try {
        if (!adminSupabase) throw new Error('Supabase client not initialized');

        if (id) {
            // Edit existing product
            console.log('Updating product ID:', id);
            const { error } = await adminSupabase
                .from('products')
                .update(productData)
                .eq('id', parseInt(id));

            if (error) throw error;
        } else {
            // Add new product
            console.log('Inserting new product');
            const { error } = await adminSupabase
                .from('products')
                .insert([productData]);

            if (error) throw error;
        }

        closeProductModal();
        alert('Produk berhasil disimpan! Halaman akan dimuat ulang.');
        window.location.reload();

    } catch (err) {
        console.error('Error saving product:', err);
        alert('Gagal menyimpan produk: ' + err.message);
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Simpan';
        }
    }
}

// Global scope binding for legacy calls (backup)
window.saveProduct = saveProduct;

function initAdminPages() {
    const path = window.location.pathname;

    if (path.includes('dashboard')) {
        loadDashboardStats();
        loadRecentOrders();
    } else if (path.includes('products')) {
        loadAdminProducts();

        // Attach form listener robustly
        const form = document.getElementById('product-form');
        if (form) {
            console.log('Attaching listener to product-form');
            form.removeEventListener('submit', saveProduct); // clean previous
            form.addEventListener('submit', saveProduct);
        } else {
            console.warn('Product form not found in DOM');
        }

    } else if (path.includes('orders')) {
        loadAdminOrders();
    } else if (path.includes('categories')) {
        if (typeof loadAdminCategories === 'function') loadAdminCategories();
    } else if (path.includes('pages')) {
        if (typeof loadPagesList === 'function') loadPagesList();
    }
}

function editProduct(id) {
    openProductModal(id);
}

async function deleteProduct(id) {
    if (confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
        try {
            const { error } = await adminSupabase
                .from('products')
                .delete()
                .eq('id', parseInt(id));

            if (error) throw error;

            alert('Produk berhasil dihapus!');
            window.location.reload();
        } catch (err) {
            console.error('Error deleting product:', err);
            alert('Gagal menghapus produk: ' + err.message);
        }
    }
}

function getCategoryLabel(categoryId) {
    const category = getCategoriesData().find(c => c.id === categoryId);
    return category ? category.title : categoryId;
}

// ==================== Orders Management ====================
async function loadAdminOrders() {
    const container = document.getElementById('orders-table-body');
    if (!container) return;

    if (!adminSupabase) {
        container.innerHTML = `<tr><td colspan="7" class="text-center p-4">Database not connected</td></tr>`;
        return;
    }

    try {
        const { data: orders, error } = await adminSupabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!orders || orders.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center;padding:2rem;color:var(--gray-500)">
                        Belum ada pesanan
                    </td>
                </tr>
            `;
            return;
        }

        container.innerHTML = orders.map(order => {
            // Map keys
            const orderId = order.id;
            const customer = order.customer_info || {};
            const items = order.items || [];
            const total = order.total;
            const status = order.status;
            const paymentMethod = order.payment_method;

            const productDisplay = items.length > 1
                ? `${items.length} Produk`
                : (items[0]?.title || '-');

            // Format WhatsApp number for link
            const waNumber = (customer.phone || '').replace(/\D/g, '');
            const waLink = waNumber ? `https://wa.me/${waNumber.startsWith('0') ? '62' + waNumber.slice(1) : waNumber}` : '#';

            return `
                <tr>
                    <td><strong>${orderId.length > 15 ? orderId.substring(0, 15) + '...' : orderId}</strong></td>
                    <td>
                        <div>
                            <strong>${customer.name || '-'}</strong><br>
                            <small style="color:var(--gray-500)">${customer.email || ''}</small>
                        </div>
                    </td>
                    <td>
                        ${customer.phone ? `<a href="${waLink}" target="_blank" style="color:#25d366;text-decoration:none;"><i class="fab fa-whatsapp"></i> ${customer.phone}</a>` : '-'}
                    </td>
                    <td>${productDisplay}</td>
                    <td>${formatPrice(total)}</td>
                    <td>${(paymentMethod || '').toUpperCase()}</td>
                    <td><span class="status-badge ${status}">${getStatusLabel(status)}</span></td>
                    <td>
                        <div class="table-actions">
                            <button class="table-btn edit" onclick="updateOrderStatus('${orderId}', '${status}')"><i class="fas fa-check"></i></button>
                            <button class="table-btn delete" onclick="deleteOrder('${orderId}')"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

    } catch (err) {
        console.error('Error loading orders:', err);
        container.innerHTML = `<tr><td colspan="7" class="text-center p-4 text-danger">Gagal memuat pesanan: ${err.message}</td></tr>`;
    }
}

async function updateOrderStatus(orderId, currentStatus) {
    if (!adminSupabase) return;

    // Toggle status logic
    let newStatus = 'pending';
    if (currentStatus === 'pending') newStatus = 'processed';
    else if (currentStatus === 'processed') newStatus = 'completed';
    else if (currentStatus === 'completed') newStatus = 'pending'; // Cycle back or stop?

    if (confirm(`Ubah status pesanan menjadi ${newStatus.toUpperCase()}?`)) {
        try {
            const { error } = await adminSupabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', orderId);

            if (error) throw error;

            alert('Status pesanan diperbarui!');
            loadAdminOrders();
        } catch (err) {
            console.error('Error updating order:', err);
            alert('Gagal memperbarui status: ' + err.message);
        }
    }
}

async function deleteOrder(orderId) {
    if (confirm('Apakah Anda yakin ingin menghapus pesanan ini?')) {
        try {
            const { error } = await adminSupabase
                .from('orders')
                .delete()
                .eq('id', orderId);

            if (error) throw error;

            alert('Pesanan berhasil dihapus!');
            loadAdminOrders();
        } catch (err) {
            console.error('Error deleting order:', err);
            alert('Gagal menghapus pesanan: ' + err.message);
        }
    }
}

// ==================== Pages Editor ====================
const pagesData = [
    { id: 'home', name: 'Beranda', icon: 'fa-home' },
    { id: 'about', name: 'Tentang', icon: 'fa-info-circle' },
    { id: 'terms', name: 'Syarat & Ketentuan', icon: 'fa-file-contract' },
    { id: 'privacy', name: 'Kebijakan Privasi', icon: 'fa-shield-alt' },
    { id: 'help', name: 'Pusat Bantuan', icon: 'fa-question-circle' },
    { id: 'contact', name: 'Kontak', icon: 'fa-envelope' }
];

let currentPage = 'home';

function loadPagesList() {
    const container = document.getElementById('pages-list');
    if (!container) return;

    container.innerHTML = pagesData.map(page => `
        <div class="page-list-item ${page.id === currentPage ? 'active' : ''}" onclick="selectPage('${page.id}')">
            <i class="fas ${page.icon}"></i>
            <span>${page.name}</span>
        </div>
    `).join('');
}

function selectPage(pageId) {
    currentPage = pageId;
    loadPagesList();
    loadPageContent(pageId);
}

function loadPageContent(pageId) {
    const savedContent = localStorage.getItem('page_' + pageId);
    const contentArea = document.getElementById('page-content-area');

    if (contentArea) {
        if (savedContent) {
            contentArea.innerHTML = savedContent;
        } else {
            contentArea.innerHTML = getDefaultPageContent(pageId);
        }
    }

    document.getElementById('current-page-name').textContent = pagesData.find(p => p.id === pageId)?.name || '';
}

function getDefaultPageContent(pageId) {
    const contents = {
        'home': '<h1>Selamat Datang di CartLink.id</h1><p>Platform terbaik untuk produk digital berkualitas.</p>',
        'about': '<h1>Tentang Kami</h1><p>CartLink.id adalah platform e-commerce produk digital terpercaya di Indonesia.</p>',
        'terms': '<h1>Syarat dan Ketentuan</h1><p>Dengan menggunakan layanan kami, Anda menyetujui syarat dan ketentuan yang berlaku.</p>',
        'privacy': '<h1>Kebijakan Privasi</h1><p>Kami berkomitmen untuk melindungi privasi dan data pribadi Anda.</p>',
        'help': '<h1>Pusat Bantuan</h1><p>Temukan jawaban untuk pertanyaan Anda di sini.</p>',
        'contact': '<h1>Hubungi Kami</h1><p>Kami siap membantu Anda. Silakan hubungi kami melalui form di bawah.</p>'
    };
    return contents[pageId] || '<p>Konten halaman</p>';
}

function savePageContent() {
    const contentArea = document.getElementById('page-content-area');
    if (contentArea) {
        localStorage.setItem('page_' + currentPage, contentArea.innerHTML);
        alert('Konten halaman berhasil disimpan!');
    }
}

function execCommand(command, value = null) {
    document.execCommand(command, false, value);
}

// ==================== Settings ====================
function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('siteSettings')) || siteSettings;

    document.getElementById('site-name').value = settings.siteName || '';
    document.getElementById('site-tagline').value = settings.tagline || '';
    document.getElementById('site-email').value = settings.email || '';
    document.getElementById('site-phone').value = settings.phone || '';
    document.getElementById('site-whatsapp').value = settings.whatsapp || '';
    document.getElementById('site-address').value = settings.address || '';
}

function saveSettings(e) {
    e.preventDefault();

    const settings = {
        siteName: document.getElementById('site-name').value,
        tagline: document.getElementById('site-tagline').value,
        email: document.getElementById('site-email').value,
        phone: document.getElementById('site-phone').value,
        whatsapp: document.getElementById('site-whatsapp').value,
        address: document.getElementById('site-address').value
    };

    localStorage.setItem('siteSettings', JSON.stringify(settings));
    siteSettings = settings;

    alert('Pengaturan berhasil disimpan!');
}

// ==================== Image Upload Functions ====================
function switchImageTab(tab) {
    const tabs = document.querySelectorAll('.image-tab');
    tabs.forEach(t => t.classList.remove('active'));

    const uploadTab = document.getElementById('upload-tab');
    const urlTab = document.getElementById('url-tab');

    if (tab === 'upload') {
        tabs[0].classList.add('active');
        uploadTab.style.display = 'block';
        urlTab.style.display = 'none';
    } else {
        tabs[1].classList.add('active');
        uploadTab.style.display = 'none';
        urlTab.style.display = 'block';
    }
}

function handleImageUpload(input) {
    const file = input.files[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran file terlalu besar. Maksimal 5MB.');
        return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
        alert('File harus berupa gambar (PNG, JPG, WEBP)');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const base64Data = e.target.result;
        document.getElementById('product-image-data').value = base64Data;
        document.getElementById('preview-image').src = base64Data;
        document.getElementById('upload-placeholder').style.display = 'none';
        document.getElementById('upload-preview').style.display = 'block';
    };
    reader.readAsDataURL(file);
}

function removeImage(event) {
    event.stopPropagation();
    document.getElementById('product-image-file').value = '';
    document.getElementById('product-image-data').value = '';
    document.getElementById('preview-image').src = '';
    document.getElementById('upload-placeholder').style.display = 'block';
    document.getElementById('upload-preview').style.display = 'none';
}

function previewUrlImage(url) {
    const previewContainer = document.getElementById('url-preview');
    const previewImg = document.getElementById('url-preview-image');

    if (url) {
        previewImg.src = url;
        previewImg.onload = function () {
            previewContainer.style.display = 'block';
        };
        previewImg.onerror = function () {
            previewContainer.style.display = 'none';
        };
    } else {
        previewContainer.style.display = 'none';
    }
}

// Initialize drag and drop
document.addEventListener('DOMContentLoaded', function () {
    const uploadArea = document.querySelector('.image-upload-area');
    if (uploadArea) {
        uploadArea.addEventListener('dragover', function (e) {
            e.preventDefault();
            this.classList.add('drag-over');
        });

        uploadArea.addEventListener('dragleave', function (e) {
            e.preventDefault();
            this.classList.remove('drag-over');
        });

        uploadArea.addEventListener('drop', function (e) {
            e.preventDefault();
            this.classList.remove('drag-over');
            const file = e.dataTransfer.files[0];
            if (file) {
                const input = document.getElementById('product-image-file');
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                input.files = dataTransfer.files;
                handleImageUpload(input);
            }
        });
    }
});

// Note: Image upload reset logic is now integrated into openProductModal function above

// ==================== Auto-Initialization ====================
document.addEventListener('DOMContentLoaded', function () {
    console.log('Admin JS Loaded (DOM Content Loaded)');

    // 1. Check Auth & Sidebar
    if (!window.location.pathname.includes('login')) {
        checkAuth();
        initSidebar();
    }

    // 2. Initialize Data-Dependent Components
    // Run Init Immediately to attach listeners (like Product Form)
    // The data loading parts inside will handle empty data gracefully
    initAdminPages();

    // 3. If data is not ready, re-run specific loaders when it is
    if (getProductsData().length === 0) {
        console.log('Data not fully ready, adding listener...');
        document.addEventListener('dataReady', () => {
            console.log('DataReady Event Fired - Refreshing Admin Pages');
            initAdminPages();
        });
    }
});
