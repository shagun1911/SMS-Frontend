import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const rawUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const baseURL = rawUrl.replace(/\/api\/v1\/?$/, '') + '/api/v1';

const api = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// Request Interceptor
api.interceptors.request.use(
    (config) => {
        const { token } = useAuthStore.getState();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Handle 401 Unauthorized (Token Expired)
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const { refreshToken } = useAuthStore.getState();
                if (!refreshToken) throw new Error('No refresh token');

                // Refresh token call
                const { data } = await axios.post(
                    `${baseURL}/auth/refresh-token`,
                    { refreshToken }
                );

                const newToken = data.token;
                const newRefreshToken = data.refreshToken; // If rotated

                // Update store
                useAuthStore.getState().setTokens(newToken, newRefreshToken);

                // Retry original request
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                // Force logout
                useAuthStore.getState().logout();
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
