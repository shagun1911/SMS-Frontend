import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { isJwtExpired } from './jwt';

const rawUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const baseURL = rawUrl.replace(/\/api\/v1\/?$/, '') + '/api/v1';

const api = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
    timeout: 60_000,
});

let refreshRequest: Promise<{ token: string; refreshToken: string }> | null = null;

function clientLocalCalendarYmd(): string {
    const n = new Date();
    const y = n.getFullYear();
    const m = String(n.getMonth() + 1).padStart(2, '0');
    const d = String(n.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// Request Interceptor
api.interceptors.request.use(
    (config) => {
        const { token } = useAuthStore.getState();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        config.headers['X-Client-Date'] = clientLocalCalendarYmd();
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
                const rehydrated =
                    !useAuthStore.persist ||
                    useAuthStore.persist.hasHydrated() ||
                    useAuthStore.getState().hasHydrated;
                if (!rehydrated) {
                    return Promise.reject(error);
                }

                if (!refreshRequest) {
                    refreshRequest = (async () => {
                        const { refreshToken } = useAuthStore.getState();
                        if (!refreshToken) {
                            throw new Error('No refresh token');
                        }
                        const { data } = await axios.post(`${baseURL}/auth/refresh-token`, { refreshToken });
                        return {
                            token: data.token,
                            refreshToken: data.refreshToken ?? refreshToken,
                        };
                    })().finally(() => {
                        refreshRequest = null;
                    });
                }

                const { token: newToken, refreshToken: newRefreshToken } = await refreshRequest;

                // Update store
                useAuthStore.getState().setTokens(newToken, newRefreshToken);
                useAuthStore.getState().setIsAuthenticated(true);

                // Retry original request
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch (refreshError: any) {
                const refreshStatus = refreshError?.response?.status;
                // Logout only on confirmed auth failure from refresh endpoint.
                if (refreshStatus === 401 || refreshStatus === 403) {
                    useAuthStore.getState().logout();
                    if (typeof window !== 'undefined') window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            }
        }

        // If we have a known-expired token but this error is not a confirmed auth failure,
        // do not force logout here; let the 401 path handle it when it happens.
        const { token } = useAuthStore.getState();
        if (token && isJwtExpired(token) && !error.response) {
            return Promise.reject(error);
        }

        return Promise.reject(error);
    }
);

export default api;
