"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useStudentAuthStore } from "@/store/studentAuthStore";
import {
  LayoutDashboard,
  BookOpen,
  Banknote,
  FileText,
  Calendar,
  User,
  LogOut,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/student/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/student/homework", icon: BookOpen, label: "Homework" },
  { href: "/student/marks", icon: FileText, label: "My Marks" },
  { href: "/student/fees", icon: Banknote, label: "My Fees" },
  { href: "/student/timetable", icon: Calendar, label: "Timetable" },
  { href: "/student/profile", icon: User, label: "Profile" },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { student, isAuthenticated, logout } = useStudentAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/student/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !student) return null;

  const handleLogout = () => {
    logout();
    router.push("/student/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
        {/* Brand */}
        <div className="px-5 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3 bg-indigo-50 rounded-xl px-3 py-2.5">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-900 text-sm truncate">{student.firstName} {student.lastName}</p>
              <p className="text-xs text-slate-500 truncate">Class {student.class}-{student.section}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <item.icon className={cn("w-5 h-5 shrink-0", isActive ? "text-white" : "text-slate-400")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* School info + logout */}
        <div className="p-4 border-t border-slate-100 space-y-2">
          <p className="text-xs text-slate-400 px-1 truncate">{student.schoolName}</p>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 overflow-auto">
        {children}
      </main>
    </div>
  );
}
