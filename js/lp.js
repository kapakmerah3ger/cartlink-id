/**
 * LP.js - Landing Page Interactivity
 * Handles accordion toggles, sticky CTA, and social proof popups
 */

document.addEventListener('DOMContentLoaded', function () {
    // Initialize Accordions (Features)
    initFeatureAccordions();

    // Initialize FAQ Accordions
    initFAQAccordions();

    // Initialize Sticky CTA
    initStickyCTA();

    // Initialize Social Proof
    initSocialProof();

    // Smooth Scroll for Anchor Links
    initSmoothScroll();

    // Initialize Order Form
    initOrderForm();
});

/**
 * Feature Accordions
 */
function initFeatureAccordions() {
    const accordions = document.querySelectorAll('.lp-feature-accordion');

    accordions.forEach(accordion => {
        const header = accordion.querySelector('.lp-feature-header');

        if (header) {
            header.addEventListener('click', () => {
                // Close other accordions (optional - comment out for independent operation)
                // accordions.forEach(acc => {
                //     if (acc !== accordion) acc.classList.remove('active');
                // });

                accordion.classList.toggle('active');
            });
        }
    });
}

/**
 * FAQ Accordions
 */
function initFAQAccordions() {
    const faqItems = document.querySelectorAll('.lp-faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.lp-faq-question');

        if (question) {
            question.addEventListener('click', () => {
                // Close other FAQs
                faqItems.forEach(faq => {
                    if (faq !== item) faq.classList.remove('active');
                });

                item.classList.toggle('active');
            });
        }
    });
}

/**
 * Sticky CTA Button
 */
function initStickyCTA() {
    const stickyCTA = document.querySelector('.lp-sticky-cta');
    if (!stickyCTA) return;

    const showThreshold = 400; // pixels scrolled before showing

    window.addEventListener('scroll', () => {
        if (window.scrollY > showThreshold) {
            stickyCTA.classList.add('visible');
        } else {
            stickyCTA.classList.remove('visible');
        }
    });
}

/**
 * Social Proof Popup
 */
function initSocialProof() {
    const socialProof = document.querySelector('.lp-social-proof');
    if (!socialProof) return;

    const textEl = socialProof.querySelector('.lp-social-proof-text');
    const timeEl = socialProof.querySelector('.lp-social-proof-time');

    // Sample data - can be replaced with actual data
    const proofData = [
        { name: 'Andi', location: 'Jakarta', product: 'Lisensi Personal', time: '2 Menit yang lalu' },
        { name: 'Budi', location: 'Surabaya', product: 'Lisensi Personal', time: '5 Menit yang lalu' },
        { name: 'Citra', location: 'Bandung', product: 'Lisensi Developer', time: '8 Menit yang lalu' },
        { name: 'Dewi', location: 'Semarang', product: 'Lisensi Personal', time: '12 Menit yang lalu' },
        { name: 'Eko', location: 'Medan', product: 'Lisensi Personal', time: '15 Menit yang lalu' },
        { name: 'Fitri', location: 'Yogyakarta', product: 'Lisensi Developer', time: '18 Menit yang lalu' },
        { name: 'Gunawan', location: 'Makassar', product: 'Lisensi Personal', time: '23 Menit yang lalu' },
        { name: 'Hana', location: 'Bali', product: 'Lisensi Personal', time: '25 Menit yang lalu' },
    ];

    let currentIndex = 0;

    function showProof() {
        const proof = proofData[currentIndex];

        if (textEl) {
            textEl.textContent = `${proof.name} dari ${proof.location} membeli ${proof.product}`;
        }
        if (timeEl) {
            timeEl.textContent = proof.time;
        }

        socialProof.classList.add('visible');

        // Hide after 4 seconds
        setTimeout(() => {
            socialProof.classList.remove('visible');
        }, 4000);

        // Move to next proof
        currentIndex = (currentIndex + 1) % proofData.length;
    }

    // Show first proof after 3 seconds
    setTimeout(showProof, 3000);

    // Then show every 8 seconds
    setInterval(showProof, 8000);
}

/**
 * Smooth Scroll for Anchor Links
 */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

