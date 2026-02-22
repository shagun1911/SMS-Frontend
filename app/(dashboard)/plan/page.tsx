"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sparkles, Loader2, CreditCard, GraduationCap, Users, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import api from "@/lib/api";

export default function PlanPage() {
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [canceledMsg, setCanceledMsg] = useState<string | null>(null);
    const queryClient = useQueryClient();

    useEffect(() => {
        if (typeof window === "undefined") return;
        const params = new URLSearchParams(window.location.search);
        if (params.get("success") === "1") {
            setSuccessMsg("Your plan has been updated successfully.");
            queryClient.invalidateQueries({ queryKey: ["school-stats"] });
            window.history.replaceState({}, "", window.location.pathname);
        }
        if (params.get("canceled") === "1") {
            setCanceledMsg("Checkout was canceled.");
            window.history.replaceState({}, "", window.location.pathname);
        }
    }, [queryClient]);

    const { data: stats, isLoading } = useQuery({
        queryKey: ["school-stats"],
        queryFn: async () => {
            const res = await api.get("/schools/stats");
            return res.data?.data ?? {};
        },
    });

    const { data: plans } = useQuery({
        queryKey: ["school-plans"],
        queryFn: async () => {
            const res = await api.get("/schools/plans");
            return res.data?.data ?? [];
        },
    });

    const checkoutMutation = useMutation({
        mutationFn: async ({ planId, interval }: { planId: string; interval: "monthly" | "yearly" }) => {
            const res = await api.post("/payments/create-order", { planId, interval });
            return res.data?.data ?? res.data;
        },
        onSuccess: async (data, variables) => {
            if (data?.isFree && data?.url) {
                window.location.href = data.url;
                return;
            }
            if (data?.redirectUrl) {
                window.location.href = data.redirectUrl;
                return;
            }
            if (!data?.orderId || !data?.keyId) {
                toast.error("Order not created.");
                return;
            }
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.async = true;
            document.body.appendChild(script);
            script.onload = () => {
                const Razorpay = (window as any).Razorpay;
                if (!Razorpay) {
                    toast.error("Razorpay failed to load.");
                    return;
                }
                const options = {
                    key: data.keyId,
                    amount: data.amount,
                    currency: data.currency || "INR",
                    order_id: data.orderId,
                    name: "School Management",
                    description: data.planName || "Plan upgrade",
                    handler: async function (response: any) {
                        try {
                            await api.post("/payments/verify", {
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                planId: variables.planId,
                                interval: variables.interval,
                            });
                            window.location.href = "/plan?success=1";
                        } catch (e: any) {
                            const msg = e.response?.data?.message || e.response?.data?.error || e.message;
                            const fallback = e.response?.status === 401
                                ? "Session expired. Please log in again."
                                : e.response?.status >= 500
                                    ? "Server error. Please try again later."
                                    : !e.response ? "Network error. Check your connection." : "Payment verification failed. Please try again.";
                            toast.error(msg && String(msg).trim() ? String(msg) : fallback);
                        }
                    },
                    modal: { ondismiss: () => toast.info("Payment canceled.") },
                };
                const rzp = new Razorpay(options);
                rzp.open();
            };
        },
        onError: (e: any) => {
            const msg = e.response?.data?.message || e.response?.data?.error || e.message;
            const fallback = e.response?.status === 401
                ? "Session expired. Please log in again."
                : e.response?.status >= 500
                    ? "Server error. Please try again later."
                    : !e.response ? "Network error. Check your connection." : "Checkout failed. Please try again.";
            toast.error(msg && String(msg).trim() ? String(msg) : fallback);
        },
    });

    const planLimits = stats?.planLimits ?? { planName: "—", maxStudents: 0, maxTeachers: 0 };
    const usage = stats?.usage ?? { totalStudents: 0, totalTeachers: 0 };
    const studentWarning = stats?.studentLimitWarning;
    const teacherWarning = stats?.teacherLimitWarning;
    const isOverLimit = studentWarning === "exceeded" || teacherWarning === "exceeded";
    const isFreePlan = (p: any) => Number(p?.priceMonthly) === 0 && Number(p?.priceYearly) === 0;

    if (isLoading) {
        return (
            <div className="flex h-[80vh] w-full items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Plan & Billing</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    View your current plan, usage, and upgrade options.
                </p>
            </div>

            {successMsg && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-emerald-700 dark:text-emerald-400">
                    <Check className="h-5 w-5" />
                    <span>{successMsg}</span>
                </div>
            )}
            {canceledMsg && (
                <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="h-5 w-5" />
                    <span>{canceledMsg}</span>
                </div>
            )}

            {isOverLimit && (
                <Card className="rounded-2xl border-destructive/50 bg-destructive/10 p-4">
                    <div className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        <span className="font-medium">You have reached your plan limit. Upgrade to add more students or teachers.</span>
                    </div>
                </Card>
            )}

            <Card className="rounded-2xl p-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Sparkles className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Current plan</p>
                        <p className="text-xl font-bold">{planLimits.planName}</p>
                    </div>
                </div>

                <div className="mt-6 grid gap-6 sm:grid-cols-2">
                    <div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2 text-muted-foreground">
                                <GraduationCap className="h-4 w-4" /> Students
                            </span>
                            <span className={usage.totalStudents >= (planLimits.maxStudents || 0) && planLimits.maxStudents ? "font-medium text-destructive" : ""}>
                                {usage.totalStudents} / {planLimits.maxStudents || "—"}
                            </span>
                        </div>
                        <Progress
                            value={planLimits.maxStudents ? Math.min(100, (usage.totalStudents / planLimits.maxStudents) * 100) : 0}
                            className="mt-2 h-2"
                        />
                    </div>
                    <div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2 text-muted-foreground">
                                <Users className="h-4 w-4" /> Teachers
                            </span>
                            <span className={usage.totalTeachers >= (planLimits.maxTeachers || 0) && planLimits.maxTeachers ? "font-medium text-destructive" : ""}>
                                {usage.totalTeachers} / {planLimits.maxTeachers || "—"}
                            </span>
                        </div>
                        <Progress
                            value={planLimits.maxTeachers ? Math.min(100, (usage.totalTeachers / planLimits.maxTeachers) * 100) : 0}
                            className="mt-2 h-2"
                        />
                    </div>
                </div>
            </Card>

            <div>
                <h2 className="mb-4 text-lg font-semibold">Available plans</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {(plans ?? []).map((p: any) => {
                        const isCurrent = p.name === planLimits.planName;
                        return (
                            <Card
                                key={p._id}
                                className={`relative rounded-2xl p-6 ${
                                    isCurrent ? "border-primary bg-primary/5" : ""
                                }`}
                            >
                                {isCurrent && (
                                    <span className="absolute right-4 top-4 rounded-md bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                        Current
                                    </span>
                                )}
                                <div className="font-semibold">{p.name}</div>
                                <div className="mt-1 text-xl font-bold text-primary">
                                    {isFreePlan(p) ? "Free" : `₹${Number(p.priceMonthly).toLocaleString()}/mo`}
                                </div>
                                {!isFreePlan(p) && Number(p.priceMonthly) > 0 && (
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        Yearly: ₹{(Number(p.priceMonthly) * 11).toLocaleString()}/yr <span className="text-emerald-600">(1 month free)</span>
                                    </p>
                                )}
                                {p.description && (
                                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                                )}
                                <div className="mt-2 text-sm text-muted-foreground">
                                    Students: {p.maxStudents} · Teachers: {p.maxTeachers}
                                </div>
                                {!isCurrent && (
                                    <div className="mt-4 flex gap-2">
                                        <Button
                                            size="sm"
                                            className="flex-1 gap-1.5"
                                            disabled={checkoutMutation.isPending}
                                            onClick={() => checkoutMutation.mutate({ planId: p._id, interval: "monthly" })}
                                        >
                                            {isFreePlan(p) ? (
                                                <>Switch to free</>
                                            ) : (
                                                <><CreditCard className="h-3.5 w-3.5" /> Upgrade (monthly)</>
                                            )}
                                        </Button>
                                        {!isFreePlan(p) && Number(p.priceMonthly) > 0 && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                disabled={checkoutMutation.isPending}
                                                onClick={() => checkoutMutation.mutate({ planId: p._id, interval: "yearly" })}
                                            >
                                                Yearly (1 free month)
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
