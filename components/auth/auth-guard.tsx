"use client";

import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, user, token } = useAuthStore();
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check local storage persistence first
        const timer = setTimeout(() => {
            if (!isAuthenticated && !token) {
                router.push("/login");
            }
            setLoading(false);
        }, 100); // Small delay to allow hydration

        return () => clearTimeout(timer);
    }, [isAuthenticated, token, router]);

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    if (!isAuthenticated) return null;

    return <>{children}</>;
}
