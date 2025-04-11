import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import router from '@/router'; // Import your Vue router

// Create the axios instance
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '',
    headers: {
        'Content-Type': 'application/json',
    }
});

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Add a request interceptor
api.interceptors.request.use(async (config) => {
    try {
        // Get the current session from Supabase
        const { data: { session } } = await supabase.auth.getSession();

        if (session && session.access_token) {
            // Check if user is banned
            const { data: userData } = await supabase.auth.getUser(session.access_token);

            if (userData?.user && 'banned_until' in userData.user) {
                const bannedUntil = new Date(userData.user.banned_until as string);
                const now = new Date();

                if (bannedUntil > now) {
                    await supabase.auth.signOut();
                    router.push('/banned'); // Redirect to a banned page
                    return Promise.reject('User is banned');
                }
            }

            // User is not banned, proceed with the request
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${session.access_token}`;
        }
    } catch (error) {
        console.error('Error checking user ban status:', error);
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;