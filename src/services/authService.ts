import { createClient } from '@supabase/supabase-js';

// Get keys from localStorage (Admin Panel) or Environment Variables
const getSupabaseUrl = () => {
    // 1. Check keys set by AdminSettings (sb_url)
    let url = localStorage.getItem('sb_url');
    // 2. Fallback to older keys or manual set
    if (!url) url = localStorage.getItem('supabase_url');
    // 3. Fallback to legacy "adminIntegrations" JSON blob
    if (!url) {
        const stored = localStorage.getItem('adminIntegrations');
        if (stored) {
            try { url = JSON.parse(stored).supabase?.url; } catch (e) { }
        }
    }
    // 4. Fallback to env consts (Build time)
    return url || import.meta.env.VITE_SUPABASE_URL || '';
};

const getSupabaseKey = () => {
    // 1. Check keys set by AdminSettings (sb_key)
    let key = localStorage.getItem('sb_key');
    if (!key) key = localStorage.getItem('supabase_key');
    if (!key) {
        const stored = localStorage.getItem('adminIntegrations');
        if (stored) {
            try { key = JSON.parse(stored).supabase?.key; } catch (e) { }
        }
    }
    return key || import.meta.env.VITE_SUPABASE_ANON_KEY || '';
};

// Initialize client only if keys allow it, otherwise create a dummy client to prevent crash
const createSupabaseClient = () => {
    const url = getSupabaseUrl();
    const key = getSupabaseKey();

    if (url && key) {
        return createClient(url, key);
    }
    return null;
}

export const supabase = createSupabaseClient();

export const authService = {
    // Reload client (useful after saving keys in Admin Panel)
    reloadClient: () => {
        const newClient = createSupabaseClient();
        if (newClient) {
            // @ts-ignore - we are hot-swapping the client module variable effectively (or trying to usage)
            // Ideally we just tell the UI to refresh, but for now this simplistic reload might be tricky.
            // Better: UI calls getSupabaseUrl again or reloads page.
            // Returning true to indicate keys exist.
            return true;
        }
        return false;
    },

    // Sign Up with Email
    signUp: async (email: string, password: string) => {
        const client = createSupabaseClient();
        if (!client) throw new Error("Veritabanı bağlantısı eksik. Lütfen 'Entegrasyonlar' sayfasından anahtarları giriniz.");
        const { data, error } = await client.auth.signUp({ email, password });
        if (error) throw error;
        return data;
    },

    // Sign In with Email
    signIn: async (email: string, password: string) => {
        const client = createSupabaseClient();
        if (!client) throw new Error("Veritabanı bağlantısı eksik. Lütfen 'Entegrasyonlar' sayfasından anahtarları giriniz.");
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
    },

    // Sign In with Google
    signInWithGoogle: async () => {
        const client = createSupabaseClient();
        if (!client) throw new Error("Supabase bağlantısı eksik. Lütfen 'Entegrasyonlar' sayfasından anahtarları giriniz.");
        const { data, error } = await client.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin,
            }
        });
        if (error) {
            console.error("Google Login Error:", error);
            throw error;
        }
        return data;
    },

    // Password Reset (Email)
    resetPasswordForEmail: async (email: string) => {
        const client = createSupabaseClient();
        if (!client) throw new Error("Veritabanı bağlantısı eksik.");
        const { data, error } = await client.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset-password', // Ideally create this route too
        });
        if (error) throw error;
        return data;
    },

    // 1. Şifre Sıfırlama Kodu Gönder (Email OTP)
    sendPasswordResetCode: async (email: string) => {
        const client = createSupabaseClient();
        if (!client) throw new Error("Supabase bağlantısı eksik.");
        const { data, error } = await client.auth.signInWithOtp({
            email: email,
            options: {
                shouldCreateUser: false, // Sadece kayıtlı kullanıcılar için
            }
        });
        if (error) throw error;
        return data;
    },

    // 2. Email Kodunu Doğrula (Verify OTP)
    verifyEmailOtp: async (email: string, token: string) => {
        const client = createSupabaseClient();
        if (!client) throw new Error("Supabase bağlantısı eksik.");
        const { data, error } = await client.auth.verifyOtp({
            email,
            token,
            type: 'email',
        });
        if (error) throw error;
        return data;
    },

    // 3. Şifreyi Güncelle (Oturum açıldıktan sonra)
    updatePassword: async (password: string) => {
        const client = createSupabaseClient();
        if (!client) throw new Error("Supabase bağlantısı eksik.");
        const { data, error } = await client.auth.updateUser({
            password: password
        });
        if (error) throw error;
        return data;
    },

    // Sign In / Up with Phone (OTP) - Simplified
    signInWithOtp: async (phone: string) => {
        const client = createSupabaseClient();
        if (!client) throw new Error("Supabase bağlantısı eksik.");
        const { data, error } = await client.auth.signInWithOtp({
            phone: phone,
        });
        if (error) throw error;
        return data;
    },

    // Verify Phone OTP
    verifyOtp: async (phone: string, token: string) => {
        const client = createSupabaseClient();
        if (!client) throw new Error("Supabase bağlantısı eksik.");
        const { data, error } = await client.auth.verifyOtp({
            phone,
            token,
            type: 'sms',
        });
        if (error) throw error;
        return data;
    },

    // Logout
    signOut: async () => {
        const client = createSupabaseClient();
        if (!client) return;
        const { error } = await client.auth.signOut();
        if (error) throw error;
    },

    // Get Current User
    getUser: async () => {
        const client = createSupabaseClient();
        if (!client) return null;
        const { data: { user } } = await client.auth.getUser();
        return user;
    },

    // Subscribe to Auth State
    onAuthStateChange: (callback: (event: string, session: any) => void) => {
        const client = createSupabaseClient();
        if (!client) return { data: { subscription: { unsubscribe: () => { } } } };
        return client.auth.onAuthStateChange(callback);
    }
};
