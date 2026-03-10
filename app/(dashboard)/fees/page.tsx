"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Banknote,
    Search,
    Download,
    Plus,
    Loader2,
    FileText,
    Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { CollectFeeModal } from "@/components/fees/collect-fee-modal";
import { LockedFeatureGate } from "@/components/plan/locked-feature-gate";
import api from "@/lib/api";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function formatCurrency(amount: number): string {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount.toLocaleString()}`;
}

function formatDate(d: string | Date) {
    const x = new Date(d);
    return x.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function FeesPage() {
    const today = new Date();
    const [searchTerm, setSearchTerm] = useState("");
    const [isCollectFeeOpen, setIsCollectFeeOpen] = useState(false);
    const [selectedYear, setSelectedYear] = useState(today.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);

    const { data: sessions } = useQuery({
        queryKey: ["sessions-list"],
        queryFn: async () => {
            const res = await api.get("/sessions");
            return res.data.data ?? [];
        },
    });

    const activeSess = useMemo(
        () =>
            Array.isArray(sessions)
                ? sessions.find((s: any) => s.isActive)
                : null,
        [sessions]
    );

    const sessionBounds = useMemo(() => {
        if (!activeSess?.startDate || !activeSess?.endDate) return null;
        const start = new Date(activeSess.startDate);
        const end = new Date(activeSess.endDate);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
        const startYear = start.getFullYear();
        const startMonth = start.getMonth() + 1;
        const endYear = end.getFullYear();
        const endMonth = end.getMonth() + 1;
        return { startYear, startMonth, endYear, endMonth };
    }, [activeSess]);

    const allowedYears = useMemo(() => {
        if (!sessionBounds) {
            return [today.getFullYear(), today.getFullYear() - 1, today.getFullYear() - 2];
        }
        const years = [];
        for (let y = sessionBounds.startYear; y <= sessionBounds.endYear; y++) {
            years.push(y);
        }
        return years;
    }, [sessionBounds, today]);

    useEffect(() => {
        if (!sessionBounds) return;
        const { startYear, endYear, startMonth, endMonth } = sessionBounds;

        let newYear = selectedYear;
        if (selectedYear < startYear) newYear = startYear;
        if (selectedYear > endYear) newYear = endYear;

        let newMonth = selectedMonth;

        if (newYear === startYear && newYear === endYear) {
            if (selectedMonth < startMonth) newMonth = startMonth;
            if (selectedMonth > endMonth) newMonth = endMonth;
        } else if (newYear === startYear) {
            if (selectedMonth < startMonth) newMonth = startMonth;
        } else if (newYear === endYear) {
            if (selectedMonth > endMonth) newMonth = endMonth;
        } else {
            if (selectedMonth < 1) newMonth = 1;
            if (selectedMonth > 12) newMonth = 12;
        }

        if (newYear !== selectedYear) {
            setSelectedYear(newYear);
        }
        if (newMonth !== selectedMonth) {
            setSelectedMonth(newMonth);
        }
    }, [sessionBounds, selectedYear, selectedMonth]);

    const monthOptions = useMemo(() => {
        if (!sessionBounds) {
            return MONTHS.map((label, idx) => ({ value: idx + 1, label }));
        }
        const { startYear, startMonth, endYear, endMonth } = sessionBounds;
        let from = 1;
        let to = 12;

        if (selectedYear === startYear && selectedYear === endYear) {
            from = startMonth;
            to = endMonth;
        } else if (selectedYear === startYear) {
            from = startMonth;
            to = 12;
        } else if (selectedYear === endYear) {
            from = 1;
            to = endMonth;
        }

        const opts = [];
        for (let m = from; m <= to; m++) {
            opts.push({ value: m, label: MONTHS[m - 1] });
        }
        return opts;
    }, [sessionBounds, selectedYear]);

    const resetToCurrentMonth = () => {
        if (!sessionBounds) {
            setSelectedYear(today.getFullYear());
            setSelectedMonth(today.getMonth() + 1);
            return;
        }
        const { startYear, startMonth, endYear, endMonth } = sessionBounds;
        let year = today.getFullYear();
        let month = today.getMonth() + 1;

        if (year < startYear || year > endYear) {
            year = startYear;
            month = startMonth;
        } else {
            if (year === startYear && month < startMonth) month = startMonth;
            if (year === endYear && month > endMonth) month = endMonth;
        }

        setSelectedYear(year);
        setSelectedMonth(month);
    };

    const { data: monthlyData, isLoading: monthlyLoading } = useQuery({
        queryKey: ["fees-monthly", selectedYear, selectedMonth],
        queryFn: async () => {
            const res = await api.get(`/fees/monthly?year=${selectedYear}&month=${selectedMonth}`);
            return res.data.data;
        },
    });

    const stats = monthlyData?.stats;
    const payments = monthlyData?.payments ?? [];
    const filteredPayments = useMemo(() => {
        if (!searchTerm.trim()) return payments;
        const q = searchTerm.toLowerCase();
        return payments.filter((p: any) => {
            const name = p.studentId
                ? `${p.studentId.firstName ?? ""} ${p.studentId.lastName ?? ""}`.toLowerCase()
                : "";
            const adm = (p.studentId?.admissionNumber ?? "").toString().toLowerCase();
            const receipt = (p.receiptNumber ?? "").toLowerCase();
            return name.includes(q) || adm.includes(q) || receipt.includes(q);
        });
    }, [payments, searchTerm]);

    const isLoading = monthlyLoading;
    const totalCollected = stats?.totalCollected ?? 0;
    const totalExpected = stats?.totalExpected ?? 0;
    const totalPending = stats?.totalPending ?? 0;
    const transactionCount = stats?.transactionCount ?? 0;

    const handleReceiptClick = async (receiptId: string) => {
        try {
            const res = await api.get(`/fees/receipt/${receiptId}?preview=1`, { responseType: "blob" });
            const blob = res.data as Blob;
            const blobUrl = URL.createObjectURL(blob);
            window.open(blobUrl, "_blank", "noopener");
            setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <LockedFeatureGate featureKey="fees" featureLabel="Fee management">
        <div className="flex-1 space-y-4 sm:space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
                        Fee Management
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Track student fee collections, pending dues, and financial history.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <select
                            className="border-0 bg-transparent text-sm font-medium text-gray-900 focus:ring-0"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        >
                            {monthOptions.map((m) => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>
                        <select
                            className="border-0 bg-transparent text-sm font-medium text-gray-900 focus:ring-0"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                        >
                            {allowedYears.map((y) => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-xs sm:text-sm border-gray-200 hover:bg-gray-50"
                        onClick={resetToCurrentMonth}
                    >
                        Reset to current month
                    </Button>
                    <Button
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-500 gap-2 text-xs sm:text-sm"
                        onClick={() => setIsCollectFeeOpen(true)}
                    >
                        <Plus className="h-4 w-4" /> Collect Fee
                    </Button>
                </div>
            </div>

            <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 px-4 py-2 text-sm text-indigo-800">
                Showing data for <strong>{MONTHS[selectedMonth - 1]} {selectedYear}</strong>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
                <Card className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Collected (Month)</p>
                    <div className="mt-2 flex items-baseline gap-2">
                        <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(totalCollected)}</h3>
                    </div>
                </Card>
                <Card className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Expected (Month)</p>
                    <div className="mt-2 flex items-baseline gap-2">
                        <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(totalExpected)}</h3>
                    </div>
                </Card>
                <Card className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Pending (Month)</p>
                    <div className="mt-2 flex items-baseline gap-2">
                        <h3 className="text-2xl font-bold text-amber-600">{formatCurrency(totalPending)}</h3>
                    </div>
                </Card>
                <Card className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Transactions</p>
                    <div className="mt-2 flex items-baseline gap-2">
                        <h3 className="text-2xl font-bold text-gray-900">{transactionCount.toLocaleString()}</h3>
                    </div>
                </Card>
            </div>

            <Card className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <CardHeader className="border-b border-gray-100 bg-gray-50/50">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2 text-gray-900">
                            <Banknote className="h-5 w-5 text-indigo-600" /> Payment Records — {MONTHS[selectedMonth - 1]} {selectedYear}
                        </CardTitle>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="Search student or receipt..."
                                className="h-9 pl-9 text-sm border-gray-200 bg-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                    {isLoading ? (
                        <div className="flex h-64 w-full items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                        </div>
                    ) : filteredPayments.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            No payment records found for this month.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="border-gray-200 bg-gray-50 hover:bg-gray-50">
                                    <TableHead className="text-xs font-medium uppercase text-gray-500">Receipt</TableHead>
                                    <TableHead className="text-xs font-medium uppercase text-gray-500">Date</TableHead>
                                    <TableHead className="text-xs font-medium uppercase text-gray-500">Student</TableHead>
                                    <TableHead className="text-xs font-medium uppercase text-gray-500">Payment Mode</TableHead>
                                    <TableHead className="text-xs font-medium uppercase text-gray-500">Amount</TableHead>
                                    <TableHead className="text-right text-xs font-medium uppercase text-gray-500">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPayments.map((payment: any) => (
                                    <TableRow key={payment._id} className="border-gray-100 hover:bg-gray-50/50">
                                        <TableCell className="font-mono text-xs text-gray-600">
                                            {payment.receiptNumber ?? `RC-${String(payment._id).slice(-6)}`}
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-600">
                                            {formatDate(payment.paymentDate)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium text-gray-900">
                                                {payment.studentId
                                                    ? `${payment.studentId.firstName ?? ""} ${payment.studentId.lastName ?? ""}`.trim() || "—"
                                                    : "Unknown"}
                                            </div>
                                            <div className="text-xs text-gray-500">Adm: {payment.studentId?.admissionNumber ?? "N/A"}</div>
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-600 capitalize">
                                            {payment.paymentMode ?? "—"}
                                        </TableCell>
                                        <TableCell className="font-semibold text-gray-900">
                                            ₹{Number(payment.amountPaid ?? 0).toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="hover:bg-gray-100 hover:text-indigo-600"
                                                onClick={() => handleReceiptClick(payment._id)}
                                            >
                                                <FileText className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <CollectFeeModal 
                open={isCollectFeeOpen}
                onOpenChange={setIsCollectFeeOpen}
            />
        </div>
        </LockedFeatureGate>
    );
}
