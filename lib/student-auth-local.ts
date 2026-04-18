import { useStudentAuthStore, type StudentUser } from "@/store/studentAuthStore";

const STORAGE_KEY = "ssms-student-auth";

type PersistBlob = {
    state?: {
        student?: StudentUser | null;
        token?: string | null;
        refreshToken?: string | null;
        isAuthenticated?: boolean;
    };
};

export function rehydrateStudentAuthFromLocalStorageOnce(): void {
    if (typeof window === "undefined") return;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            useStudentAuthStore.setState({ hasHydrated: true });
            return;
        }
        const parsed = JSON.parse(raw) as PersistBlob;
        const st = parsed.state;
        if (!st || typeof st !== "object") {
            useStudentAuthStore.setState({ hasHydrated: true });
            return;
        }
        const token = typeof st.token === "string" ? st.token : null;
        useStudentAuthStore.setState({
            hasHydrated: true,
            token,
            refreshToken: typeof st.refreshToken === "string" ? st.refreshToken : null,
            student: (st.student ?? null) as StudentUser | null,
            isAuthenticated: Boolean(st.isAuthenticated ?? (token != null && token.length > 0)),
        });
    } catch {
        useStudentAuthStore.setState({ hasHydrated: true });
    }
}
