"use client";

import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useState } from "react";
import { rehydrateStaffAuthFromLocalStorageOnce } from "@/lib/staff-auth-local";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [bootstrapped, setBootstrapped] = useState(false);
    const { isAuthenticated, token } = useAuthStore();
    const authed = Boolean(isAuthenticated || token);

    useLayoutEffect(() => {
        rehydrateStaffAuthFromLocalStorageOnce();
        setBootstrapped(true);
    }, []);

    useEffect(() => {
        if (!bootstrapped) return;
        if (!authed) {
            router.replace("/login");
        }
    }, [bootstrapped, authed, router]);

    if (!bootstrapped) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    if (!authed) return null;

    return <>{children}</>;
}
