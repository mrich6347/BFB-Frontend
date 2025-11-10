import axios from 'axios';
import { useAuthStore } from '@/stores/auth.store';
import { useToast } from 'vue-toast-notification';
import 'vue-toast-notification/dist/theme-sugar.css';
import { markLocalMutation } from '@/composables/common/useRealtimeSync';

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

        // Mark mutations BEFORE they happen (so realtime changes are ignored)
        const method = config.method?.toUpperCase();
        if (method && ['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
            markLocalMutation();
        }
    } catch (error) {
        console.error('Error in API interceptor:', error);
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Add a response interceptor
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        const $toast = useToast();
        let errorMessage = 'An error occurred. Please try again.';

        if (error.response) {
            const responseData = error.response.data;

            if (responseData && responseData.message) {
                errorMessage = responseData.message;
            } else if (responseData && responseData.error) {
                errorMessage = responseData.error;
            } else if (responseData && typeof responseData === 'string') {
                errorMessage = responseData;
            }

            if (error.response.status === 401) {
                // Unauthorized - possibly token expired
                const authStore = useAuthStore();
                authStore.signOut();
                errorMessage = 'Your session has expired. Please log in again.';
            }
        } else if (error.request) {
            // The request was made but no response was received
            errorMessage = 'No response from server. Please check your internet connection.';
        }

        // Show error toast
        $toast.warning(errorMessage, {
            position: 'bottom-right',
            duration: 5000,
            dismissible: true
        });

        return Promise.reject(error);
    }
);

export default api;
