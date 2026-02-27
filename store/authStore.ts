import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { IUser } from '../types';

interface AuthState {
    user: IUser | null;
    token: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    schoolId: string | null;
    login: (user: IUser, token: string, refreshToken: string) => void;
    logout: () => void;
    setSchoolContext: (schoolId: string) => void;
    setTokens: (token: string, refreshToken: string) => void;
    clearMustChangePassword: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            schoolId: null,

            login: (user, token, refreshToken) =>
                set({
                    user,
                    token,
                    refreshToken,
                    isAuthenticated: true,
                    schoolId: user.schoolId || null,
                }),

            logout: () =>
                set({
                    user: null,
                    token: null,
                    refreshToken: null,
                    isAuthenticated: false,
                    schoolId: null,
                }),

            setSchoolContext: (schoolId) => set({ schoolId }),

            setTokens: (token, refreshToken) => set({ token, refreshToken }),

            clearMustChangePassword: () =>
                set((state) =>
                    state.user
                        ? { user: { ...state.user, mustChangePassword: false } }
                        : state
                ),
        }),
        {
            name: 'ssms-auth-storage', // Key in localStorage
            storage: createJSONStorage(() => localStorage),
        }
    )
);
