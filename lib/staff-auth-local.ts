import { useAuthStore } from "@/store/authStore";
import type { IUser } from "@/types";

const STORAGE_KEY = "ssms-auth-storage";

type PersistBlob = {
    state?: {
        user?: IUser | null;
        token?: string | null;
        refreshToken?: string | null;
        isAuthenticated?: boolean;
        schoolId?: string | null;
    };
};

/**
 * Reads the zustand-persist JSON blob and applies it to the store.
 * Used when middleware hydration is delayed, fails silently, or desyncs from localStorage.
 */
export function rehydrateStaffAuthFromLocalStorageOnce(): void {
    if (typeof window === "undefined") return;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            useAuthStore.setState({ hasHydrated: true });
            return;
        }
        const parsed = JSON.parse(raw) as PersistBlob;
        const st = parsed.state;
        if (!st || typeof st !== "object") {
            useAuthStore.setState({ hasHydrated: true });
            return;
        }
        const token = typeof st.token === "string" ? st.token : null;
        useAuthStore.setState({
            hasHydrated: true,
            token,
            refreshToken: typeof st.refreshToken === "string" ? st.refreshToken : null,
            user: (st.user ?? null) as IUser | null,
            isAuthenticated: Boolean(st.isAuthenticated ?? (token != null && token.length > 0)),
            schoolId: typeof st.schoolId === "string" ? st.schoolId : null,
        });
    } catch {
        useAuthStore.setState({ hasHydrated: true });
    }
}
