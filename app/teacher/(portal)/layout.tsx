"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { UserRole } from "@/types";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  FileText,
  Calendar,
  LogOut,
  GraduationCap,
  UserCircle,
  Bus,
} from "lucide-react";
import { cn } from "@/lib/utils";

const baseNavItems = [
  { href: "/teacher/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/teacher/classes", icon: Users, label: "My Classes" },
  { href: "/teacher/homework", icon: BookOpen, label: "Homework" },
  { href: "/teacher/marks", icon: FileText, label: "Enter Marks" },
  { href: "/teacher/timetable", icon: Calendar, label: "Timetable" },
  { href: "/teacher/profile", icon: UserCircle, label: "Profile" },
];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/teacher/login");
      return;
    }
    if (user?.role !== UserRole.TEACHER) {
      router.push("/school/dashboard");
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || user?.role !== UserRole.TEACHER) return null;

  const hasTransportAccess = Array.isArray(user?.permissions) && user.permissions.includes("view_transport");
  const navItems = hasTransportAccess
    ? [...baseNavItems.filter((i) => i.href !== "/teacher/profile"), { href: "/teacher/bus-routes", icon: Bus, label: "Bus routes" }, { href: "/teacher/profile", icon: UserCircle, label: "Profile" }]
    : baseNavItems;

  const handleLogout = () => {
    logout();
    router.push("/teacher/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-64 shrink-0 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
        <div className="px-5 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3 bg-emerald-50 rounded-xl px-3 py-2.5">
            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-900 text-sm truncate">{user?.name}</p>
              <p className="text-xs text-slate-500">Teacher Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/teacher/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  isActive
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <item.icon className={cn("w-5 h-5 shrink-0", isActive ? "text-white" : "text-slate-400")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 overflow-auto">
        {children}
      </main>
    </div>
  );
}
