"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { OverviewChart } from "@/components/dashboard/overview-chart";
import { Building2, Users, GraduationCap, Banknote, TrendingUp, Loader2 } from "lucide-react";

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

    return (
        <div className="flex-1 space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h2>
                <p className="text-gray-500 mt-1">SaaS control center – schools, plans & revenue</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Schools"
                    value={data?.totalSchools ?? 0}
                    description="Registered institutions"
                    icon={Building2}
                />
                <StatCard
                    title="Active Schools"
                    value={data?.activeSchools ?? 0}
                    description="Active subscription"
                    icon={TrendingUp}
                />
                <StatCard
                    title="Expired"
                    value={data?.expiredSchools ?? 0}
                    description="Expired / suspended"
                    icon={Building2}
                />
                <StatCard
                    title="Total Students"
                    value={data?.totalStudents ?? 0}
                    description="Across all schools"
                    icon={GraduationCap}
                />
                <StatCard
                    title="Total Teachers"
                    value={data?.totalTeachers ?? 0}
                    description="Across all schools"
                    icon={Users}
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
                    <CardTitle className="text-gray-900">Monthly new schools</CardTitle>
                </CardHeader>
                <CardContent>
                    <OverviewChart data={data?.monthlyNewSchools ?? []} />
                </CardContent>
            </Card>
        </div>
    );
}
