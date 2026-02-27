"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import { Users, BookOpen, FileText, Loader2, Calendar } from "lucide-react";
import Link from "next/link";

export default function TeacherDashboard() {
  const { user } = useAuthStore();

  const { data: classes = [], isLoading: classesLoading } = useQuery({
    queryKey: ["all-classes"],
    queryFn: async () => {
      const res = await api.get("/classes");
      return res.data.data ?? [];
    },
  });

  const { data: myHomework = [], isLoading: hwLoading } = useQuery({
    queryKey: ["teacher-homework"],
    queryFn: async () => {
      const res = await api.get("/homework");
      return res.data.data ?? [];
    },
  });

  const { data: exams = [] } = useQuery({
    queryKey: ["exams-list"],
    queryFn: async () => {
      const res = await api.get("/exams");
      return res.data.data ?? [];
    },
  });

  const recentHw = myHomework.slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name}!</h1>
        <p className="text-gray-500 text-sm mt-1">Teacher Portal — {user?.subject || "All Subjects"}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/teacher/classes">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">Total Classes</span>
            </div>
            {classesLoading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : (
              <p className="text-3xl font-bold text-gray-900">{classes.length}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">classes available</p>
          </div>
        </Link>

        <Link href="/teacher/homework">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">Homework Given</span>
            </div>
            {hwLoading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : (
              <p className="text-3xl font-bold text-gray-900">{myHomework.length}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">total assignments</p>
          </div>
        </Link>

        <Link href="/teacher/marks">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">Exams</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{(exams as any[]).length}</p>
            <p className="text-xs text-gray-400 mt-1">total exams</p>
          </div>
        </Link>
      </div>

      {/* Quick actions row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "My Classes", href: "/teacher/classes", icon: Users, color: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" },
          { label: "Assign Homework", href: "/teacher/homework", icon: BookOpen, color: "bg-blue-50 text-blue-700 hover:bg-blue-100" },
          { label: "Enter Marks", href: "/teacher/marks", icon: FileText, color: "bg-purple-50 text-purple-700 hover:bg-purple-100" },
          { label: "Timetable", href: "/teacher/timetable", icon: Calendar, color: "bg-amber-50 text-amber-700 hover:bg-amber-100" },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${action.color}`}
          >
            <action.icon className="w-4 h-4 shrink-0" />
            {action.label}
          </Link>
        ))}
      </div>

      {/* Recent homework */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Recently Assigned Homework</h2>
          <Link href="/teacher/homework" className="text-sm text-emerald-600 hover:underline">View all →</Link>
        </div>
        {hwLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
        ) : recentHw.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">No homework assigned yet.</p>
        ) : (
          <div className="space-y-3">
            {recentHw.map((hw: any) => (
              <div key={hw._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{hw.title}</p>
                  <p className="text-xs text-gray-500">Class {hw.className}-{hw.section} · {hw.subject}</p>
                </div>
                <span className="text-xs text-gray-500">
                  Due: {new Date(hw.dueDate).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
