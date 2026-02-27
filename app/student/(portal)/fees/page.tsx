"use client";

import { useQuery } from "@tanstack/react-query";
import studentApi from "@/lib/studentApi";
import { Banknote, Loader2, CheckCircle, AlertCircle } from "lucide-react";

export default function StudentFeesPage() {
  const { data: feeData, isLoading } = useQuery({
    queryKey: ["student-fees"],
    queryFn: async () => {
      const res = await studentApi.get("/fees/student/me");
      return res.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const totalFee = feeData?.totalYearlyFee ?? 0;
  const paidAmount = feeData?.paidAmount ?? 0;
  const dueAmount = feeData?.dueAmount ?? 0;
  const payments = feeData?.payments ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Banknote className="w-6 h-6 text-green-600" />
          My Fees
        </h1>
        <p className="text-gray-500 text-sm mt-1">Fee summary and payment history</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Fee</p>
          <p className="text-2xl font-bold text-gray-900">₹{totalFee.toLocaleString()}</p>
        </div>
        <div className="bg-green-50 rounded-2xl border border-green-100 p-5">
          <p className="text-xs text-green-600 uppercase tracking-wide mb-1">Paid</p>
          <p className="text-2xl font-bold text-green-700">₹{paidAmount.toLocaleString()}</p>
          <div className="flex items-center gap-1 mt-1">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-xs text-green-600">Cleared</span>
          </div>
        </div>
        <div className={`rounded-2xl border p-5 ${dueAmount > 0 ? "bg-red-50 border-red-100" : "bg-gray-50 border-gray-100"}`}>
          <p className={`text-xs uppercase tracking-wide mb-1 ${dueAmount > 0 ? "text-red-500" : "text-gray-500"}`}>Due</p>
          <p className={`text-2xl font-bold ${dueAmount > 0 ? "text-red-700" : "text-gray-400"}`}>
            ₹{dueAmount.toLocaleString()}
          </p>
          {dueAmount > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-xs text-red-600">Pending</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {totalFee > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Payment Progress</span>
            <span className="font-medium">{Math.round((paidAmount / totalFee) * 100)}%</span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full">
            <div
              className="h-3 bg-green-500 rounded-full transition-all"
              style={{ width: `${Math.min((paidAmount / totalFee) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Payment history */}
      {payments.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Payment History</h2>
          <div className="space-y-3">
            {payments.map((p: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{p.feeTitle || p.month || "Fee Payment"}</p>
                  <p className="text-xs text-gray-400">
                    {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : ""} ·{" "}
                    {p.paymentMode || p.mode || "—"}
                  </p>
                </div>
                <p className="font-semibold text-green-600">₹{(p.amountPaid ?? p.amount ?? 0).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {dueAmount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <p className="font-semibold text-amber-800">Contact the school office to clear your dues.</p>
          <p className="text-sm text-amber-600 mt-1">Bring your admission number: contact the fee department with your documents.</p>
        </div>
      )}
    </div>
  );
}
