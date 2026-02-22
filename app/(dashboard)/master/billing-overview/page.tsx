"use client";

import { useQuery } from "@tanstack/react-query";
import { Wallet, Loader2, TrendingUp, Building2, CreditCard } from "lucide-react";
import { Card } from "@/components/ui/card";
import api from "@/lib/api";

export default function MasterBillingOverviewPage() {
    const { data, isLoading } = useQuery({
        queryKey: ["master-billing-overview"],
        queryFn: async () => {
            const res = await api.get("/master/billing-overview");
            return res.data?.data ?? {};
        },
    });

    if (isLoading) {
        return (
            <div className="flex h-[80vh] w-full items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    const monthlyRevenue = data?.monthlyRevenue ?? 0;
    const annualRevenue = data?.annualRevenue ?? 0;
    const totalOrgs = data?.totalOrganizations ?? 0;
    const paidPlans = data?.paidPlans ?? 0;
    const distribution = data?.distribution ?? [];

    return (
        <div className="flex-1 space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Billing overview</h1>
                <p className="mt-1 text-sm text-muted-foreground">Revenue & subscription analytics.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="rounded-2xl p-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Monthly revenue</p>
                            <p className="text-2xl font-bold">₹{monthlyRevenue.toLocaleString()}</p>
                        </div>
                    </div>
                </Card>
                <Card className="rounded-2xl p-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Wallet className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Annual revenue</p>
                            <p className="text-2xl font-bold">₹{annualRevenue.toLocaleString()}</p>
                        </div>
                    </div>
                </Card>
                <Card className="rounded-2xl p-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                            <Building2 className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total organizations</p>
                            <p className="text-2xl font-bold">{totalOrgs}</p>
                        </div>
                    </div>
                </Card>
                <Card className="rounded-2xl p-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                            <CreditCard className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Paid plans</p>
                            <p className="text-2xl font-bold">{paidPlans}</p>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card className="rounded-2xl p-6">
                    <h2 className="mb-4 font-semibold">Plan distribution</h2>
                    <ul className="space-y-3">
                        {distribution.length === 0 ? (
                            <li className="text-sm text-muted-foreground">No plans in use yet.</li>
                        ) : (
                            distribution.map((d: any) => (
                                <li
                                    key={d.planId}
                                    className="flex items-center justify-between rounded-lg border px-4 py-3"
                                >
                                    <div>
                                        <span className="font-medium">{d.name}</span>
                                        <span className="ml-2 text-sm text-muted-foreground">
                                            ₹{d.priceMonthly}/mo · {d.count} orgs
                                        </span>
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                </Card>
                <Card className="rounded-2xl p-6">
                    <h2 className="mb-4 font-semibold">Revenue by plan</h2>
                    <ul className="space-y-3">
                        {distribution.length === 0 ? (
                            <li className="text-sm text-muted-foreground">No revenue data.</li>
                        ) : (
                            distribution.map((d: any) => (
                                <li
                                    key={d.planId}
                                    className="flex items-center justify-between rounded-lg border px-4 py-3"
                                >
                                    <span className="font-medium">{d.name}</span>
                                    <span className="text-sm">
                                        ₹{d.revenueMonthly?.toLocaleString()}/mo · ₹{d.revenueYearly?.toLocaleString()}/yr
                                    </span>
                                </li>
                            ))
                        )}
                    </ul>
                </Card>
            </div>
        </div>
    );
}
