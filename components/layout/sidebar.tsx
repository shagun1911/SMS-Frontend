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
    UserX
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
            label: "Schools",
            icon: Building2,
            href: "/master/schools",
            roles: [UserRole.SUPER_ADMIN],
        },
        {
            label: "Plans",
            icon: Layers,
            href: "/master/plans",
            roles: [UserRole.SUPER_ADMIN],
        },
        {
            label: "Subscriptions",
            icon: CreditCard,
            href: "/master/subscriptions",
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
            label: "Fee Structure",
            icon: Layers,
            href: "/fees/structure",
            roles: [UserRole.SCHOOL_ADMIN, UserRole.ACCOUNTANT],
            exact: true,
        },
        {
            label: "Collect Fee",
            icon: Banknote,
            href: "/fees",
            roles: [UserRole.SCHOOL_ADMIN, UserRole.ACCOUNTANT],
            exact: true, // only active on /fees, not /fees/structure, /fees/receipts, etc.
        },
        {
            label: "Receipts",
            icon: Receipt,
            href: "/fees/receipts",
            roles: [UserRole.SCHOOL_ADMIN, UserRole.ACCOUNTANT],
            exact: true,
        },
        {
            label: "Defaulters",
            icon: UserX,
            href: "/fees/defaulters",
            roles: [UserRole.SCHOOL_ADMIN, UserRole.ACCOUNTANT],
            exact: true,
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
            label: "Settings",
            icon: Settings,
            href: "/settings",
            roles: [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN],
        },
    ];

    const allRoutes = [...commonRoutes, ...masterRoutes, ...schoolRoutes, ...settingsRoutes];
    const filteredRoutes = allRoutes.filter((route) => route.roles.includes(role));

    return (
        <div className={cn("pb-12 h-screen border-r border-[hsl(var(--border))] bg-[hsl(var(--card))] w-64 shrink-0", className)}>
            <div className="flex h-full flex-col py-5">
                <div className="px-4 mb-6">
                    <div className="flex items-center gap-3 rounded-xl border border-[hsl(var(--border))] bg-white px-4 py-3 shadow-sm transition-smooth">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                            <School className="h-5 w-5" />
                        </div>
                        <span className="text-base font-bold tracking-tight text-[hsl(var(--foreground))]">SMS</span>
                    </div>
                </div>
                <nav className="flex-1 space-y-0.5 px-3">
                    {filteredRoutes.map((route) => {
                        const exact = (route as { exact?: boolean }).exact;
                        const isActive = exact
                            ? pathname === route.href
                            : (pathname === route.href || pathname?.startsWith(route.href + "/"));
                        return (
                            <Link
                                key={route.href}
                                href={route.href}
                                className={cn(
                                    "flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-smooth active:scale-[0.98]",
                                    isActive
                                        ? "bg-primary text-primary-foreground shadow-md"
                                        : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))] border border-transparent hover:border-[hsl(var(--border))]"
                                )}
                            >
                                <route.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-primary-foreground" : "text-[hsl(var(--muted-foreground))]")} />
                                {route.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}
