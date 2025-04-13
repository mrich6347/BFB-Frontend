import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

// Create the axios instance
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '',
    headers: {
        'Content-Type': 'application/json',
    }
});

// Add a request interceptor
api.interceptors.request.use(async (config) => {
    try {
        const authStore = useAuthStore();
        
        // Periodically check ban status (every 5 minutes)
        await authStore.checkBanStatus();

        // Add token if available
        if (authStore.getAccessToken) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${authStore.getAccessToken}`;
        }
    } catch (error) {
        console.error('Error in API interceptor:', error);
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;