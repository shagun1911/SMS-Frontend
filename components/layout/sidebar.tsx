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
    CalendarDays,
    FileText,
    Settings,
    ShieldCheck,
    Building2,
    CreditCard,
    Layers,
    History
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
            label: "Attendance",
            icon: CalendarDays,
            href: "/attendance",
            roles: [UserRole.SCHOOL_ADMIN, UserRole.TEACHER],
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
        <div className={cn("pb-12 h-screen border-r bg-card", className)}>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-lg font-bold tracking-tight text-primary flex items-center gap-2">
                        <div className="bg-primary/10 p-2 rounded-lg">
                            <ShieldCheck className="h-5 w-5 text-primary" />
                        </div>
                        SSMS
                    </h2>
                    <div className="space-y-1 mt-6">
                        {filteredRoutes.map((route) => (
                            <Link
                                key={route.href}
                                href={route.href}
                                className={cn(
                                    "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                                    pathname === route.href || pathname?.startsWith(route.href + "/")
                                        ? "bg-accent text-accent-foreground"
                                        : "text-muted-foreground"
                                )}
                            >
                                <route.icon className="mr-2 h-4 w-4" />
                                {route.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
