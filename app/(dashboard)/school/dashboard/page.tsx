"use client";
import { useAuthStore } from "@/store/authStore";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import api from "@/lib/api";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { OverviewChart } from "@/components/dashboard/overview-chart";
import { GenderRatioChart } from "@/components/dashboard/gender-ratio-chart";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import {
    School,
    Users,
    GraduationCap,
    IndianRupee,
    Calendar,
    Bell,
    Wallet,
    Loader2,
    TrendingUp,
    UserCheck,
    PlusCircle,
    Banknote,
    IdCard,
    CalendarDays,
    Megaphone,
    Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

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
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                        Institutional Dashboard
                    </h2>
                    <p className="text-gray-500 mt-1">
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

            {/* Quick Actions - Surprise 1 */}
            <Card className="border border-indigo-100 bg-gradient-to-r from-indigo-50/80 to-white shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base text-gray-900">
                        <Zap className="h-5 w-5 text-indigo-600" /> Quick Actions
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                    <Button asChild variant="outline" size="sm" className="rounded-xl border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                        <Link href="/students"><PlusCircle className="mr-2 h-4 w-4" /> Add Student</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                        <Link href="/fees"><Banknote className="mr-2 h-4 w-4" /> Collect Fee</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="rounded-xl border-amber-200 text-amber-700 hover:bg-amber-50">
                        <Link href="/staff"><Users className="mr-2 h-4 w-4" /> Payroll</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50">
                        <Link href="/timetable"><CalendarDays className="mr-2 h-4 w-4" /> Timetable</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50">
                        <Link href="/admit-cards"><IdCard className="mr-2 h-4 w-4" /> Admit Cards</Link>
                    </Button>
                </CardContent>
            </Card>

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
                    value={`₹${((stats?.monthlyCollection ?? 0) / 100000).toFixed(1)}L`}
                    description="Current month fees"
                    icon={IndianRupee}
                />
                <StatCard
                    title="Pending Fees"
                    value={`₹${((stats?.pendingFees ?? 0) / 100000).toFixed(1)}L`}
                    description={`${stats?.pendingFeesCount || 0} students pending`}
                    icon={Wallet}
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 border border-gray-200 bg-white shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-gray-900">
                            <TrendingUp className="h-5 w-5 text-indigo-600" />
                            Fee Collection Overview
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <OverviewChart data={stats?.monthlyTrends} />
                    </CardContent>
                </Card>
                <Card className="col-span-3 border border-gray-200 bg-white shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-gray-900">
                            <UserCheck className="h-5 w-5 text-pink-600" />
                            Student Gender Ratio
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <GenderRatioChart 
                            male={stats?.genderRatio?.male || 0}
                            female={stats?.genderRatio?.female || 0}
                        />
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border border-gray-200 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600">Attendance Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-indigo-600">
                            {stats?.attendanceRate || 0}%
                        </p>
                        <Progress value={stats?.attendanceRate || 0} className="mt-3 h-2" />
                        <p className="mt-2 text-xs text-gray-600">
                            Based on last 30 days
                        </p>
                    </CardContent>
                </Card>
                <Card className="border border-gray-200 bg-gradient-to-br from-emerald-50 to-green-50 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600">Fee Collection Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-emerald-600">
                            {stats?.collectionRate || 0}%
                        </p>
                        <Progress value={stats?.collectionRate || 0} className="mt-3 h-2 bg-emerald-100" />
                        <p className="mt-2 text-xs text-gray-600">
                            Current month target
                        </p>
                    </CardContent>
                </Card>
                <Card className="border border-gray-200 bg-gradient-to-br from-amber-50 to-orange-50 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600">Active Classes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-amber-600">
                            {stats?.totalClasses || 0}
                        </p>
                        <p className="mt-3 text-sm text-gray-600">
                            {stats?.totalSections || 0} sections
                        </p>
                        <p className="text-xs text-gray-500">
                            Avg {stats?.avgClassSize || 0} students/class
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card className="border border-gray-200 bg-white shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-gray-900">
                            <School className="h-5 w-5 text-indigo-600" />
                            Recent Activities
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <RecentActivity activities={stats?.recentActivities} />
                    </CardContent>
                </Card>
                {/* Announcements / Bulletin - Surprise 2 */}
                <Card className="border border-amber-100 bg-gradient-to-br from-amber-50/50 to-white shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-gray-900">
                            <Megaphone className="h-5 w-5 text-amber-600" />
                            Announcements
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-500">No new announcements. Post school notices and circulars here.</p>
                        <Button variant="outline" size="sm" className="mt-3 rounded-xl border-amber-200 text-amber-700 hover:bg-amber-50" disabled>
                            Post Announcement (coming soon)
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Pending fees reminder - Surprise 4 */}
            {(stats?.pendingFeesCount ?? 0) > 0 && (
                <Card className="border border-rose-100 bg-rose-50/50 shadow-sm">
                    <CardContent className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-3">
                            <Wallet className="h-10 w-10 text-rose-600" />
                            <div>
                                <p className="font-semibold text-gray-900">{stats.pendingFeesCount} students with pending fees</p>
                                <p className="text-sm text-gray-500">Outstanding: ₹{((stats.pendingFees ?? 0) / 1000).toFixed(1)}K</p>
                            </div>
                        </div>
                        <Button asChild className="rounded-xl bg-rose-600 hover:bg-rose-500">
                            <Link href="/fees">Collect Now</Link>
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
