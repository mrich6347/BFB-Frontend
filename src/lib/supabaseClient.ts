import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl) {
    throw new Error("VITE_SUPABASE_URL is not defined in .env file")
}
if (!supabaseAnonKey) {
    throw new Error("VITE_SUPABASE_ANON_KEY is not defined in .env file")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        // Store session in localStorage for persistence across browser sessions
        storage: window.localStorage,
        // Automatically refresh the token before it expires
        autoRefreshToken: true,
        // Persist the session across browser tabs
        persistSession: true,
        // Detect session from URL (for magic links, etc.)
        detectSessionInUrl: true
    }
})