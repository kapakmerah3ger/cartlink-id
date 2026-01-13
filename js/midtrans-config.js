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

// Get Snap Token - SANDBOX TESTING MODE
// WARNING: This directly calls Midtrans API from frontend. 
// For PRODUCTION, use Supabase Edge Function to protect Server Key!
async function getSnapToken(orderData) {
    // Use Edge Function if available
    if (typeof MIDTRANS_TOKEN_URL !== 'undefined' && MIDTRANS_TOKEN_URL.includes('supabase')) {
        try {
            const response = await fetch(MIDTRANS_TOKEN_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                },
                body: JSON.stringify(orderData)
            });

            if (response.ok) {
                const data = await response.json();
                return data.token;
            }
            console.warn('Edge Function failed, falling back to direct API (SANDBOX ONLY)');
        } catch (error) {
            console.warn('Edge Function error, falling back to direct API (SANDBOX ONLY):', error);
        }
    }

    // SANDBOX FALLBACK - Direct API call (NOT FOR PRODUCTION!)
    const MIDTRANS_SERVER_KEY = 'SB-Mid-server-ddu2Q6JSZZJ4Gd4dcMsw4180';
    const MIDTRANS_API_URL = 'https://app.sandbox.midtrans.com/snap/v1/transactions';

    // Prepare item details
    let itemDetails = [];
    if (orderData.items && orderData.items.length > 0) {
        itemDetails = orderData.items.map(item => ({
            id: String(item.id),
            price: Math.round(item.price),
            quantity: item.quantity || 1,
            name: item.title.substring(0, 50)
        }));
    } else if (orderData.productId) {
        itemDetails = [{
            id: String(orderData.productId),
            price: Math.round(orderData.pricePerUnit || orderData.totalPrice),
            quantity: orderData.quantity || 1,
            name: (orderData.productTitle || 'Product').substring(0, 50)
        }];
    } else {
        itemDetails = [{
            id: orderData.orderId,
            price: Math.round(orderData.totalPrice),
            quantity: 1,
            name: 'Pembelian Produk Digital'
        }];
    }

    const transactionPayload = {
        transaction_details: {
            order_id: orderData.orderId,
            gross_amount: Math.round(orderData.totalPrice)
        },
        item_details: itemDetails,
        customer_details: {
            first_name: orderData.customer.name,
            email: orderData.customer.email,
            phone: orderData.customer.phone
        },
        enabled_payments: [
            "bca_va", "bni_va", "bri_va", "permata_va", "other_va",
            "gopay", "shopeepay",
            "qris"
        ]
    };

    try {
        const authString = btoa(MIDTRANS_SERVER_KEY + ':');
        const response = await fetch(MIDTRANS_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Basic ${authString}`
            },
            body: JSON.stringify(transactionPayload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Midtrans API error: ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        console.log('Snap token created:', data.token);
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
