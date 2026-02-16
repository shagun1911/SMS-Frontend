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
    Sparkles
} from "lucide-react";

// Validation Schema
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

            // Enforce Portal Isolation (Security Requirement)
            if (isMaster && user.role !== 'superadmin') {
                toast.error("Unauthorized Portal", {
                    description: "This portal is reserved for Master Admins only."
                });
                return;
            }

            if (!isMaster && user.role === 'superadmin') {
                toast.error("Unauthorized Portal", {
                    description: "Master Admins must use the Control Center portal."
                });
                return;
            }

            // Store credentials in Zustand + Persistence
            login(user, accessToken, refreshToken);

            toast.success("Welcome back!", {
                description: `Logged in as ${user.name}`,
            });

            // Navigate to the role-specific dashboard returned by the backend
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
        <div className="relative min-h-screen w-full overflow-hidden bg-[#0A0A0A] text-white flex items-center justify-center px-4">
            {/* Background Glows */}
            <div className={`absolute -top-[10%] -left-[10%] h-[500px] w-[500px] rounded-full blur-[120px] transition-colors duration-1000 ${isMaster ? 'bg-blue-600/20' : 'bg-purple-600/20'}`} />
            <div className={`absolute -bottom-[10%] -right-[10%] h-[500px] w-[500px] rounded-full blur-[120px] transition-colors duration-1000 ${isMaster ? 'bg-blue-900/10' : 'bg-purple-900/10'}`} />

            <div className="relative z-10 w-full max-w-[450px]">
                {/* Back to Selection */}
                <Link
                    href="/"
                    className="group mb-8 flex items-center gap-2 text-zinc-500 hover:text-white transition-colors"
                >
                    <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    <span className="text-sm font-medium">Back to Selector</span>
                </Link>

                {/* Login Card */}
                <div className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.03] backdrop-blur-2xl shadow-2xl">
                    <div className="p-8 md:p-12">

                        {/* Header */}
                        <div className="mb-10 text-center">
                            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/[0.05] ring-1 ring-white/10">
                                {isMaster ? (
                                    <ShieldCheck className="h-10 w-10 text-blue-400" />
                                ) : (
                                    <School className="h-10 w-10 text-purple-400" />
                                )}
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight mb-2">
                                {isMaster ? "Master Admin" : "School Login"}
                            </h1>
                            <p className="text-zinc-400 text-sm">
                                {isMaster
                                    ? "Authentication required for Master Control"
                                    : "Access your institution's management suite"
                                }
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="space-y-4">
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-white transition-colors">
                                        <Mail className="h-4 w-4" />
                                    </div>
                                    <input
                                        {...register("email")}
                                        className="w-full h-14 bg-white/[0.05] border border-white/10 rounded-2xl pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 transition-all placeholder:text-zinc-600"
                                        placeholder="Email Address"
                                        disabled={isLoading}
                                    />
                                    {errors.email && (
                                        <p className="mt-1 text-xs text-red-400 ml-2">{errors.email.message}</p>
                                    )}
                                </div>

                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-white transition-colors">
                                        <Lock className="h-4 w-4" />
                                    </div>
                                    <input
                                        {...register("password")}
                                        type="password"
                                        className="w-full h-14 bg-white/[0.05] border border-white/10 rounded-2xl pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 transition-all placeholder:text-zinc-600"
                                        placeholder="Password"
                                        disabled={isLoading}
                                    />
                                    {errors.password && (
                                        <p className="mt-1 text-xs text-red-400 ml-2">{errors.password.message}</p>
                                    )}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`relative w-full h-14 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 group ${isMaster
                                    ? 'bg-blue-600 hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.3)]'
                                    : 'bg-purple-600 hover:bg-purple-500 shadow-[0_0_20px_rgba(147,51,234,0.3)]'
                                    }`}
                            >
                                {isLoading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <>
                                        Sign In to Portal
                                        <Sparkles className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {!isMaster && (
                        <div className="bg-white/[0.02] border-t border-white/5 p-6 text-center">
                            <p className="text-sm text-zinc-500">
                                New institution? {" "}
                                <Link href="/register" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
                                    Register your school
                                </Link>
                            </p>
                        </div>
                    )}
                </div>

                <p className="mt-8 text-center text-zinc-600 text-[10px] tracking-[0.2em] uppercase font-bold">
                    Protected by SSMS Secure Protocol
                </p>
            </div>
        </div>
    );
}

function LoginFallback() {
    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-[#0A0A0A] text-white flex items-center justify-center px-4">
            <div className="relative z-10 flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-purple-400" />
                <p className="text-sm text-zinc-500">Loading...</p>
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
