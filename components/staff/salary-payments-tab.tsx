"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, Clock, ExternalLink, Wallet, ChevronDown, X } from "lucide-react";

interface SalaryPaymentsTabProps {
  staffId: string;
  compact?: boolean;
}

export default function SalaryPaymentsTab({ staffId, compact }: SalaryPaymentsTabProps) {
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["salary-history", staffId],
    queryFn: async () => {
      const res = await api.get(`/salaries/staff/${staffId}/history`);
      return res.data.data || [];
    },
  });

  const records = data || [];
  const fmt = (n: number) => `₹${n?.toLocaleString("en-IN")}`;

  // Build unique month options from records, sorted newest first
  // MUST be above all early returns to comply with Rules of Hooks
  const monthOptions = useMemo(() => {
    const seen = new Set<string>();
    const opts: { key: string; label: string }[] = [];
    // Records come newest-first from API usually; sort to be sure
    const sorted = [...records].sort((a: any, b: any) => {
      if (b.year !== a.year) return b.year - a.year;
      const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      return months.indexOf(b.month) - months.indexOf(a.month);
    });
    sorted.forEach((r: any) => {
      const key = `${r.month}-${r.year}`;
      if (!seen.has(key)) {
        seen.add(key);
        opts.push({ key, label: `${r.month} ${r.year}` });
      }
    });
    return opts;
  }, [records]);

  const filteredRecords = selectedMonthKey === "all"
    ? records
    : records.filter((r: any) => `${r.month}-${r.year}` === selectedMonthKey);

  const visibleRecords = compact ? filteredRecords.slice(0, 5) : filteredRecords;
  const paidCount = filteredRecords.filter((r: any) => r.status === "paid").length;
  const pendingCount = filteredRecords.filter((r: any) => r.status !== "paid").length;
  const totalPaid = filteredRecords.filter((r: any) => r.status === "paid").reduce((s: number, r: any) => s + (r.netSalary || 0), 0);

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center p-10 text-center">
        <Wallet className="h-8 w-8 text-muted-foreground/40 mb-2" />
        <p className="text-sm text-muted-foreground">
          No salary records yet. Generate payroll from the{" "}
          <Link href="/payroll" className="text-primary underline underline-offset-2">Payroll page</Link>.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">Payment History</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {paidCount} paid · {pendingCount} pending · Total disbursed {fmt(totalPaid)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Month filter */}
          <div className="relative">
            <select
              value={selectedMonthKey}
              onChange={(e) => setSelectedMonthKey(e.target.value)}
              className="h-9 appearance-none rounded-xl border border-gray-200 bg-white pl-3 pr-8 text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer"
            >
              <option value="all">All Months ({records.length})</option>
              {monthOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          </div>

          {selectedMonthKey !== "all" && (
            <button
              type="button"
              onClick={() => setSelectedMonthKey("all")}
              title="Clear filter"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-400 hover:text-gray-600 hover:border-gray-300 transition"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          <Link href="/payroll">
            <Button size="sm" variant="outline" className="gap-1.5 h-9 rounded-xl">
              <ExternalLink className="h-3.5 w-3.5" /> Open Payroll
            </Button>
          </Link>
        </div>
      </div>

      {filteredRecords.length === 0 ? (
        <div className="py-10 text-center text-sm text-muted-foreground">
          No records found for {monthOptions.find((o) => o.key === selectedMonthKey)?.label}.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <th className="pb-2.5 pr-4">Month</th>
                <th className="pb-2.5 pr-4 text-right">Net Amount</th>
                <th className="pb-2.5 pr-4 text-center">Status</th>
                <th className="pb-2.5 pr-4">Payment Date</th>
                <th className="pb-2.5">Mode</th>
              </tr>
            </thead>
            <tbody>
              {visibleRecords.map((r: any) => (
                <tr key={r._id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="py-3 pr-4 font-medium">{r.month} {r.year}</td>
                  <td className="py-3 pr-4 text-right font-semibold tabular-nums">{fmt(r.netSalary)}</td>
                  <td className="py-3 pr-4 text-center">
                    {r.status === "paid" ? (
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 text-xs">
                        <CheckCircle2 className="h-3 w-3" /> Paid
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1 text-xs">
                        <Clock className="h-3 w-3" /> Pending
                      </Badge>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">
                    {r.paymentDate
                      ? new Date(r.paymentDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                      : "—"}
                  </td>
                  <td className="py-3 text-muted-foreground capitalize">{r.paymentMode || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {compact && filteredRecords.length > 5 && (
        <div className="text-center pt-1">
          <Link href={`?tab=payments`} className="text-sm text-primary font-medium hover:underline">
            View all {filteredRecords.length} records →
          </Link>
        </div>
      )}
    </Card>
  );
}
