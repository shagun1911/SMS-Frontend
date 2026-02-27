import axios from 'axios';
import { useStudentAuthStore } from '../store/studentAuthStore';

const rawUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const baseURL = rawUrl.replace(/\/api\/v1\/?$/, '') + '/api/v1';

const studentApi = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
});

studentApi.interceptors.request.use((config) => {
    const { token } = useStudentAuthStore.getState();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

studentApi.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            useStudentAuthStore.getState().logout();
            if (typeof window !== 'undefined') window.location.href = '/student/login';
        }
        return Promise.reject(error);
    }
);

export default studentApi;
