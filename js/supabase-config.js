const SUPABASE_URL = 'https://vptsxtlceielmajlpyda.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwdHN4dGxjZWllbG1hamxweWRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNTM3OTUsImV4cCI6MjA4MzYyOTc5NX0.3rE6I0ZnIFKIvyr71rw4d2t6vqER2i8yxIoKF46lumg';

// Initialize Supabase Client
// Note: We are using the CDN script, so 'supabase' global object will be available
function getSupabase() {
    if (typeof supabase === 'undefined') {
        console.error('Supabase client not loaded. Make sure the CDN script is included.');
        return null;
    }
    // Check if client is already initialized globally to avoid multiple instances
    if (!window._supabaseClient) {
        window._supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }
    return window._supabaseClient;
}
