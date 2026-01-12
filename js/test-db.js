
const configInfo = {
    url: typeof SUPABASE_URL !== 'undefined' ? SUPABASE_URL : 'NOT_DEFINED',
    key: typeof SUPABASE_KEY !== 'undefined' ? (SUPABASE_KEY ? 'DEFINED (' + SUPABASE_KEY.substring(0, 10) + '...)' : 'EMPTY') : 'NOT_DEFINED',
    client: typeof supabase !== 'undefined' && supabase !== null ? 'INITIALIZED' : 'NULL'
};

console.log('--- DIAGNOSTIC START ---');
console.log('Config:', configInfo);

async function testConnection() {
    if (!supabase) {
        console.error('Supabase client is missing!');
        alert('Diagnostic: Supabase client is missing. Check console.');
        return;
    }

    try {
        console.log('Testing connection to products table...');
        const { data, error } = await supabase.from('products').select('count', { count: 'exact', head: true });

        if (error) {
            console.error('Connection Failed:', error);
            alert('Diagnostic Error: ' + error.message);
        } else {
            console.log('Connection Successful. Table "products" exists.');
            console.log('Row count:', data); // data is null for head:true usually, count is property

            // Try fetching actual data
            const { data: products, error: prodError } = await supabase.from('products').select('*').limit(5);
            if (prodError) {
                console.error('Fetch Failed:', prodError);
            } else {
                console.log('Fetched products:', products);
                if (products.length === 0) {
                    alert('Diagnostic: Connection OK, but table "products" is empty. Did you run the SQL script?');
                } else {
                    alert('Diagnostic: Connection OK. Found ' + products.length + ' products. Check console for details.');
                }
            }
        }
    } catch (e) {
        console.error('Exception:', e);
        alert('Diagnostic Exception: ' + e.message);
    }
}

// Auto-run if manual trigger not desired
// testConnection();
