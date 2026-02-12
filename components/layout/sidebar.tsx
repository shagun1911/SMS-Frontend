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
    Building2,
    CreditCard,
    Layers,
    History,
    BookOpen,
    IdCard,
    CalendarDays
} from "lucide-react";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname();
    const { user } = useAuthStore();
    const role = user?.role;

    // Return null if no user/role yet (prevents UI flicker of master admin items)
    if (!role) return null;

    const dashboardHref = role === UserRole.SUPER_ADMIN
        ? "/master/dashboard"
        : "/school/dashboard";

    const commonRoutes = [
        {
            label: "Dashboard",
            icon: LayoutDashboard,
            href: dashboardHref,
            roles: [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.ACCOUNTANT],
        },
    ];

    const masterRoutes = [
        {
            label: "Manage Schools",
            icon: Building2,
            href: "/master/schools",
            roles: [UserRole.SUPER_ADMIN],
        },
        {
            label: "Plans & Pricing",
            icon: Layers,
            href: "/master/plans",
            roles: [UserRole.SUPER_ADMIN],
        },
        {
            label: "Global Payments",
            icon: CreditCard,
            href: "/master/payments",
            roles: [UserRole.SUPER_ADMIN],
        },
        {
            label: "System Logs",
            icon: History,
            href: "/master/logs",
            roles: [UserRole.SUPER_ADMIN],
        },
    ];

    const schoolRoutes = [
        {
            label: "Students",
            icon: GraduationCap,
            href: "/students",
            roles: [UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.ACCOUNTANT],
        },
        {
            label: "Classes",
            icon: BookOpen,
            href: "/classes",
            roles: [UserRole.SCHOOL_ADMIN, UserRole.TEACHER],
        },
        {
            label: "Staff",
            icon: Users,
            href: "/staff",
            roles: [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN],
        },
        {
            label: "Fees",
            icon: Banknote,
            href: "/fees",
            roles: [UserRole.SCHOOL_ADMIN, UserRole.ACCOUNTANT],
        },
        {
            label: "Transport",
            icon: Bus,
            href: "/transport",
            roles: [UserRole.SCHOOL_ADMIN, UserRole.TRANSPORT_MANAGER],
        },
        {
            label: "Exams",
            icon: FileText,
            href: "/exams",
            roles: [UserRole.SCHOOL_ADMIN, UserRole.TEACHER],
        },
        {
            label: "Admit Cards",
            icon: IdCard,
            href: "/admit-cards",
            roles: [UserRole.SCHOOL_ADMIN, UserRole.TEACHER],
        },
        {
            label: "Timetable",
            icon: CalendarDays,
            href: "/timetable",
            roles: [UserRole.SCHOOL_ADMIN, UserRole.TEACHER],
        },
        {
            label: "Sessions",
            icon: CalendarDays,
            href: "/sessions",
            roles: [UserRole.SCHOOL_ADMIN],
        },
    ];

    const settingsRoutes = [
        {
            label: "Audit Logs",
            icon: ShieldCheck,
            href: "/audit",
            roles: [UserRole.SUPER_ADMIN],
        },
        {
            label: "Settings",
            icon: Settings,
            href: "/settings",
            roles: [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN],
        },
    ];

    const allRoutes = [...commonRoutes, ...masterRoutes, ...schoolRoutes, ...settingsRoutes];
    const filteredRoutes = allRoutes.filter((route) => route.roles.includes(role));

    return (
        <div className={cn("pb-12 h-screen border-r border-slate-200 bg-slate-50/80 w-64 shrink-0", className)}>
            <div className="flex h-full flex-col py-5">
                <div className="px-4 mb-6">
                    <div className="flex items-center gap-3 rounded-xl bg-white border border-slate-200 px-4 py-3 shadow-sm">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                        <span className="text-base font-bold tracking-tight text-slate-900">SSMS</span>
                    </div>
                </div>
                <nav className="flex-1 space-y-0.5 px-3">
                    {filteredRoutes.map((route) => {
                        const isActive = pathname === route.href || pathname?.startsWith(route.href + "/");
                        return (
                            <Link
                                key={route.href}
                                href={route.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                                    isActive
                                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25"
                                        : "text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm border border-transparent hover:border-slate-200"
                                )}
                            >
                                <route.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-white" : "text-slate-500")} />
                                {route.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}
