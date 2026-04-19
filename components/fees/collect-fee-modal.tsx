"use client";

import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Search, X, Download, Eye, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";

interface CollectFeeModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

function formatCurrency(n: number) {
    return `₹${Number(n).toLocaleString("en-IN")}`;
}

const MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];

export function CollectFeeModal({ open, onOpenChange }: CollectFeeModalProps) {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [amount, setAmount] = useState("");
    const [upToMonth, setUpToMonth] = useState<number | null>(null);
    const [paymentMode, setPaymentMode] = useState("cash");
    const [lastReceiptId, setLastReceiptId] = useState<string | null>(null);

    const { data: students } = useQuery({
        queryKey: ["students-list-fees"],
        queryFn: async () => {
            const res = await api.get("/students");
            const list = res.data.data ?? res.data?.students ?? [];
            return Array.isArray(list) ? list : [];
        },
        enabled: open,
    });

    const { data: feeSummary, isLoading: feeLoading } = useQuery({
        queryKey: ["fee-summary", selectedStudent?._id],
        queryFn: async () => {
            const res = await api.get(`/fees/student/${selectedStudent._id}`);
            return res.data.data;
        },
        enabled: open && !!selectedStudent?._id,
    });

    const { data: sessions } = useQuery({
        queryKey: ["sessions-list"],
        queryFn: async () => {
            const res = await api.get("/sessions");
            return res.data.data ?? [];
        },
        enabled: open,
    });

    const activeSess = useMemo(
        () =>
            Array.isArray(sessions)
                ? sessions.find((s: any) => s.isActive)
                : null,
        [sessions]
    );

    const sessionMonthOptions = useMemo(() => {
        if (!activeSess?.startDate || !activeSess?.endDate) {
            return MONTHS.map((label, idx) => ({ value: idx + 1, label }));
        }
        const start = new Date(activeSess.startDate);
        const end = new Date(activeSess.endDate);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
            return MONTHS.map((label, idx) => ({ value: idx + 1, label }));
        }

        const opts: { value: number; label: string }[] = [];
        let y = start.getFullYear();
        let m = start.getMonth() + 1; // 1-based
        while (y < end.getFullYear() || (y === end.getFullYear() && m <= end.getMonth() + 1)) {
            opts.push({ value: m, label: MONTHS[m - 1] });
            m++;
            if (m > 12) {
                m = 1;
                y++;
            }
        }
        return opts;
    }, [activeSess]);

    const collectUpToOptions = useMemo(() => {
        // Show all months in the academic session: March..Dec, then Jan, Feb.
        return sessionMonthOptions;
    }, [sessionMonthOptions]);

    const student = feeSummary?.student ?? selectedStudent;
    const totalYearly = student?.totalYearlyFee ?? 0;
    const paidAmount = student?.paidAmount ?? 0;
    const dueAmount = student?.dueAmount ?? totalYearly - paidAmount;
    const monthlyFeeFromBackend = feeSummary?.monthlyFee ?? 0;
    const oneTimeFeeFromBackend = feeSummary?.oneTimeFee ?? 0;

    const {
        effectiveMonthIndex,
        targetTotalUntilMonth,
        targetPaidUntilMonth,
        targetDueUntilMonth,
    } = useMemo(() => {
        const selectedMonthIndex =
            typeof upToMonth === "number"
                ? Math.min(Math.max(upToMonth, 1), 12) - 1
                : null;

        if (typeof upToMonth !== "number") {
            return {
                effectiveMonthIndex: null,
                targetTotalUntilMonth: 0,
                targetPaidUntilMonth: 0,
                targetDueUntilMonth: 0,
            };
        }

        const ledger = feeSummary?.sessionMonthlyFees;
        if (Array.isArray(ledger) && ledger.length > 0 && sessionMonthOptions.length > 0) {
            const idx = sessionMonthOptions.findIndex((m) => m.value === upToMonth);
            if (idx >= 0) {
                const labels = new Set(sessionMonthOptions.slice(0, idx + 1).map((m) => m.label));
                const rows = ledger.filter((r: { month: string }) => labels.has(r.month));
                const targetTotalUntilMonth = rows.reduce(
                    (s: number, r: { totalAmount?: number }) => s + (Number(r.totalAmount) || 0),
                    0
                );
                const targetDueUntilMonth = rows.reduce(
                    (s: number, r: { remainingAmount?: number }) => s + (Number(r.remainingAmount) || 0),
                    0
                );
                const targetPaidUntilMonth = Math.max(0, targetTotalUntilMonth - targetDueUntilMonth);
                return {
                    effectiveMonthIndex: selectedMonthIndex,
                    targetTotalUntilMonth,
                    targetPaidUntilMonth,
                    targetDueUntilMonth,
                };
            }
        }

        if (totalYearly <= 0) {
            return {
                effectiveMonthIndex: selectedMonthIndex,
                targetTotalUntilMonth: 0,
                targetPaidUntilMonth: 0,
                targetDueUntilMonth: 0,
            };
        }

        // Work out how many academic months from session start up to this month.
        // We use the sessionMonthOptions order (e.g. March..Dec, Jan, Feb).
        let monthsCount = 0;
        if (Array.isArray(sessionMonthOptions) && sessionMonthOptions.length > 0) {
            const idx = sessionMonthOptions.findIndex((m) => m.value === upToMonth);
            monthsCount = idx >= 0 ? idx + 1 : 0;
        }

        if (monthsCount <= 0) {
            return {
                effectiveMonthIndex: selectedMonthIndex,
                targetTotalUntilMonth: 0,
                targetPaidUntilMonth: 0,
                targetDueUntilMonth: 0,
            };
        }

        // One-time fees (admission, exam, etc.) are collected at admission and are NOT
        // counted in the monthly summary. Strip them out to get only the monthly portion paid.
        const monthlyAlreadyPaid = Math.max(0, paidAmount - oneTimeFeeFromBackend);

        if (monthlyFeeFromBackend > 0) {
            // Total fee till selected month = fixed monthly fee × number of session months
            const total = Math.round(monthlyFeeFromBackend * monthsCount);
            // How much of that total has already been paid in monthly fees
            const collected = Math.min(Math.round(monthlyAlreadyPaid), total);
            const pending = Math.max(0, total - collected);
            return {
                effectiveMonthIndex: selectedMonthIndex,
                targetTotalUntilMonth: total,
                targetPaidUntilMonth: collected,
                targetDueUntilMonth: pending,
            };
        }

        // Fallback: use (totalYearly - oneTime) / sessionMonths when monthly fee is not available.
        const sessionLength = sessionMonthOptions.length > 0 ? sessionMonthOptions.length : 12;
        const oneTime = oneTimeFeeFromBackend > 0 ? oneTimeFeeFromBackend : 0;
        const perMonth = (totalYearly - oneTime) / sessionLength;
        const total = Math.round(perMonth * monthsCount);
        const collected = Math.min(Math.round(monthlyAlreadyPaid), total);
        const pending = Math.max(0, total - collected);
        return {
            effectiveMonthIndex: selectedMonthIndex,
            targetTotalUntilMonth: total,
            targetPaidUntilMonth: collected,
            targetDueUntilMonth: pending,
        };
    }, [
        upToMonth,
        totalYearly,
        paidAmount,
        monthlyFeeFromBackend,
        oneTimeFeeFromBackend,
        sessionMonthOptions,
        feeSummary?.sessionMonthlyFees,
    ]);

    const maxCollectable = useMemo(() => {
        if (effectiveMonthIndex !== null && targetDueUntilMonth > 0) {
            return Math.round(targetDueUntilMonth);
        }
        return dueAmount;
    }, [effectiveMonthIndex, targetDueUntilMonth, dueAmount]);

    function resetForm() {
        setSearchTerm("");
        setSelectedStudent(null);
        setAmount("");
        setUpToMonth(null);
        setPaymentMode("cash");
        setLastReceiptId(null);
    }

    function handleClose(open: boolean) {
        if (!open) resetForm();
        onOpenChange(open);
    }

    const collectFee = useMutation({
        mutationFn: async (payload: { studentId: string; amountPaid: number; paymentMode: string }) => {
            const res = await api.post("/fees/pay", payload);
            return res.data;
        },
        onSuccess: (data: any) => {
            queryClient.invalidateQueries({ queryKey: ["fees-list"] });
            queryClient.invalidateQueries({ queryKey: ["fees-stats"] });
            queryClient.invalidateQueries({ queryKey: ["fees-monthly"] });
            queryClient.invalidateQueries({ queryKey: ["fee-payments"] });
            queryClient.invalidateQueries({ queryKey: ["fee-defaulters"] });
            queryClient.invalidateQueries({ queryKey: ["fee-summary", selectedStudent?._id] });
            const payment = data?.data?.payment ?? data?.payment;
            if (payment?._id) setLastReceiptId(payment._id);
            toast.success(`Fee collected. Receipt: ${payment?.receiptNumber ?? ""}`);
            handleClose(false);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message ?? "Failed to collect fee");
        },
    });

    const handleSubmit = () => {
        const amt = Number(amount);
        if (!selectedStudent || !amount || amt <= 0) {
            toast.error("Enter a valid amount");
            return;
        }
        if (maxCollectable > 0 && amt > maxCollectable) {
            toast.error(`Amount cannot exceed due amount (${formatCurrency(maxCollectable)})`);
            return;
        }
        collectFee.mutate({
            studentId: selectedStudent._id,
            amountPaid: amt,
            paymentMode: paymentMode === "bank_transfer" ? "bank" : paymentMode,
        });
    };

    const handleReceiptPdf = async (action: "preview" | "download" | "print") => {
        if (!lastReceiptId) return;
        try {
            const res = await api.get(`/fees/receipt/${lastReceiptId}${action === "preview" ? "?preview=1" : ""}`, { responseType: "blob" });
            const blob = res.data as Blob;
            const blobUrl = URL.createObjectURL(blob);
            if (action === "preview") {
                window.open(blobUrl, "_blank", "noopener");
                setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
            } else if (action === "download") {
                const a = document.createElement("a");
                a.href = blobUrl;
                a.download = `receipt-${lastReceiptId}.pdf`;
                a.click();
                URL.revokeObjectURL(blobUrl);
            } else {
                const w = window.open(blobUrl, "_blank", "noopener");
                if (w) setTimeout(() => { w.print(); URL.revokeObjectURL(blobUrl); }, 800);
                else URL.revokeObjectURL(blobUrl);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const filteredStudents = Array.isArray(students)
        ? students.filter((s: any) =>
              `${s.firstName ?? ""} ${s.lastName ?? ""} ${s.admissionNumber ?? ""}`
                  .toLowerCase()
                  .includes(searchTerm.toLowerCase())
          )
        : [];

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Collect Fee</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {!selectedStudent ? (
                        <div className="space-y-3">
                            <Label>Search Student</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input
                                    placeholder="Search by name or admission number..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-2">
                                {filteredStudents.length > 0 ? (
                                    filteredStudents.map((s: any) => (
                                        <div
                                            key={s._id}
                                            className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-100 bg-white p-3 transition-colors hover:bg-indigo-50"
                                            onClick={() => setSelectedStudent(s)}
                                        >
                                            <div>
                                                <p className="font-medium text-gray-900">{s.firstName} {s.lastName}</p>
                                                <p className="text-xs text-gray-500">{s.admissionNumber} • Class {s.class} {s.section}</p>
                                            </div>
                                            <Badge className="bg-indigo-100 text-indigo-700">Select</Badge>
                                        </div>
                                    ))
                                ) : (
                                    <p className="py-8 text-center text-sm text-gray-500">
                                        {searchTerm ? "No students found" : "Start typing to search"}
                                    </p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between rounded-lg border border-indigo-200 bg-indigo-50 p-3">
                                <div>
                                    <p className="font-semibold text-indigo-900">{selectedStudent.firstName} {selectedStudent.lastName}</p>
                                    <p className="text-xs text-indigo-700">{selectedStudent.admissionNumber} • Class {selectedStudent.class} {selectedStudent.section}</p>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-indigo-600 hover:bg-indigo-100" onClick={() => setSelectedStudent(null)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            {feeLoading ? (
                                <div className="flex h-24 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-indigo-500" /></div>
                            ) : (
                                <>
                                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
                                        <p className="flex justify-between"><span>Total Annual Fee</span><span className="font-medium">{formatCurrency(totalYearly)}</span></p>
                                        <p className="mt-1 flex justify-between"><span>Previously Paid</span><span>{formatCurrency(paidAmount)}</span></p>
                                        <p className="mt-1 flex justify-between"><span className="font-medium text-amber-700">Remaining Due</span><span className="font-semibold">{formatCurrency(dueAmount)}</span></p>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label>Collect fees up to month</Label>
                                            <select
                                                className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                                                value={upToMonth ?? ""}
                                                onChange={(e) =>
                                                    setUpToMonth(
                                                        e.target.value ? Number(e.target.value) : null
                                                    )
                                                }
                                            >
                                                <option value="">Full year</option>
                                                {collectUpToOptions.map((m) => (
                                                    <option key={m.label + m.value} value={m.value}>
                                                        {m.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        {effectiveMonthIndex !== null && totalYearly > 0 && (
                                            <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-3 text-xs sm:text-sm">
                                                <p className="mb-1 font-medium text-indigo-900">
                                                    Summary up to {MONTHS[effectiveMonthIndex]}
                                                </p>
                                                <p className="flex justify-between">
                                                    <span>Total fee till month</span>
                                                    <span className="font-medium">
                                                        {formatCurrency(targetTotalUntilMonth)}
                                                    </span>
                                                </p>
                                                <p className="mt-1 flex justify-between">
                                                    <span>Amount already collected</span>
                                                    <span>{formatCurrency(targetPaidUntilMonth)}</span>
                                                </p>
                                                <p className="mt-1 flex justify-between">
                                                    <span className="font-medium text-amber-700">
                                                        Pending till month
                                                    </span>
                                                    <span className="font-semibold">
                                                        {formatCurrency(targetDueUntilMonth)}
                                                    </span>
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Amount (₹)</Label>
                                            <Input
                                                type="number"
                                                placeholder="0"
                                                min={1}
                                                max={maxCollectable || undefined}
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Payment Mode</Label>
                                            <select
                                                className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                                                value={paymentMode}
                                                onChange={(e) => setPaymentMode(e.target.value)}
                                            >
                                                <option value="cash">Cash</option>
                                                <option value="upi">UPI</option>
                                                <option value="bank">Bank</option>
                                                <option value="card">Card</option>
                                                <option value="cheque">Cheque</option>
                                                <option value="online">Online</option>
                                            </select>
                                        </div>
                                    </div>

                                    {lastReceiptId && (
                                        <div className="flex flex-wrap gap-2">
                                            <span className="text-sm text-gray-600 w-full">Receipt generated:</span>
                                            <Button variant="outline" size="sm" className="gap-1" onClick={() => handleReceiptPdf("preview")}>
                                                <Eye className="h-4 w-4" /> Preview
                                            </Button>
                                            <Button variant="outline" size="sm" className="gap-1" onClick={() => handleReceiptPdf("download")}>
                                                <Download className="h-4 w-4" /> Download
                                            </Button>
                                            <Button variant="outline" size="sm" className="gap-1" onClick={() => handleReceiptPdf("print")}>
                                                <Printer className="h-4 w-4" /> Print
                                            </Button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => handleClose(false)}>Cancel</Button>
                    <Button
                        className="flex-1 bg-indigo-600 hover:bg-indigo-500"
                        onClick={handleSubmit}
                        disabled={!selectedStudent || !amount || Number(amount) <= 0 || collectFee.isPending}
                    >
                        {collectFee.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Collect Fee"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
