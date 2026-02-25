"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { OverviewChart } from "@/components/dashboard/overview-chart";
import { GenderRatioChart } from "@/components/dashboard/gender-ratio-chart";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { AiChatPanel } from "@/components/ai/ai-chat-panel";
import { usePlanLimits } from "@/context/plan-limits";
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
    Zap,
    X,
    Info,
    AlertTriangle,
    AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const ANNOUNCEMENT_PRIORITY_STYLES: Record<string, string> = {
    info: "border-sky-200 bg-sky-50 text-sky-900",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
    critical: "border-red-200 bg-red-50 text-red-900",
};
const ANNOUNCEMENT_ICONS: Record<string, typeof Info> = { info: Info, warning: AlertTriangle, critical: AlertCircle };

export default function SchoolDashboardPage() {
    const { user } = useAuthStore();
    const { hasFeature } = usePlanLimits();
    const [dismissedAnnouncementIds, setDismissedAnnouncementIds] = useState<string[]>([]);

    const { data: activeAnnouncements } = useQuery({
        queryKey: ["announcements-active"],
        queryFn: async () => {
            const res = await api.get("/announcements/active");
            return res.data?.data ?? [];
        },
    });

    const announcements = Array.isArray(activeAnnouncements)
        ? activeAnnouncements.filter((a: { _id: string }) => !dismissedAnnouncementIds.includes(a._id))
        : [];

    const dismissAnnouncement = (id: string) => {
        setDismissedAnnouncementIds((prev) => [...prev, id]);
    };

    const { data: stats, isLoading } = useQuery({
        queryKey: ["school-stats"],
        queryFn: async () => {
            const res = await api.get("/schools/stats");
            return res.data.data;
        },
    });

    const { data: feeStats } = useQuery({
        queryKey: ["fees-stats"],
        queryFn: async () => {
            const res = await api.get("/fees/stats");
            return res.data.data;
        },
    });

    if (isLoading) {
        return (
            <div className="flex h-[80vh] w-full items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col gap-8 lg:flex-row lg:gap-10">
            <div className="min-w-0 flex-1 space-y-8">
                {/* Mobile: AI first (only if plan includes AI) */}
                {hasFeature("ai") && (
                    <div className="lg:hidden">
                        <AiChatPanel />
                    </div>
                )}

                {/* Header: more breathing room */}
                <header className="animate-fade-in-up flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))] sm:text-3xl">
                            Dashboard
                        </h1>
                        <p className="mt-1 text-[hsl(var(--muted-foreground))]">
                            Welcome back, <span className="font-medium text-[hsl(var(--foreground))]">{user?.name || "Admin"}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="rounded-xl" aria-label="Notifications">
                            <Bell className="h-4 w-4" />
                        </Button>
                        <Button className="gap-2 rounded-xl" asChild>
                            <Link href="/exams">
                                <Calendar className="h-4 w-4" />
                                Schedule Exam
                            </Link>
                        </Button>
                    </div>
                </header>

                {/* System announcements banner */}
                {announcements.length > 0 && (
                    <div className="animate-fade-in-up space-y-2" style={{ animationFillMode: "both" }}>
                        {announcements.map((a: { _id: string; title: string; message: string; priority: string }) => {
                            const style = ANNOUNCEMENT_PRIORITY_STYLES[a.priority] ?? ANNOUNCEMENT_PRIORITY_STYLES.info;
                            const Icon = ANNOUNCEMENT_ICONS[a.priority] ?? Info;
                            return (
                                <div
                                    key={a._id}
                                    className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${style}`}
                                >
                                    <Icon className="mt-0.5 h-5 w-5 shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium">{a.title}</p>
                                        {a.message && <p className="mt-0.5 text-sm opacity-90">{a.message}</p>}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 shrink-0 opacity-70 hover:opacity-100"
                                        aria-label="Dismiss"
                                        onClick={() => dismissAnnouncement(a._id)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Plan warnings: compact */}
                {(stats?.studentLimitWarning === "warning" ||
                    stats?.studentLimitWarning === "exceeded" ||
                    stats?.teacherLimitWarning === "warning" ||
                    stats?.teacherLimitWarning === "exceeded") && (
                    <div className="animate-fade-in-up animation-delay-100 space-y-2" style={{ animationFillMode: "both" }}>
                        {stats?.studentLimitWarning === "exceeded" && (
                            <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                                Student limit exceeded ({stats?.usage?.totalStudents}/{stats?.planLimits?.maxStudents}). Upgrade to add more.
                            </div>
                        )}
                        {stats?.studentLimitWarning === "warning" && stats?.studentLimitWarning !== "exceeded" && (
                            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/50 px-4 py-3 text-sm text-[hsl(var(--foreground))]">
                                Using {stats?.usage?.totalStudents} of {stats?.planLimits?.maxStudents} student slots.
                            </div>
                        )}
                        {stats?.teacherLimitWarning === "exceeded" && (
                            <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                                Teacher limit exceeded ({stats?.usage?.totalTeachers}/{stats?.planLimits?.maxTeachers}). Upgrade to add more.
                            </div>
                        )}
                        {stats?.teacherLimitWarning === "warning" && stats?.teacherLimitWarning !== "exceeded" && (
                            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/50 px-4 py-3 text-sm text-[hsl(var(--foreground))]">
                                Using {stats?.usage?.totalTeachers} of {stats?.planLimits?.maxTeachers} teacher slots.
                            </div>
                        )}
                    </div>
                )}

                {/* Quick actions: single row, subtle style */}
                <Card className="animate-fade-in-up animation-delay-100 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-card" style={{ animationFillMode: "both" }}>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-[hsl(var(--muted-foreground))]">
                            <Zap className="h-4 w-4 text-primary" />
                            Quick actions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                        <Button asChild variant="outline" size="sm" className="rounded-xl">
                            <Link href="/students"><PlusCircle className="mr-1.5 h-4 w-4" /> Add Student</Link>
                        </Button>
                        <Button asChild variant="outline" size="sm" className="rounded-xl">
                            <Link href="/fees"><Banknote className="mr-1.5 h-4 w-4" /> Collect Fee</Link>
                        </Button>
                        <Button asChild variant="outline" size="sm" className="rounded-xl">
                            <Link href="/staff"><Users className="mr-1.5 h-4 w-4" /> Payroll</Link>
                        </Button>
                        <Button asChild variant="outline" size="sm" className="rounded-xl">
                            <Link href="/timetable"><CalendarDays className="mr-1.5 h-4 w-4" /> Timetable</Link>
                        </Button>
                        <Button asChild variant="outline" size="sm" className="rounded-xl">
                            <Link href="/admit-cards"><IdCard className="mr-1.5 h-4 w-4" /> Admit Cards</Link>
                        </Button>
                    </CardContent>
                </Card>

                {/* Stats */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard animationDelay={150} variant="emerald" title="Total Students" value={stats?.totalStudents ?? 0} description="Active enrollments" icon={GraduationCap} />
                    <StatCard animationDelay={220} variant="violet" title="Active Staff" value={stats?.activeStaff ?? 0} description="Verified employees" icon={Users} />
                    <StatCard
                        animationDelay={290}
                        variant="amber"
                        title="Total Collected"
                        value={feeStats?.totalCollected != null ? `₹${(feeStats.totalCollected / 100000).toFixed(1)}L` : `₹${((stats?.monthlyCollection ?? 0) / 100000).toFixed(1)}L`}
                        description="Fee collection"
                        icon={IndianRupee}
                    />
                    <StatCard
                        animationDelay={360}
                        variant="blue"
                        title="Pending Fees"
                        value={feeStats?.outstanding != null ? `₹${(feeStats.outstanding / 100000).toFixed(1)}L` : `₹${((stats?.pendingFees ?? 0) / 100000).toFixed(1)}L`}
                        description={`${feeStats?.defaulterCount ?? stats?.pendingFeesCount ?? 0} defaulters`}
                        icon={Wallet}
                    />
                </div>

                {/* Charts row */}
                <div className="grid gap-6 lg:grid-cols-7">
                    <Card className="animate-fade-in-up animation-delay-200 col-span-1 lg:col-span-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-card" style={{ animationFillMode: "both" }}>
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold text-[hsl(var(--foreground))]">Fee collection overview</CardTitle>
                        </CardHeader>
                        <CardContent className="pl-0">
                            <OverviewChart
                                data={
                                    feeStats?.monthlyCollection?.length
                                        ? feeStats.monthlyCollection.map((m: { month: string; amount: number }) => ({ name: m.month, total: m.amount }))
                                        : stats?.monthlyTrends
                                }
                            />
                        </CardContent>
                    </Card>
                    <Card className="animate-fade-in-up animation-delay-300 col-span-1 lg:col-span-3 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-card" style={{ animationFillMode: "both" }}>
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold text-[hsl(var(--foreground))]">Student gender ratio</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <GenderRatioChart male={stats?.genderRatio?.male ?? 0} female={stats?.genderRatio?.female ?? 0} />
                        </CardContent>
                    </Card>
                </div>

                {/* Metrics + Activity row */}
                <div className="grid gap-6 lg:grid-cols-3">
                    <Card className="animate-fade-in-up animation-delay-300 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-card" style={{ animationFillMode: "both" }}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold text-[hsl(var(--muted-foreground))]">Collection rate</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-[hsl(var(--foreground))]">{feeStats?.collectionRate ?? stats?.collectionRate ?? 0}%</p>
                            <Progress value={feeStats?.collectionRate ?? stats?.collectionRate ?? 0} className="mt-3 h-2 rounded-full" />
                            <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">Current month</p>
                        </CardContent>
                    </Card>
                    <Card className="animate-fade-in-up animation-delay-400 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-card" style={{ animationFillMode: "both" }}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold text-[hsl(var(--muted-foreground))]">Active classes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-[hsl(var(--foreground))]">{stats?.totalClasses ?? 0}</p>
                            <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">{stats?.totalSections ?? 0} sections</p>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">Avg {stats?.avgClassSize ?? 0} students/class</p>
                        </CardContent>
                    </Card>
                    <Card className="animate-fade-in-up animation-delay-400 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-card lg:col-span-1" style={{ animationFillMode: "both" }}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold text-[hsl(var(--muted-foreground))]">Announcements</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-[hsl(var(--muted-foreground))]">No new announcements.</p>
                            <Button variant="outline" size="sm" className="mt-3 rounded-xl" disabled>
                                Post (coming soon)
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent activity full width */}
                <Card className="animate-fade-in-up animation-delay-500 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-card" style={{ animationFillMode: "both" }}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-[hsl(var(--foreground))]">
                            <School className="h-4 w-4 text-primary" />
                            Recent activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <RecentActivity activities={stats?.recentActivities} />
                    </CardContent>
                </Card>

                {/* Defaulters CTA */}
                {((feeStats?.defaulterCount ?? stats?.pendingFeesCount) ?? 0) > 0 && (
                    <Card className="animate-fade-in-up rounded-2xl border border-destructive/20 bg-destructive/5" style={{ animationDelay: "600ms", animationFillMode: "both" }}>
                        <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
                            <div className="flex items-center gap-3">
                                <Wallet className="h-9 w-9 text-destructive" />
                                <div>
                                    <p className="font-semibold text-[hsl(var(--foreground))]">{feeStats?.defaulterCount ?? stats?.pendingFeesCount} with pending fees</p>
                                    <p className="text-sm text-[hsl(var(--muted-foreground))]">Outstanding: ₹{((feeStats?.outstanding ?? stats?.pendingFees ?? 0) / 1000).toFixed(1)}K</p>
                                </div>
                            </div>
                            <Button asChild className="rounded-xl" size="sm">
                                <Link href="/fees">Collect now</Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Desktop: AI panel (only if plan includes AI) */}
            {hasFeature("ai") && (
                <aside className="hidden w-[360px] shrink-0 lg:block">
                    <div className="sticky top-4">
                        <AiChatPanel />
                    </div>
                </aside>
            )}
        </div>
    );
}
