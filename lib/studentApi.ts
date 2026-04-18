import axios from 'axios';
import { useStudentAuthStore } from '../store/studentAuthStore';

const rawUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const baseURL = rawUrl.replace(/\/api\/v1\/?$/, '') + '/api/v1';

const studentApi = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
    timeout: 60_000,
});

studentApi.interceptors.request.use((config) => {
    const { token } = useStudentAuthStore.getState();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

studentApi.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const rehydrated =
            !useStudentAuthStore.persist ||
            useStudentAuthStore.persist.hasHydrated() ||
            useStudentAuthStore.getState().hasHydrated;
        if (!rehydrated) {
            return Promise.reject(error);
        }

        if (error.response?.status === 401 && !originalRequest?._retry) {
            originalRequest._retry = true;
            const { refreshToken } = useStudentAuthStore.getState();
            if (!refreshToken) {
                useStudentAuthStore.getState().logout();
                if (typeof window !== 'undefined') window.location.href = '/student/login';
                return Promise.reject(error);
            }
            try {
                const { data } = await axios.post(
                    `${baseURL}/auth/student/refresh-token`,
                    { refreshToken }
                );
                const newToken = data.token;
                const newRefreshToken = data.refreshToken;
                useStudentAuthStore.getState().setTokens(newToken, newRefreshToken);
                useStudentAuthStore.getState().setIsAuthenticated(true);
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return studentApi(originalRequest);
            } catch (refreshError: any) {
                const refreshStatus = refreshError?.response?.status;
                if (refreshStatus === 401 || refreshStatus === 403) {
                    useStudentAuthStore.getState().logout();
                    if (typeof window !== 'undefined') window.location.href = '/student/login';
                }
                return Promise.reject(refreshError);
            }
        }

        if (error.response?.status === 403) {
            // 403 is a confirmed auth/authorization failure (do not logout on 5xx/network).
            useStudentAuthStore.getState().logout();
            if (typeof window !== 'undefined') window.location.href = '/student/login';
        }
        return Promise.reject(error);
    }
);

export default studentApi;
