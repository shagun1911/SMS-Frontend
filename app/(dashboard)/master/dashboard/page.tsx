"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { Building2, Banknote, TrendingUp, Loader2, Calendar, AlertCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function MasterDashboardPage() {
    const { data, isLoading } = useQuery({
        queryKey: ["master-dashboard"],
        queryFn: async () => {
            const res = await api.get("/master/dashboard");
            return res.data?.data ?? {};
        },
    });

    if (isLoading) {
        return (
            <div className="flex h-[80vh] w-full items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
            </div>
        );
    }

    const expiringSchools = data?.expiringSchools ?? [];
    const mrrTrend = data?.mrrTrend ?? [];

    return (
        <div className="flex-1 space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h2>
                <p className="text-gray-500 mt-1">SaaS control center – schools, plans & revenue</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="New This Month"
                    value={data?.newThisMonth ?? 0}
                    description="Schools registered this month"
                    icon={Building2}
                />
                <StatCard
                    title="Expiring in 30 Days"
                    value={expiringSchools.length}
                    description="Subscriptions ending soon"
                    icon={AlertCircle}
                />
                <StatCard
                    title="Active Schools"
                    value={data?.activeSchools ?? 0}
                    description="Active subscription"
                    icon={TrendingUp}
                />
                <StatCard
                    title="Revenue (MRR)"
                    value={`₹${Number(data?.revenue ?? 0).toLocaleString()}`}
                    description="Monthly recurring"
                    icon={Banknote}
                />
            </div>

            <Card className="border border-gray-200 bg-white shadow-sm">
                <CardHeader>
                    <CardTitle className="text-gray-900">12-month MRR trend</CardTitle>
                </CardHeader>
                <CardContent>
                    {mrrTrend.length === 0 ? (
                        <div className="flex h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 text-center">
                            <p className="text-sm font-medium text-gray-500">No revenue data yet</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={350}>
                            <LineChart data={mrrTrend}>
                                <XAxis
                                    dataKey="name"
                                    stroke="#6b7280"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#6b7280"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                                />
                                <Tooltip
                                    cursor={{ fill: "rgba(0,0,0,0.05)" }}
                                    content={({ active, payload }) => {
                                        if (active && payload?.[0]) {
                                            return (
                                                <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-md">
                                                    <span className="text-xs text-gray-500">MRR</span>
                                                    <p className="font-semibold text-gray-900">₹{Number(payload[0].value).toLocaleString()}</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke="hsl(var(--primary))"
                                    strokeWidth={2}
                                    dot={{ fill: "hsl(var(--primary))" }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>

            {expiringSchools.length > 0 && (
                <Card className="border border-gray-200 bg-white shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-gray-900">Expiring soon</CardTitle>
                        <p className="text-sm text-gray-500">Subscriptions ending within 30 days</p>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-gray-50 text-left font-medium text-gray-600">
                                        <th className="p-3">School</th>
                                        <th className="p-3">Plan</th>
                                        <th className="p-3">Subscription end</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {expiringSchools.map((s: any) => (
                                        <tr key={s._id} className="border-b hover:bg-gray-50">
                                            <td className="p-3">
                                                <div className="font-medium text-gray-900">{s.schoolName}</div>
                                                <div className="text-xs text-gray-500">{s.schoolCode}</div>
                                            </td>
                                            <td className="p-3">{s.planName}</td>
                                            <td className="p-3">
                                                <span className="inline-flex items-center gap-1">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    {s.subscriptionEnd ? new Date(s.subscriptionEnd).toLocaleDateString(undefined, { dateStyle: "medium" }) : "—"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
