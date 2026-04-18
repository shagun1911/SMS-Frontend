import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeDecodeJwt } from '../lib/jwt';

export interface StudentUser {
    _id: string;
    firstName: string;
    lastName: string;
    username: string;
    admissionNumber: string;
    class: string;
    section: string;
    photo?: string;
    schoolId: string;
    schoolCode: string;
    schoolName: string;
    mustChangePassword?: boolean;
}

interface StudentAuthState {
    student: StudentUser | null;
    token: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    hasHydrated: boolean;
    login: (student: StudentUser, token: string, refreshToken: string) => void;
    logout: () => void;
    setTokens: (token: string, refreshToken: string) => void;
    clearMustChange: () => void;
    setHasHydrated: (value: boolean) => void;
    setIsAuthenticated: (value: boolean) => void;
}

export const useStudentAuthStore = create<StudentAuthState>()(
    persist(
        (set) => ({
            student: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            hasHydrated: false,

            login: (student, token, refreshToken) =>
                set({ student, token, refreshToken, isAuthenticated: true }),

            logout: () =>
                set({ student: null, token: null, refreshToken: null, isAuthenticated: false }),

            setTokens: (token, refreshToken) => set({ token, refreshToken }),

            clearMustChange: () =>
                set((state) =>
                    state.student ? { student: { ...state.student, mustChangePassword: false } } : {}
                ),
            setHasHydrated: (value) => set({ hasHydrated: value }),
            setIsAuthenticated: (value) => set({ isAuthenticated: value }),
        }),
        {
            name: 'ssms-student-auth',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                student: state.student,
                token: state.token,
                refreshToken: state.refreshToken,
                isAuthenticated: state.isAuthenticated,
            }),
            onRehydrateStorage: () => (_state, error) => {
                useStudentAuthStore.setState({ hasHydrated: true });
                if (error) return;
                const s = useStudentAuthStore.getState();
                if (s.token && !safeDecodeJwt(s.token)) {
                    useStudentAuthStore.setState({
                        student: null,
                        token: null,
                        refreshToken: null,
                        isAuthenticated: false,
                    });
                    return;
                }
                if (s.token && !s.isAuthenticated) useStudentAuthStore.setState({ isAuthenticated: true });
                if (!s.token && s.isAuthenticated) useStudentAuthStore.setState({ isAuthenticated: false });
            },
        }
    )
);
