"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { UserRole } from "@/types";
import {
    LayoutDashboard,
    Users,
    GraduationCap,
    Banknote,
    Bus,
    FileText,
    Settings,
    ShieldCheck,
    School,
    Building2,
    CreditCard,
    Layers,
    History,
    BookOpen,
    IdCard,
    CalendarDays,
    Receipt,
    UserX,
    BarChart3,
    Wallet,
    Sparkles,
    Lock,
    Bell,
    ArrowUpRight,
    Megaphone,
    Headphones,
    Activity,
} from "lucide-react";
import { usePlanLimits } from "@/context/plan-limits";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname();
    const { user } = useAuthStore();
    const { hasFeature } = usePlanLimits();
    const role = user?.role;

    // Return null if no user/role yet (prevents UI flicker of master admin items)
    if (!role) return null;

    const dashboardHref = role === UserRole.SUPER_ADMIN
        ? "/master/dashboard"
        : role === UserRole.TEACHER
            ? "/teacher/dashboard"
            : "/school/dashboard";

    const commonRoutes = [
        {
            label: "Dashboard",
            icon: LayoutDashboard,
            href: dashboardHref,
            roles: [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.ACCOUNTANT],
            featureKey: "dashboard",
        },
    ];

    const masterRoutes = [
        {
            label: "Schools",
            icon: Building2,
            href: "/master/schools",
            roles: [UserRole.SUPER_ADMIN],
        },
        {
            label: "Users & Billing",
            icon: Users,
            href: "/master/users-billing",
            roles: [UserRole.SUPER_ADMIN],
        },
        {
            label: "Plans Management",
            icon: Layers,
            href: "/master/plans",
            roles: [UserRole.SUPER_ADMIN],
        },
        {
            label: "Usage Reports",
            icon: BarChart3,
            href: "/master/usage-reports",
            roles: [UserRole.SUPER_ADMIN],
        },
        {
            label: "Billing Overview",
            icon: Wallet,
            href: "/master/billing-overview",
            roles: [UserRole.SUPER_ADMIN],
        },
        {
            label: "Announcements",
            icon: Megaphone,
            href: "/master/announcements",
            roles: [UserRole.SUPER_ADMIN],
        },
        {
            label: "Support",
            icon: Headphones,
            href: "/master/support",
            roles: [UserRole.SUPER_ADMIN],
        },
        {
            label: "System Health",
            icon: Activity,
            href: "/master/system-health",
            roles: [UserRole.SUPER_ADMIN],
        },
    ];

    const schoolRoutes = [
        { label: "Students", icon: GraduationCap, href: "/students", roles: [UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.ACCOUNTANT], featureKey: "students" },
        { label: "Classes", icon: BookOpen, href: "/classes", roles: [UserRole.SCHOOL_ADMIN, UserRole.TEACHER], featureKey: "classes" },
        { label: "Staff", icon: Users, href: "/staff", roles: [UserRole.SCHOOL_ADMIN], featureKey: "staff" },
        { label: "Payroll", icon: Wallet, href: "/payroll", roles: [UserRole.SCHOOL_ADMIN, UserRole.ACCOUNTANT], featureKey: "staff" },
        { label: "Fee Structure", icon: Layers, href: "/fees/structure", roles: [UserRole.SCHOOL_ADMIN, UserRole.ACCOUNTANT], exact: true, featureKey: "fees" },
        { label: "Collect Fee", icon: Banknote, href: "/fees", roles: [UserRole.SCHOOL_ADMIN, UserRole.ACCOUNTANT], exact: true, featureKey: "fees" },
        { label: "Receipts", icon: Receipt, href: "/fees/receipts", roles: [UserRole.SCHOOL_ADMIN, UserRole.ACCOUNTANT], exact: true, featureKey: "fees" },
        { label: "Defaulters", icon: UserX, href: "/fees/defaulters", roles: [UserRole.SCHOOL_ADMIN, UserRole.ACCOUNTANT], exact: true, featureKey: "fees" },
        { label: "Transport", icon: Bus, href: "/transport", roles: [UserRole.SCHOOL_ADMIN, UserRole.TRANSPORT_MANAGER], featureKey: "transport" },
        { label: "Exams", icon: FileText, href: "/exams", roles: [UserRole.SCHOOL_ADMIN, UserRole.TEACHER], featureKey: "exams" },
        { label: "Admit Cards", icon: IdCard, href: "/admit-cards", roles: [UserRole.SCHOOL_ADMIN, UserRole.TEACHER], featureKey: "admit_cards" },
        { label: "Timetable", icon: CalendarDays, href: "/timetable", roles: [UserRole.SCHOOL_ADMIN, UserRole.TEACHER], featureKey: "timetable" },
        { label: "Promotion", icon: ArrowUpRight, href: "/promotion", roles: [UserRole.SCHOOL_ADMIN], featureKey: "students" },
        { label: "Notifications", icon: Bell, href: "/notifications", roles: [UserRole.SCHOOL_ADMIN], featureKey: "students" },
        { label: "Sessions", icon: CalendarDays, href: "/sessions", roles: [UserRole.SCHOOL_ADMIN], featureKey: "sessions" },
        { label: "Plan & Billing", icon: Sparkles, href: "/plan", roles: [UserRole.SCHOOL_ADMIN], featureKey: "plan_billing" },
        { label: "Support", icon: Headphones, href: "/support", roles: [UserRole.SCHOOL_ADMIN] },
    ];

    const settingsRoutes = [
        {
            label: "Settings",
            icon: Settings,
            href: "/settings",
            roles: [UserRole.SCHOOL_ADMIN],
        },
    ];

    const allRoutes = [...commonRoutes, ...masterRoutes, ...schoolRoutes, ...settingsRoutes];
    const filteredRoutes = allRoutes.filter((route) => route.roles.includes(role));

    return (
        <div className={cn("h-screen border-r border-[hsl(var(--border))] bg-[hsl(var(--card))] w-64 shrink-0 flex flex-col", className)}>
            {/* Logo – fixed at top */}
            <div className="px-4 pt-5 pb-4 shrink-0">
                <div className="flex items-center gap-3 rounded-xl border border-[hsl(var(--border))] bg-white px-4 py-3 shadow-sm transition-smooth">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                        <School className="h-5 w-5" />
                    </div>
                    <span className="text-base font-bold tracking-tight text-[hsl(var(--foreground))]">SMS</span>
                </div>
            </div>

            {/* Scrollable nav */}
            <nav className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 pb-6 space-y-0.5 scrollbar-thin">
                {filteredRoutes.map((route) => {
                    const exact = (route as { exact?: boolean }).exact;
                    const featureKey = (route as { featureKey?: string }).featureKey;
                    const locked = featureKey && role !== UserRole.SUPER_ADMIN && !hasFeature(featureKey);
                    const isActive = exact
                        ? pathname === route.href
                        : (pathname === route.href || pathname?.startsWith(route.href + "/"));
                    return (
                        <Link
                            key={route.href}
                            href={locked ? "/plan" : route.href}
                            className={cn(
                                "flex min-h-[40px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-smooth active:scale-[0.98]",
                                isActive && !locked
                                    ? "bg-primary text-primary-foreground shadow-md"
                                    : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))] border border-transparent hover:border-[hsl(var(--border))]",
                                locked && "opacity-80"
                            )}
                            title={locked ? "Upgrade your plan to use this feature" : undefined}
                        >
                            <route.icon className={cn("h-5 w-5 shrink-0", isActive && !locked ? "text-primary-foreground" : "text-[hsl(var(--muted-foreground))]")} />
                            {route.label}
                            {locked && <Lock className="ml-auto h-3.5 w-3.5 shrink-0 text-amber-500" />}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
