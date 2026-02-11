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
    School,
    Users,
    GraduationCap,
    IndianRupee,
    Calendar,
    Bell,
    Wallet,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SchoolDashboardPage() {
    const { user } = useAuthStore();

    const { data: stats, isLoading } = useQuery({
        queryKey: ["school-stats"],
        queryFn: async () => {
            const res = await api.get("/schools/stats");
            return res.data.data;
        }
    });

    if (isLoading) {
        return (
            <div className="flex h-[80vh] w-full items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Institutional Dashboard
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Welcome back, {user?.name || "Admin"}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon">
                        <Bell className="h-4 w-4" />
                    </Button>
                    <Button className="bg-purple-600 hover:bg-purple-500 gap-2">
                        <Calendar className="h-4 w-4" /> Schedule Exam
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Students"
                    value={stats?.totalStudents || 0}
                    description="Active enrollments"
                    icon={GraduationCap}
                />
                <StatCard
                    title="Active Staff"
                    value={stats?.activeStaff || 0}
                    description="Verified employees"
                    icon={Users}
                />
                <StatCard
                    title="Monthly Collection"
                    value={`₹${(stats?.monthlyCollection / 100000).toFixed(1)}L`}
                    description="Current month fees"
                    icon={IndianRupee}
                />
                <StatCard
                    title="Pending Fees"
                    value={`₹${(stats?.pendingFees / 100000).toFixed(1)}L`}
                    description={`${stats?.pendingFeesCount || 0} students pending`}
                    icon={Wallet}
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 border-white/5 bg-neutral-900/50 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <IndianRupee className="h-5 w-5 text-purple-400" />
                            Fee Collection Overview
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <OverviewChart data={stats?.monthlyTrends} />
                    </CardContent>
                </Card>
                <Card className="col-span-3 border-white/5 bg-neutral-900/50 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <School className="h-5 w-5 text-pink-400" />
                            Recent school Updates
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <RecentActivity activities={stats?.recentActivities} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
