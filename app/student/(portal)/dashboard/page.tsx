"use client";

import { useQuery } from "@tanstack/react-query";
import { useStudentAuthStore } from "@/store/studentAuthStore";
import studentApi from "@/lib/studentApi";
import { BookOpen, Banknote, FileText, AlertCircle, Loader2, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function StudentDashboard() {
  const { student } = useStudentAuthStore();

  const { data: fees, isLoading: feesLoading } = useQuery({
    queryKey: ["student-fees"],
    queryFn: async () => {
      const res = await studentApi.get("/fees/student/me");
      return res.data.data;
    },
  });

  const { data: homework, isLoading: hwLoading } = useQuery({
    queryKey: ["student-homework"],
    queryFn: async () => {
      const res = await studentApi.get("/homework/student");
      return res.data.data ?? [];
    },
  });

  const { data: results, isLoading: resultsLoading } = useQuery({
    queryKey: ["student-results"],
    queryFn: async () => {
      const res = await studentApi.get("/exams/student/results");
      return res.data.data ?? [];
    },
  });

  const pendingHw = Array.isArray(homework)
    ? homework.filter((h: any) => new Date(h.dueDate) >= new Date())
    : [];

  const dueAmount = fees?.dueAmount ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {student?.firstName}!
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Class {student?.class} — Section {student?.section} · {student?.schoolName}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/student/homework">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">Pending Homework</span>
            </div>
            {hwLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            ) : (
              <p className="text-3xl font-bold text-gray-900">{pendingHw.length}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">assignments due</p>
          </div>
        </Link>

        <Link href="/student/fees">
          <div className={`bg-white rounded-2xl border p-5 hover:shadow-md transition-shadow cursor-pointer ${dueAmount > 0 ? "border-red-200" : "border-gray-200"}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${dueAmount > 0 ? "bg-red-100" : "bg-green-100"}`}>
                <Banknote className={`w-5 h-5 ${dueAmount > 0 ? "text-red-600" : "text-green-600"}`} />
              </div>
              <span className="text-sm font-medium text-gray-600">Fee Due</span>
            </div>
            {feesLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            ) : (
              <p className={`text-3xl font-bold ${dueAmount > 0 ? "text-red-600" : "text-green-600"}`}>
                ₹{dueAmount.toLocaleString()}
              </p>
            )}
            <p className="text-xs text-gray-400 mt-1">{dueAmount > 0 ? "pending payment" : "all clear"}</p>
          </div>
        </Link>

        <Link href="/student/marks">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">Exams</span>
            </div>
            {resultsLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            ) : (
              <p className="text-3xl font-bold text-gray-900">{Array.isArray(results) ? results.length : 0}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">results available</p>
          </div>
        </Link>
      </div>

      {/* Recent Homework */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-600" />
          Recent Homework
        </h2>
        {hwLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
        ) : pendingHw.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-300" />
            <p className="text-sm">No pending homework</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingHw.slice(0, 5).map((hw: any) => (
              <div key={hw._id} className="flex items-start justify-between p-3 bg-blue-50 rounded-xl">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{hw.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{hw.subject} · by {hw.createdBy?.name || "Teacher"}</p>
                </div>
                <span className="text-xs text-red-600 font-medium whitespace-nowrap ml-4">
                  Due: {new Date(hw.dueDate).toLocaleDateString()}
                </span>
              </div>
            ))}
            {pendingHw.length > 5 && (
              <Link href="/student/homework" className="block text-center text-sm text-indigo-600 hover:underline pt-1">
                View all {pendingHw.length} assignments →
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Fee Alert */}
      {dueAmount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-4">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800">Fee Payment Pending</p>
            <p className="text-sm text-red-600 mt-0.5">
              You have ₹{dueAmount.toLocaleString()} in pending fees. Please contact the school office.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
