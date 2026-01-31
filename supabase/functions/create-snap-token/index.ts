// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
//
// Create Snap Token for Midtrans Payment
// This function is called from frontend to generate a secure Snap token

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// IMPORTANT: Server Key MUST be set in Supabase environment variables
// Run: supabase secrets set MIDTRANS_SERVER_KEY=your-server-key
const MIDTRANS_SERVER_KEY = Deno.env.get('MIDTRANS_SERVER_KEY');
const MIDTRANS_IS_PRODUCTION = Deno.env.get('MIDTRANS_IS_PRODUCTION') === 'true';

const MIDTRANS_API_URL = MIDTRANS_IS_PRODUCTION
    ? 'https://app.midtrans.com/snap/v1/transactions'
    : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
    'https://www.cartlink.id',
    'https://cartlink.id',
    'http://localhost:3000' // for local development
];

function getCorsHeaders(origin: string | null) {
    const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
    return {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
    };
}

serve(async (req) => {
    const origin = req.headers.get('origin');
    const corsHeaders = getCorsHeaders(origin);

    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    // Validate Server Key is configured
    if (!MIDTRANS_SERVER_KEY) {
        console.error('MIDTRANS_SERVER_KEY not configured');
        return new Response(
            JSON.stringify({ error: 'Payment gateway not configured. Contact administrator.' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    try {
        const orderData = await req.json();

        // Validate required fields
        if (!orderData.orderId || !orderData.totalPrice || !orderData.customer) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields: orderId, totalPrice, customer' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Prepare item details
        let itemDetails = [];

        if (orderData.items && orderData.items.length > 0) {
            // Cart checkout - multiple items
            itemDetails = orderData.items.map((item: any) => ({
                id: String(item.id),
                price: Math.round(item.price),
                quantity: item.quantity || 1,
                name: item.title.substring(0, 50) // Midtrans limits name to 50 chars
            }));
        } else if (orderData.productId) {
            // Single product checkout
            itemDetails = [{
                id: String(orderData.productId),
                price: Math.round(orderData.pricePerUnit || orderData.totalPrice),
                quantity: orderData.quantity || 1,
                name: (orderData.productTitle || 'Product').substring(0, 50)
            }];
        } else {
            // Fallback - single generic item
            itemDetails = [{
                id: orderData.orderId,
                price: Math.round(orderData.totalPrice),
                quantity: 1,
                name: 'Pembelian Produk Digital'
            }];
        }

        // Build Midtrans transaction payload
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
            // Enable specific payment methods
            enabled_payments: [
                "bca_va", "bni_va", "bri_va", "permata_va", "other_va", // Bank Transfer
                "gopay", "shopeepay", // E-wallet
                "qris" // QRIS
            ],
            callbacks: {
                finish: `${req.headers.get('origin') || 'https://cartlink.id'}/checkout-success?order_id=${orderData.orderId}`
            }
        };

        console.log('Creating Snap transaction:', JSON.stringify(transactionPayload));

        // Call Midtrans API
        const authString = btoa(MIDTRANS_SERVER_KEY + ':');
        const midtransResponse = await fetch(MIDTRANS_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Basic ${authString}`
            },
            body: JSON.stringify(transactionPayload)
        });

        const responseData = await midtransResponse.json();

        if (!midtransResponse.ok) {
            console.error('Midtrans API error:', responseData);
            return new Response(
                JSON.stringify({ error: 'Failed to create transaction', details: responseData }),
                { status: midtransResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        console.log('Snap token created successfully:', responseData.token);

        return new Response(
            JSON.stringify({
                token: responseData.token,
                redirect_url: responseData.redirect_url
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error: unknown) {
        console.error('Error creating Snap token:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return new Response(
            JSON.stringify({ error: errorMessage }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
})
