// ==================== Midtrans Configuration ====================
// Sandbox credentials - change to production when going live
const MIDTRANS_CLIENT_KEY = 'SB-Mid-client-M3LMbydOCi1SRYXZ';
const MIDTRANS_IS_PRODUCTION = false;

// Snap URL based on environment
const MIDTRANS_SNAP_URL = MIDTRANS_IS_PRODUCTION
    ? 'https://app.midtrans.com/snap/snap.js'
    : 'https://app.sandbox.midtrans.com/snap/snap.js';

// Supabase Edge Function URL for creating Snap Token
const MIDTRANS_TOKEN_URL = `${SUPABASE_URL}/functions/v1/create-snap-token`;

// Initialize Midtrans Snap
function initMidtransSnap() {
    return new Promise((resolve, reject) => {
        // Check if already loaded
        if (window.snap) {
            resolve(window.snap);
            return;
        }

        // Create script element
        const script = document.createElement('script');
        script.src = MIDTRANS_SNAP_URL;
        script.setAttribute('data-client-key', MIDTRANS_CLIENT_KEY);
        script.onload = () => {
            console.log('Midtrans Snap loaded successfully');
            resolve(window.snap);
        };
        script.onerror = () => {
            console.error('Failed to load Midtrans Snap');
            reject(new Error('Failed to load Midtrans Snap'));
        };
        document.head.appendChild(script);
    });
}

// Get Snap Token via Supabase Edge Function (SECURE)
// Server Key is stored in Supabase environment variables, NOT in frontend
async function getSnapToken(orderData) {
    if (typeof MIDTRANS_TOKEN_URL === 'undefined' || !MIDTRANS_TOKEN_URL.includes('supabase')) {
        throw new Error('Payment gateway tidak dikonfigurasi dengan benar. Hubungi administrator.');
    }

    try {
        const response = await fetch(MIDTRANS_TOKEN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_KEY}`
            },
            body: JSON.stringify(orderData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Edge Function error:', errorData);
            throw new Error(errorData.error || 'Gagal memproses pembayaran');
        }

        const data = await response.json();
        return data.token;
    } catch (error) {
        console.error('Error getting Snap token:', error);
        throw error;
    }
}

// Process payment with Midtrans Snap
async function processPaymentWithMidtrans(orderData, onSuccess, onPending, onError) {
    try {
        // Show loading
        showNotification('Memproses pembayaran...', 'info');

        // Initialize Snap if not already done
        await initMidtransSnap();

        // Get Snap token from backend
        const snapToken = await getSnapToken(orderData);

        // Open Snap popup
        window.snap.pay(snapToken, {
            onSuccess: function (result) {
                console.log('Payment success:', result);
                showNotification('Pembayaran berhasil!', 'success');
                if (onSuccess) onSuccess(result);
            },
            onPending: function (result) {
                console.log('Payment pending:', result);
                showNotification('Menunggu pembayaran...', 'info');
                if (onPending) onPending(result);
            },
            onError: function (result) {
                console.error('Payment error:', result);
                showNotification('Pembayaran gagal. Silakan coba lagi.', 'error');
                if (onError) onError(result);
            },
            onClose: function () {
                console.log('Payment popup closed');
                showNotification('Pembayaran dibatalkan', 'warning');
            }
        });
    } catch (error) {
        console.error('Error processing payment:', error);
        showNotification('Terjadi kesalahan. Silakan coba lagi.', 'error');
        if (onError) onError(error);
    }
}
