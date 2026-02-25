"use client";

import { useQuery } from "@tanstack/react-query";
import { Activity, BarChart3, Loader2, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import api from "@/lib/api";

export default function MasterUsageReportsPage() {
    const { data, isLoading } = useQuery({
        queryKey: ["master-usage-reports"],
        queryFn: async () => {
            const res = await api.get("/master/usage-reports");
            return res.data?.data?.reports ?? [];
        },
    });

    const reports = data ?? [];

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
                <h1 className="text-2xl font-bold tracking-tight">Platform Activity</h1>
                <p className="mt-1 text-sm text-muted-foreground">Subscription status and expiry by organization. No per-school usage counts.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <Card className="rounded-2xl p-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <BarChart3 className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Organizations</p>
                            <p className="text-2xl font-bold">{reports.length}</p>
                        </div>
                    </div>
                </Card>
                <Card className="rounded-2xl p-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Activity className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Active (with valid subscription)</p>
                            <p className="text-2xl font-bold">
                                {reports.filter((r: any) => r.subscriptionStatus === "active").length}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            <Card className="overflow-hidden rounded-2xl">
                <div className="border-b px-6 py-4">
                    <h2 className="font-semibold">Platform activity by organization</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/50 text-left font-medium text-muted-foreground">
                                <th className="p-4">Organization</th>
                                <th className="p-4">Plan</th>
                                <th className="p-4">Subscription status</th>
                                <th className="p-4">Days until expiry</th>
                                <th className="p-4">Last subscription change</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reports.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-muted-foreground">No data.</td>
                                </tr>
                            ) : (
                                reports.map((r: any) => (
                                    <tr key={r.schoolId} className="border-b hover:bg-muted/30">
                                        <td className="p-4">
                                            <div className="font-medium">{r.schoolName}</div>
                                            <div className="text-xs text-muted-foreground">{r.schoolCode}</div>
                                        </td>
                                        <td className="p-4">{r.planName}</td>
                                        <td className="p-4">
                                            <span
                                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                                    r.subscriptionStatus === "active"
                                                        ? "bg-emerald-100 text-emerald-700"
                                                        : r.subscriptionStatus === "expired"
                                                            ? "bg-red-100 text-red-700"
                                                            : "bg-gray-100 text-gray-600"
                                                }`}
                                            >
                                                {r.subscriptionStatus ?? "—"}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {r.daysUntilExpiry != null ? (
                                                <span className={r.daysUntilExpiry <= 30 ? "font-medium text-amber-600" : ""}>
                                                    {r.daysUntilExpiry} days
                                                </span>
                                            ) : (
                                                "—"
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {r.lastSubscriptionChange ? (
                                                <span className="inline-flex items-center gap-1">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    {new Date(r.lastSubscriptionChange).toLocaleDateString(undefined, { dateStyle: "medium" })}
                                                </span>
                                            ) : (
                                                "—"
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