/**
 * Order Form
 */
function initOrderForm() {
    const form = document.getElementById('lp-order-form');
    if (!form) return;

    const packageOptions = document.querySelectorAll('.lp-package-option');
    const summaryProduct = document.getElementById('summary-product');
    const summaryTotal = document.getElementById('summary-total');

    // Product/Package Data
    const packages = {
        personal: {
            name: 'PRIME - Lisensi Personal',
            price: 179000,
            priceFormatted: 'Rp 179.000'
        },
        developer: {
            name: 'PRIME - Lisensi Developer',
            price: 249000,
            priceFormatted: 'Rp 249.000'
        }
    };

    let selectedPackage = 'personal';

    // Update summary when package changes
    function updateSummary() {
        const pkg = packages[selectedPackage];
        if (summaryProduct) summaryProduct.textContent = pkg.name;
        if (summaryTotal) summaryTotal.textContent = pkg.priceFormatted;
    }

    // Package selection
    packageOptions.forEach(option => {
        option.addEventListener('click', function () {
            const input = this.querySelector('input[type="radio"]');
            if (input) {
                input.checked = true;
                selectedPackage = input.value;

                // Update visual state
                packageOptions.forEach(opt => opt.classList.remove('selected'));
                this.classList.add('selected');

                // Update summary
                updateSummary();
            }
        });
    });

    // Form submission
    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const name = document.getElementById('lp-name').value.trim();
        const email = document.getElementById('lp-email').value.trim();
        const phone = document.getElementById('lp-phone').value.trim();

        // Validation
        if (!name || !email || !phone) {
            lpShowNotification('Mohon lengkapi semua data yang diperlukan', 'error');
            return;
        }

        if (!isValidEmail(email)) {
            lpShowNotification('Format email tidak valid', 'error');
            return;
        }

        if (!isValidPhone(phone)) {
            lpShowNotification('Format nomor telepon tidak valid', 'error');
            return;
        }

        const pkg = packages[selectedPackage];

        // Prepare order data
        const orderData = {
            orderId: 'LP-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase(),
            productId: selectedPackage,
            productTitle: pkg.name,
            totalPrice: pkg.price,
            customer: {
                name: name,
                email: email,
                phone: phone
            }
        };

        // Disable button and show loading
        const submitBtn = document.getElementById('lp-pay-button');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';

        try {
            // Check if Midtrans functions are available
            if (typeof processPaymentWithMidtrans === 'function') {
                await processPaymentWithMidtrans(
                    orderData,
                    // onSuccess
                    function (result) {
                        lpShowNotification('Pembayaran berhasil! Cek email Anda untuk akses.', 'success');
                        form.reset();
                        updateSummary();
                    },
                    // onPending
                    function (result) {
                        lpShowNotification('Silakan selesaikan pembayaran Anda.', 'info');
                    },
                    // onError
                    function (result) {
                        lpShowNotification('Pembayaran gagal. Silakan coba lagi.', 'error');
                    }
                );
            } else {
                // Fallback if Midtrans not configured
                lpShowNotification('Sistem pembayaran sedang dalam maintenance. Silakan hubungi admin.', 'warning');
                console.log('Order data prepared:', orderData);
            }
        } catch (error) {
            console.error('Payment error:', error);
            lpShowNotification('Terjadi kesalahan. Silakan coba lagi.', 'error');
        } finally {
            // Re-enable button
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });
}

/**
 * Validation Helpers
 */
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
    // Indonesian phone number format
    return /^(08|\+628|628)[0-9]{8,12}$/.test(phone.replace(/[\s\-]/g, ''));
}

/**
 * LP-specific Notification (fallback for showNotification)
 */
function lpShowNotification(message, type = 'info') {
    // Try global showNotification first
    if (typeof showNotification === 'function') {
        showNotification(message, type);
        return;
    }

    // LP-specific notification
    const notification = document.getElementById('lp-notification');
    if (!notification) {
        alert(message);
        return;
    }

    notification.textContent = message;
    notification.className = 'lp-notification visible ' + type;

    setTimeout(() => {
        notification.classList.remove('visible');
    }, 4000);
}
