import { createClient } from '@supabase/supabase-js';

// Default to Environment Variables (Best Practice for Prod)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a single instance if env vars are present
export const supabase = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey)
    : null;

// Helper to create a client dynamically (for Admin Panel manual input)
export const createDynamicClient = (url: string, key: string) => {
    return createClient(url, key);
};
