"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import {
    ShieldCheck,
    School,
    ArrowLeft,
    Loader2,
    Lock,
    Mail,
    Sparkles,
} from "lucide-react";

const loginSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type LoginValues = z.infer<typeof loginSchema>;

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const portal = searchParams.get("portal") || "school";
    const { login } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);

    const isMaster = portal === "master";

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginValues>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginValues) => {
        setIsLoading(true);
        try {
            const response = await api.post("/auth/login", { ...data, portal });
            const { user, accessToken, refreshToken, redirectTo } = response.data;

            if (isMaster && user.role !== "superadmin") {
                toast.error("Unauthorized Portal", {
                    description: "This portal is reserved for Master Admins only.",
                });
                return;
            }

            if (!isMaster && user.role === "superadmin") {
                toast.error("Unauthorized Portal", {
                    description: "Master Admins must use the Control Center portal.",
                });
                return;
            }

            login(user, accessToken, refreshToken);
            toast.success("Welcome back!", { description: `Logged in as ${user.name}` });
            router.push(redirectTo);
        } catch (error: any) {
            const msg = error.response?.data?.message || "Invalid credentials";
            const isPortal = msg.includes("Portal") || msg.includes("Master Admin") || msg.includes("Control Center");
            toast.error(isPortal ? "Wrong login page" : "Login failed", {
                description: isPortal
                    ? "Use the correct link: School users → School Login; Master Admins → Master Admin."
                    : msg,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-[hsl(var(--background))] flex items-center justify-center px-4 py-16">
            <div className="relative z-10 w-full max-w-[420px] animate-scale-in">
                <Link
                    href="/"
                    className="mb-10 inline-flex items-center gap-2 text-sm font-medium text-[hsl(var(--muted-foreground))] transition-smooth hover:text-[hsl(var(--foreground))]"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to home
                </Link>

                <div className="overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-card">
                    <div className="p-8 sm:p-10">
                        <div className="mb-8 text-center">
                            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]">
                                {isMaster ? (
                                    <ShieldCheck className="h-8 w-8" />
                                ) : (
                                    <School className="h-8 w-8" />
                                )}
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">
                                {isMaster ? "Master Admin" : "School Login"}
                            </h1>
                            <span className="mx-auto mt-3 block h-0.5 w-10 rounded-full bg-[hsl(var(--primary))]/60" />
                            <p className="mt-4 text-sm text-[hsl(var(--muted-foreground))]">
                                {isMaster
                                    ? "Authentication required for Master Control"
                                    : "Access your institution's management suite"}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            <div className="space-y-4">
                                <div className="relative">
                                    <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]">
                                        <Mail className="h-4 w-4" />
                                    </div>
                                    <input
                                        {...register("email")}
                                        className="h-12 w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] pl-11 pr-4 text-sm outline-none transition-smooth placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--ring))] focus:ring-2 focus:ring-[hsl(var(--ring))]/20"
                                        placeholder="Email address"
                                        disabled={isLoading}
                                    />
                                    {errors.email && (
                                        <p className="mt-1.5 text-xs text-[hsl(var(--destructive))]">{errors.email.message}</p>
                                    )}
                                </div>

                                <div className="relative">
                                    <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]">
                                        <Lock className="h-4 w-4" />
                                    </div>
                                    <input
                                        {...register("password")}
                                        type="password"
                                        className="h-12 w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] pl-11 pr-4 text-sm outline-none transition-smooth placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--ring))] focus:ring-2 focus:ring-[hsl(var(--ring))]/20"
                                        placeholder="Password"
                                        disabled={isLoading}
                                    />
                                    {errors.password && (
                                        <p className="mt-1.5 text-xs text-[hsl(var(--destructive))]">{errors.password.message}</p>
                                    )}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[hsl(var(--primary))] font-semibold text-white shadow-lg shadow-[hsl(var(--primary))]/25 transition-smooth hover:opacity-95 disabled:opacity-70"
                            >
                                {isLoading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <>
                                        Sign in
                                        <Sparkles className="h-4 w-4 opacity-80" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {!isMaster && (
                        <div className="border-t border-[hsl(var(--border))] bg-[hsl(var(--muted))]/50 p-5 text-center">
                            <p className="text-sm text-[hsl(var(--muted-foreground))]">
                                New institution?{" "}
                                <Link href="/register" className="font-medium text-[hsl(var(--primary))] transition-smooth hover:underline">
                                    Register your school
                                </Link>
                            </p>
                        </div>
                    )}
                </div>

                <p className="mt-6 text-center text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                    Secure login · SMS
                </p>
            </div>
        </div>
    );
}

function LoginFallback() {
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-[hsl(var(--background))]">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-[hsl(var(--primary))]" />
                <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading...</p>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<LoginFallback />}>
            <LoginContent />
        </Suspense>
    );
}
