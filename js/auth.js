// ==================== Customer Auth (Supabase) ====================
const sessionKey = 'cartlink_user_session';
const supabase = (typeof getSupabase === 'function') ? getSupabase() : null;

// Initialize session listener
if (supabase) {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
            updateLocalSession(session.user);
        } else {
            // If explicit logout happened elsewhere, verify local storage
            // But usually we trust local storage until sign out
        }
    });

    // Listen for changes
    supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth Event:', event);
        if (event === 'SIGNED_IN' && session) {
            updateLocalSession(session.user);
        } else if (event === 'SIGNED_OUT') {
            localStorage.removeItem(sessionKey);
            // Redirect if on protected page? Handled by page logic usually
            if (window.location.pathname.includes('/customer/')) {
                if (!window.location.pathname.includes('login') && !window.location.pathname.includes('register')) {
                    window.location.href = 'login.html';
                }
            }
        } else if (event === 'USER_UPDATED' && session) {
            updateLocalSession(session.user);
        }
    });
}

function updateLocalSession(user) {
    // Map Supabase user to our local format for main.js compatibility
    const localUser = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.email.split('@')[0],
        phone: user.user_metadata?.phone || '',
        purchasedProducts: user.user_metadata?.purchased_products || [],
        createdAt: user.created_at
    };
    localStorage.setItem(sessionKey, JSON.stringify(localUser));
}

// Deprecated: getUsers, saveUsers (No longer needed with DB)

async function registerUser(userData) {
    if (!supabase) return { success: false, message: 'Backend connection failed.' };

    try {
        const { data, error } = await supabase.auth.signUp({
            email: userData.email,
            password: userData.password,
            options: {
                data: {
                    full_name: userData.name,
                    phone: userData.phone,
                    purchased_products: []
                }
            }
        });

        if (error) throw error;

        // Note: If email confirmation is enabled, session might be null
        if (data.user && !data.session) {
            return { success: true, message: 'Registrasi berhasil! Silakan cek email Anda untuk konfirmasi.', requiresConfirmation: true };
        }

        return { success: true, user: data.user };

    } catch (err) {
        console.error('Registration error:', err);
        return { success: false, message: err.message };
    }
}

async function loginUser(email, password) {
    if (!supabase) return { success: false, message: 'Backend connection failed.' };

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        return { success: true, user: data.user };
    } catch (err) {
        console.error('Login error:', err);
        return { success: false, message: 'Email atau password salah.' }; // Generic message for security
    }
}

async function logoutUser() {
    if (supabase) {
        await supabase.auth.signOut();
    } else {
        localStorage.removeItem(sessionKey);
        window.location.href = '../index.html';
    }
}

function getCurrentUser() {
    return JSON.parse(localStorage.getItem(sessionKey));
}

function isUserLoggedIn() {
    return !!getCurrentUser();
}

async function updateUserInfo(updatedData) {
    if (!supabase) return { success: false, message: 'Backend error' };

    try {
        const { data, error } = await supabase.auth.updateUser({
            data: {
                full_name: updatedData.name,
                phone: updatedData.phone
                // Add other metadata fields as needed
            }
        });

        if (error) throw error;
        return { success: true, user: data.user };
    } catch (err) {
        return { success: false, message: err.message };
    }
}

async function addPurchasedProduct(productId) {
    if (!supabase) return;

    // Get fresh user data
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let purchased = user.user_metadata.purchased_products || [];

    // Convert all to strings for consistent comparison
    const pId = String(productId);
    const purchasedStrings = purchased.map(String);

    if (!purchasedStrings.includes(pId)) {
        purchased.push(pId);

        await supabase.auth.updateUser({
            data: { purchased_products: purchased }
        });

        // Local session update happens via onAuthStateChange USER_UPDATED
    }
}
