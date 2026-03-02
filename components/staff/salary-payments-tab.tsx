"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Loader2, CheckCircle2, Clock, ExternalLink, Wallet,
  ChevronDown, X, IndianRupee, AlertCircle, History
} from "lucide-react";

interface SalaryPaymentsTabProps {
  staffId: string;
  compact?: boolean;
}

const PAYMENT_MODES = ["cash", "bank_transfer", "upi", "cheque", "other"] as const;
type PaymentMode = typeof PAYMENT_MODES[number];

interface PayForm {
  amount: string;
  mode: PaymentMode;
  transactionId: string;
  remarks: string;
}

export default function SalaryPaymentsTab({ staffId, compact }: SalaryPaymentsTabProps) {
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>("all");
  const [payingRecord, setPayingRecord] = useState<any | null>(null);
  const [viewingHistory, setViewingHistory] = useState<any | null>(null);
  const [payForm, setPayForm] = useState<PayForm>({
    amount: "",
    mode: "cash",
    transactionId: "",
    remarks: "",
  });
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["salary-history", staffId],
    queryFn: async () => {
      const res = await api.get(`/salaries/staff/${staffId}/history`);
      return res.data.data || [];
    },
  });

  const records = [...(data || [])].sort((a: any, b: any) => {
    const getSortTime = (r: any) => {
      if (r.paymentDate) return new Date(r.paymentDate).getTime();
      if (r.createdAt) return new Date(r.createdAt).getTime();
      if (typeof r._id === 'string' && r._id.length === 24) return parseInt(r._id.substring(0, 8), 16) * 1000;
      return 0;
    };
    return getSortTime(b) - getSortTime(a);
  });

  const fmt = (n: number) => `₹${n?.toLocaleString("en-IN")}`;

  // All hooks above early returns — Rules of Hooks
  const monthOptions = useMemo(() => {
    const seen = new Set<string>();
    const opts: { key: string; label: string }[] = [];
    const sorted = [...records].sort((a: any, b: any) => {
      if (b.year !== a.year) return b.year - a.year;
      const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      return months.indexOf(b.month) - months.indexOf(a.month);
    });
    sorted.forEach((r: any) => {
      const key = `${r.month}-${r.year}`;
      if (!seen.has(key)) { seen.add(key); opts.push({ key, label: `${r.month} ${r.year}` }); }
    });
    return opts;
  }, [records]);

  const payMutation = useMutation({
    mutationFn: async ({ salaryId, body }: { salaryId: string; body: any }) => {
      const res = await api.post(`/salaries/${salaryId}/pay`, body);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Payment recorded successfully!");
      qc.invalidateQueries({ queryKey: ["salary-history", staffId] });
      setPayingRecord(null);
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message || "Failed to record payment");
    },
  });

  const openPayModal = (record: any) => {
    const dueAmount = record.netSalary - (record.paidAmount || 0);
    setPayingRecord(record);
    setPayForm({
      amount: String(dueAmount),
      mode: "cash",
      transactionId: "",
      remarks: "",
    });
  };

  const submitPay = () => {
    if (!payingRecord) return;
    const amount = Number(payForm.amount);
    if (!amount || amount <= 0) { toast.error("Enter a valid amount"); return; }
    payMutation.mutate({
      salaryId: payingRecord._id,
      body: {
        amount,
        mode: payForm.mode,
        transactionId: payForm.transactionId || undefined,
        remarks: payForm.remarks || undefined,
      },
    });
  };

  const filteredRecords = selectedMonthKey === "all"
    ? records
    : records.filter((r: any) => `${r.month}-${r.year}` === selectedMonthKey);

  const visibleRecords = compact ? filteredRecords.slice(0, 5) : filteredRecords;
  const paidCount = filteredRecords.filter((r: any) => r.status === "paid").length;
  const partialCount = filteredRecords.filter((r: any) => r.status === "partial").length;
  const pendingCount = filteredRecords.filter((r: any) => r.status === "pending").length;
  const totalPaid = filteredRecords.reduce((s: number, r: any) => s + (r.paidAmount || 0), 0);

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
    <>
      <Card className="p-6 space-y-4">
        {/* Header row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">Payment History</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {paidCount} fully paid · {partialCount} partial · {pendingCount} pending · Total disbursed {fmt(totalPaid)}
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
                  <option key={opt.key} value={opt.key}>{opt.label}</option>
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
                  <th className="pb-2.5 pr-4 text-right">Net Payable</th>
                  <th className="pb-2.5 pr-4 text-right">Paid</th>
                  <th className="pb-2.5 pr-4 text-right">Due</th>
                  <th className="pb-2.5 pr-4 text-center">Status</th>
                  <th className="pb-2.5 pr-4">Last Payment</th>
                  <th className="pb-2.5 pr-4">Mode</th>
                  {!compact && <th className="pb-2.5 text-center">Action</th>}
                </tr>
              </thead>
              <tbody>
                {visibleRecords.map((r: any) => (
                  <tr key={r._id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-3 pr-4 font-medium">{r.month} {r.year}</td>
                    <td className="py-3 pr-4 text-right font-semibold tabular-nums">{fmt(r.netSalary)}</td>
                    <td className="py-3 pr-4 text-right font-medium text-emerald-600 tabular-nums">{fmt(r.paidAmount || 0)}</td>
                    <td className="py-3 pr-4 text-right font-medium text-rose-600 tabular-nums">{fmt(r.netSalary - (r.paidAmount || 0))}</td>
                    <td className="py-3 pr-4 text-center">
                      {r.status === "paid" ? (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 text-xs">
                          <CheckCircle2 className="h-3 w-3" /> Paid
                        </Badge>
                      ) : r.status === "partial" ? (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1 text-xs">
                          <AlertCircle className="h-3 w-3" /> Partial
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1 text-xs">
                          <Clock className="h-3 w-3" /> Pending
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {r.paymentDate
                        ? new Date(r.paymentDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                        : "—"}
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground capitalize">{r.paymentMode || "—"}</td>
                    {!compact && (
                      <td className="py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {r.paymentHistory?.length > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 gap-1 rounded-lg text-xs hover:bg-muted"
                              onClick={() => setViewingHistory(r)}
                            >
                              <History className="h-3 w-3" /> History
                            </Button>
                          )}
                          {r.status !== "paid" ? (
                            <Button
                              size="sm"
                              className="h-7 gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
                              onClick={() => openPayModal(r)}
                            >
                              <IndianRupee className="h-3 w-3" /> {r.status === "partial" ? "Pay Remaining" : "Mark as Paid"}
                            </Button>
                          ) : !r.paymentHistory?.length && (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </div>
                      </td>
                    )}
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

      {/* ── Mark as Paid Modal ── */}
      {payingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold">Pay – {payingRecord.month} {payingRecord.year}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">{payingRecord.month} {payingRecord.year}</p>
              </div>
              <button
                onClick={() => setPayingRecord(null)}
                className="rounded-full p-1.5 hover:bg-muted transition-colors text-muted-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Salary Summary Card */}
            <div className="rounded-xl border bg-muted/30 divide-y overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-muted-foreground">Base salary</span>
                <span className="text-sm font-medium">{fmt(payingRecord.basicSalary ?? payingRecord.netSalary)}</span>
              </div>
              {(payingRecord.allowances?.length > 0) && (
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-muted-foreground">Allowances</span>
                  <span className="text-sm font-medium text-emerald-600">
                    +{fmt(payingRecord.allowances.reduce((s: number, a: any) => s + a.amount, 0))}
                  </span>
                </div>
              )}
              {(payingRecord.deductions?.length > 0) && (
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-muted-foreground">Deductions</span>
                  <span className="text-sm font-medium text-rose-500">
                    -{fmt(payingRecord.deductions.reduce((s: number, d: any) => s + d.amount, 0))}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between px-4 py-3 bg-background">
                <span className="text-sm font-semibold">Net payable</span>
                <span className="text-base font-bold text-emerald-600">{fmt(payingRecord.netSalary)}</span>
              </div>

              <div className="flex items-center justify-between px-4 py-2 border-t">
                <span className="text-sm text-muted-foreground">Already paid</span>
                <span className="text-sm font-medium">{fmt(payingRecord.paidAmount || 0)}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3 bg-red-50/50">
                <span className="text-sm font-bold text-rose-700">Remaining Due</span>
                <span className="text-lg font-bold text-rose-600">{fmt(payingRecord.netSalary - (payingRecord.paidAmount || 0))}</span>
              </div>
            </div>

            {/* Custom Amount */}
            <div>
              <label className="text-sm font-medium text-foreground">Amount to pay (₹)</label>
              <div className="relative mt-1.5">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  min={1}
                  value={payForm.amount}
                  onChange={(e) => setPayForm((f) => ({ ...f, amount: e.target.value }))}
                  className="pl-9"
                  placeholder="Enter amount"
                />
              </div>
              {payForm.amount && Number(payForm.amount) !== (payingRecord.netSalary - (payingRecord.paidAmount || 0)) && (
                <p className="mt-1 text-xs text-amber-600">
                  ⚠ Differs from remaining due ({fmt(payingRecord.netSalary - (payingRecord.paidAmount || 0))})
                </p>
              )}
            </div>

            {/* Payment Mode + Transaction ID */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Payment mode</label>
                <div className="relative mt-1.5">
                  <select
                    value={payForm.mode}
                    onChange={(e) => setPayForm((f) => ({ ...f, mode: e.target.value as PaymentMode }))}
                    className="w-full h-10 appearance-none rounded-md border border-input bg-background pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 capitalize"
                  >
                    {PAYMENT_MODES.map((m) => (
                      <option key={m} value={m}>{m.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Transaction / Ref ID</label>
                <Input
                  className="mt-1.5"
                  value={payForm.transactionId}
                  onChange={(e) => setPayForm((f) => ({ ...f, transactionId: e.target.value }))}
                  placeholder="Optional"
                />
              </div>
            </div>

            {/* Remarks */}
            <div>
              <label className="text-sm font-medium">Remarks</label>
              <Input
                className="mt-1.5"
                value={payForm.remarks}
                onChange={(e) => setPayForm((f) => ({ ...f, remarks: e.target.value }))}
                placeholder="Optional"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                className="flex-1 rounded-xl h-11"
                onClick={() => setPayingRecord(null)}
                disabled={payMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 rounded-xl h-11 bg-emerald-600 hover:bg-emerald-500 gap-2"
                onClick={submitPay}
                disabled={payMutation.isPending || !payForm.amount}
              >
                {payMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <IndianRupee className="h-4 w-4" />
                )}
                Pay {payForm.amount ? fmt(Number(payForm.amount)) : ""}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Payment History Modal ── */}
      {viewingHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold">Payment History</h3>
                <p className="text-sm text-muted-foreground mt-0.5">{viewingHistory.month} {viewingHistory.year}</p>
              </div>
              <button
                onClick={() => setViewingHistory(null)}
                className="rounded-full p-1.5 hover:bg-muted transition-colors text-muted-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {viewingHistory.paymentHistory?.map((ph: any, i: number) => (
                <div key={i} className="flex justify-between items-center bg-muted/30 p-3 rounded-lg border">
                  <div>
                    <p className="text-sm font-semibold">{fmt(ph.amount)}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(ph.paymentDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                    {ph.transactionId && <p className="text-xs text-muted-foreground mt-1">Ref: {ph.transactionId}</p>}
                  </div>
                  <Badge variant="secondary" className="capitalize text-[10px]">{ph.paymentMode}</Badge>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <Button onClick={() => setViewingHistory(null)} className="w-full">Close</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
