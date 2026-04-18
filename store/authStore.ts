import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { IUser } from '../types';
import { safeDecodeJwt } from '../lib/jwt';

interface AuthState {
    user: IUser | null;
    token: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    schoolId: string | null;
    hasHydrated: boolean;
    login: (user: IUser, token: string, refreshToken: string) => void;
    logout: () => void;
    setSchoolContext: (schoolId: string) => void;
    setTokens: (token: string, refreshToken: string) => void;
    clearMustChangePassword: () => void;
    setHasHydrated: (value: boolean) => void;
    setIsAuthenticated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            schoolId: null,
            hasHydrated: false,

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
            setHasHydrated: (value) => set({ hasHydrated: value }),
            setIsAuthenticated: (value) => set({ isAuthenticated: value }),
        }),
        {
            name: 'ssms-auth-storage', // Key in localStorage
            storage: createJSONStorage(() => localStorage),
            /** Do not persist hydration flag — it must be false until rehydration finishes each session. */
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                refreshToken: state.refreshToken,
                isAuthenticated: state.isAuthenticated,
                schoolId: state.schoolId,
            }),
            onRehydrateStorage: () => (_state, error) => {
                // Always mark hydrated even if storage is corrupted.
                useAuthStore.setState({ hasHydrated: true });
                if (error) return;
                const s = useAuthStore.getState();
                // If token is corrupted, clear it (do NOT redirect here).
                if (s.token && !safeDecodeJwt(s.token)) {
                    useAuthStore.setState({
                        user: null,
                        token: null,
                        refreshToken: null,
                        isAuthenticated: false,
                        schoolId: null,
                    });
                    return;
                }
                // Reconcile auth boolean from persisted token.
                if (s.token && !s.isAuthenticated) useAuthStore.setState({ isAuthenticated: true });
                if (!s.token && s.isAuthenticated) useAuthStore.setState({ isAuthenticated: false });
            },
        }
    )
);
