"use client";

import { useAuthStore } from "@/store/authStore";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { OverviewChart } from "@/components/dashboard/overview-chart";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import {
    ShieldCheck,
    Globe,
    Users,
    Building2,
    Activity,
    Zap,
    LayoutDashboard,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MasterDashboardPage() {
    const { user } = useAuthStore();

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ["master-stats"],
        queryFn: async () => {
            const res = await api.get("/master/stats");
            return res.data.data;
        }
    });

    const { data: activity, isLoading: activityLoading } = useQuery({
        queryKey: ["master-activity"],
        queryFn: async () => {
            const res = await api.get("/master/activity");
            return res.data.data;
        }
    });

    if (statsLoading || activityLoading) {
        return (
            <div className="flex h-[80vh] w-full items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                        Master Console
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Global overview of the SSMS Ecosystem
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="gap-2">
                        <Globe className="h-4 w-4" /> Global Logs
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-500 gap-2">
                        <ShieldCheck className="h-4 w-4" /> Security Audit
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Schools"
                    value={stats?.totalSchools || 0}
                    description="Registered institutions"
                    icon={Building2}
                />
                <StatCard
                    title="Global Students"
                    value={stats?.totalStudents || 0}
                    description="Active across network"
                    icon={Users}
                />
                <StatCard
                    title="Revenue"
                    value={`₹${(stats?.revenue / 100000).toFixed(1)}L`}
                    description="Total Lifetime Value"
                    icon={Zap}
                />
                <StatCard
                    title="Active Sessions"
                    value={stats?.activeSessions || 0}
                    description="Real-time traffic"
                    icon={Activity}
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 border-white/5 bg-neutral-900/50 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <LayoutDashboard className="h-5 w-5 text-blue-400" />
                            Global Registration Growth
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <OverviewChart data={stats?.monthlyTrends} />
                    </CardContent>
                </Card>
                <Card className="col-span-3 border-white/5 bg-neutral-900/50 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5 text-emerald-400" />
                            Recent Infrastructure Events
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <RecentActivity activities={activity} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
