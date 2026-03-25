"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Loader2, Wallet, Clock, CheckCircle2, AlertCircle,
    ChevronDown, Play, Search, Eye, Banknote, X, Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import api from "@/lib/api";
import { LockedFeatureGate } from "@/components/plan/locked-feature-gate";

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];
const PAYMENT_MODES = [
    { value: "cash", label: "Cash" },
    { value: "cheque", label: "Cheque" },
    { value: "online", label: "Online Transfer" },
    { value: "upi", label: "UPI" },
    { value: "card", label: "Card" },
];

function currentMonth() { return MONTHS[new Date().getMonth()]; }
function currentYear() { return new Date().getFullYear(); }

export default function PayrollPage() {
    const qc = useQueryClient();
    const [month, setMonth] = useState(currentMonth);
    const [year, setYear] = useState(currentYear);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [search, setSearch] = useState("");
    const [payRecord, setPayRecord] = useState<any | null>(null);
    const [slipRecord, setSlipRecord] = useState<any | null>(null);
    const { data: school } = useQuery({
        queryKey: ["school-me"],
        queryFn: async () => {
            const res = await api.get("/schools/me");
            return res.data?.data ?? res.data;
        },
    });

    const qk = ["payroll", month, year];

    const { data: records = [], isLoading } = useQuery({
        queryKey: qk,
        queryFn: async () => {
            const res = await api.get("/salaries", { params: { month, year } });
            return res.data?.data ?? [];
        },
    });

    const { data: summary, isLoading: summaryLoading } = useQuery({
        queryKey: ["payroll-summary", month, year],
        queryFn: async () => {
            const res = await api.get("/salaries/summary", { params: { month, year } });
            return res.data?.data ?? {};
        },
    });

    const { data: sessionsData } = useQuery({
        queryKey: ["sessions-list"],
        queryFn: async () => {
            const res = await api.get("/sessions");
            return res.data?.data ?? res.data ?? [];
        },
    });

    const activeSession: any = useMemo(() => {
        const list = Array.isArray(sessionsData) ? sessionsData : [];
        return list.find((s: any) => s.isActive) ?? null;
    }, [sessionsData]);

    const sessionYears: number[] = useMemo(() => {
        if (!activeSession?.startDate || !activeSession?.endDate) {
            return Array.from({ length: 5 }, (_, i) => currentYear() - 2 + i);
        }

        const startY = new Date(activeSession.startDate).getFullYear();
        const endY = new Date(activeSession.endDate).getFullYear();
        const years: number[] = [];
        for (let y = startY; y <= endY; y++) years.push(y);
        return years;
    }, [activeSession]);

    const availableMonths: string[] = useMemo(() => {
        if (!activeSession?.startDate || !activeSession?.endDate) return MONTHS;

        const start = new Date(activeSession.startDate);
        const end = new Date(activeSession.endDate);
        const startY = start.getFullYear();
        const endY = end.getFullYear();
        const startM = start.getMonth();
        const endM = end.getMonth();

        if (year === startY && year === endY) return MONTHS.slice(startM, endM + 1);
        if (year === startY) return MONTHS.slice(startM);
        if (year === endY) return MONTHS.slice(0, endM + 1);
        if (year > startY && year < endY) return MONTHS;
        return MONTHS;
    }, [activeSession, year]);

    useEffect(() => {
        if (sessionYears.length > 0 && !sessionYears.includes(year)) {
            setYear(sessionYears[0]);
        }
    }, [sessionYears, year]);

    useEffect(() => {
        if (availableMonths.length > 0 && !availableMonths.includes(month)) {
            setMonth(availableMonths[0]);
        }
    }, [availableMonths, month]);

    const generateMut = useMutation({
        mutationFn: async () => {
            const res = await api.post("/salaries/generate", { month, year });
            return res.data?.data ?? res.data;
        },
        onSuccess: (d) => {
            const updated = d.updated ?? 0;
            toast.success(`Generated ${d.created} salary records, refreshed ${updated} existing records`);
            qc.invalidateQueries({ queryKey: qk });
            qc.invalidateQueries({ queryKey: ["payroll-summary", month, year] });
        },
        onError: (e: any) => {
            toast.error(e.response?.data?.message || "Failed to generate payroll");
        },
    });

    const filtered = useMemo(() => {
        let list = records;
        if (statusFilter !== "all") list = list.filter((r: any) => r.status === statusFilter);
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter((r: any) =>
                (r.staffId?.name || "").toLowerCase().includes(q) ||
                (r.staffId?.email || "").toLowerCase().includes(q)
            );
        }
        return list;
    }, [records, statusFilter, search]);

    const fmt = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

    const s = summary ?? {};
    const runStatus = s.totalRecords === 0
        ? "not_generated"
        : s.pendingCount === 0 ? "completed" : "in_progress";

    return (
        <LockedFeatureGate featureKey="staff" featureLabel="Payroll">
            <div className="space-y-6 p-1">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Payroll</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Generate, review and disburse monthly staff salaries.
                        </p>
                        {activeSession?.startDate && activeSession?.endDate && (
                            <p className="text-xs text-muted-foreground mt-1">
                                Active session: {new Date(activeSession.startDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })} to{" "}
                                {new Date(activeSession.endDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <select
                                value={month}
                                onChange={(e) => setMonth(e.target.value)}
                                className="h-9 appearance-none rounded-lg border border-border bg-card pl-3 pr-8 text-sm focus:ring-2 focus:ring-primary"
                            >
                                {availableMonths.map((m) => <option key={m} value={m}>{m}</option>)}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="relative">
                            <select
                                value={year}
                                onChange={(e) => setYear(Number(e.target.value))}
                                className="h-9 appearance-none rounded-lg border border-border bg-card pl-3 pr-8 text-sm focus:ring-2 focus:ring-primary"
                            >
                                {sessionYears.map((y) => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        </div>
                        <Button
                            size="sm"
                            className="gap-1.5"
                            onClick={() => generateMut.mutate()}
                            disabled={generateMut.isPending}
                        >
                            {generateMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                            Generate Payroll
                        </Button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <SummaryCard
                        icon={<Wallet className="h-5 w-5 text-blue-500" />}
                        label="Total Payroll"
                        value={summaryLoading ? "..." : fmt(s.totalNetAmount ?? 0)}
                        sub={`${s.totalRecords ?? 0} staff`}
                    />
                    <SummaryCard
                        icon={<Clock className="h-5 w-5 text-amber-500" />}
                        label="Pending"
                        value={summaryLoading ? "..." : fmt(s.totalPendingAmount ?? 0)}
                        sub={`${(s.pendingCount ?? 0) + (s.partialCount ?? 0)} staff`}
                    />
                    <SummaryCard
                        icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                        label="Paid"
                        value={summaryLoading ? "..." : fmt(s.totalPaidAmount ?? 0)}
                        sub={`${s.paidCount ?? 0} staff`}
                    />
                    <SummaryCard
                        icon={
                            runStatus === "completed" ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> :
                            runStatus === "in_progress" ? <Clock className="h-5 w-5 text-amber-500" /> :
                            <AlertCircle className="h-5 w-5 text-zinc-400" />
                        }
                        label="Run Status"
                        value={
                            runStatus === "completed" ? "Completed" :
                            runStatus === "in_progress" ? "In Progress" : "Not Generated"
                        }
                        sub={`${month} ${year}`}
                    />
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="relative flex-1 max-w-xs">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search staff..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 h-9 text-sm"
                        />
                    </div>
                    <div className="flex gap-1.5">
                        {["all", "pending", "partial", "paid", "hold"].map((s) => (
                            <Button
                                key={s}
                                size="sm"
                                variant={statusFilter === s ? "default" : "outline"}
                                className="h-8 text-xs capitalize"
                                onClick={() => setStatusFilter(s)}
                            >
                                {s === "all" ? "All" : s === "partial" ? "Partial" : s}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                {isLoading ? (
                    <div className="flex h-40 items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : filtered.length === 0 ? (
                    <Card className="flex flex-col items-center justify-center p-12 text-center">
                        <Wallet className="h-10 w-10 text-muted-foreground/40 mb-3" />
                        <p className="text-sm font-medium text-muted-foreground">
                            {records.length === 0
                                ? `No payroll for ${month} ${year}. Click "Generate Payroll" to get started.`
                                : "No records match your filters."}
                        </p>
                    </Card>
                ) : (
                    <Card className="overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/40 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        <th className="px-4 py-3">Staff</th>
                                        <th className="px-4 py-3">Role</th>
                                        <th className="px-4 py-3 text-right">Basic</th>
                                        <th className="px-4 py-3 text-right">Allowances</th>
                                        <th className="px-4 py-3 text-right">Deductions</th>
                                        <th className="px-4 py-3 text-right">Settled Extra</th>
                                        <th className="px-4 py-3 text-right">Net</th>
                                        <th className="px-4 py-3 text-right">Paid</th>
                                        <th className="px-4 py-3 text-right">Due</th>
                                        <th className="px-4 py-3 text-center">Status</th>
                                        <th className="px-4 py-3">Payment</th>
                                        <th className="px-4 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((r: any) => {
                                        const allowTotal = (r.allowances || []).reduce((s: number, a: any) => s + a.amount, 0);
                                        const deductTotal = (r.deductions || []).reduce((s: number, d: any) => s + d.amount, 0);
                                        const settledExtraNet = r.settledExtraNet || 0;
                                        const paid = r.paidAmount || 0;
                                        const due = Math.max(0, (r.netSalary || 0) - paid);
                                        return (
                                            <tr key={r._id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                                                <td className="px-4 py-3 font-medium">{r.staffId?.name ?? "—"}</td>
                                                <td className="px-4 py-3 text-muted-foreground capitalize text-xs">
                                                    {(r.staffId?.role || "").replace(/_/g, " ")}
                                                </td>
                                                <td className="px-4 py-3 text-right tabular-nums">{fmt(r.basicSalary)}</td>
                                                <td className="px-4 py-3 text-right tabular-nums text-emerald-600">+{fmt(allowTotal)}</td>
                                                <td className="px-4 py-3 text-right tabular-nums text-rose-500">-{fmt(deductTotal)}</td>
                                                <td className={`px-4 py-3 text-right tabular-nums font-medium ${settledExtraNet >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                                                    {settledExtraNet === 0 ? "—" : `${settledExtraNet > 0 ? "+" : "-"}${fmt(Math.abs(settledExtraNet))}`}
                                                </td>
                                                <td className="px-4 py-3 text-right tabular-nums font-semibold">{fmt(r.netSalary)}</td>
                                                <td className="px-4 py-3 text-right tabular-nums text-emerald-600">{paid > 0 ? fmt(paid) : "—"}</td>
                                                <td className="px-4 py-3 text-right tabular-nums text-rose-500 font-medium">{due > 0 ? fmt(due) : "—"}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <StatusBadge status={r.status} />
                                                </td>
                                                <td className="px-4 py-3 text-xs text-muted-foreground">
                                                    {r.paymentDate
                                                        ? new Date(r.paymentDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
                                                        : "—"}
                                                    {r.paymentMode && ` · ${r.paymentMode}`}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button size="icon" variant="ghost" className="h-7 w-7" title="View slip" onClick={() => setSlipRecord(r)}>
                                                            <Eye className="h-3.5 w-3.5" />
                                                        </Button>
                                                        {r.status !== "paid" && (
                                                            <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-600" title="Pay remaining" onClick={() => setPayRecord(r)}>
                                                                <Banknote className="h-3.5 w-3.5" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t bg-muted/30 font-semibold text-xs">
                                        <td className="px-4 py-3" colSpan={6}>Total ({filtered.length} staff)</td>
                                        <td className="px-4 py-3 text-right tabular-nums">
                                            {fmt(filtered.reduce((s: number, r: any) => s + (r.netSalary || 0), 0))}
                                        </td>
                                        <td className="px-4 py-3 text-right tabular-nums text-emerald-600">
                                            {fmt(filtered.reduce((s: number, r: any) => s + (r.paidAmount || 0), 0))}
                                        </td>
                                        <td className="px-4 py-3 text-right tabular-nums text-rose-500">
                                            {fmt(filtered.reduce((s: number, r: any) => s + Math.max(0, (r.netSalary || 0) - (r.paidAmount || 0)), 0))}
                                        </td>
                                        <td colSpan={3} />
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </Card>
                )}

                {/* Pay Modal */}
                <PayModal
                    record={payRecord}
                    onClose={() => setPayRecord(null)}
                    onSuccess={() => {
                        setPayRecord(null);
                        qc.invalidateQueries({ queryKey: qk });
                        qc.invalidateQueries({ queryKey: ["payroll-summary", month, year] });
                    }}
                />

                {/* Slip Viewer */}
                <SlipViewer
                    record={slipRecord}
                    school={school}
                    onClose={() => setSlipRecord(null)}
                />
            </div>
        </LockedFeatureGate>
    );
}

/* ─── Summary Card ───────────────────────────────── */
function SummaryCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
    return (
        <Card className="flex items-start gap-4 p-5">
            <div className="rounded-xl bg-muted/60 p-2.5">{icon}</div>
            <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-lg font-bold tracking-tight truncate">{value}</p>
                <p className="text-xs text-muted-foreground">{sub}</p>
            </div>
        </Card>
    );
}

/* ─── Status Badge ───────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { cls: string; label: string }> = {
        paid: { cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", label: "Paid" },
        partial: { cls: "bg-blue-500/10 text-blue-600 border-blue-500/20", label: "Partial" },
        pending: { cls: "bg-amber-500/10 text-amber-600 border-amber-500/20", label: "Pending" },
        hold: { cls: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20", label: "On Hold" },
    };
    const b = map[status] ?? map.pending;
    return <Badge variant="outline" className={`text-[11px] font-medium ${b.cls}`}>{b.label}</Badge>;
}

/* ─── Pay Modal ──────────────────────────────────── */
function PayModal({ record, onClose, onSuccess }: { record: any | null; onClose: () => void; onSuccess: () => void }) {
    const [mode, setMode] = useState("cash");
    const [txnId, setTxnId] = useState("");
    const [remarks, setRemarks] = useState("");
    const [customAmount, setCustomAmount] = useState("");

    const dueAmount = record ? Math.max(0, (record.netSalary || 0) - (record.paidAmount || 0)) : 0;

    // Initialize the input with the full due amount when a record opens,
    // but don't force it while the user is editing.
    useEffect(() => {
        if (record && dueAmount > 0) {
            setCustomAmount(String(dueAmount));
        } else {
            setCustomAmount("");
        }
    }, [record?._id, dueAmount]);

    const payAmount = customAmount ? Number(customAmount) : 0;

    const payMut = useMutation({
        mutationFn: async () => {
            if (payAmount <= 0 || payAmount > dueAmount) {
                throw new Error(`Amount must be between ₹1 and ${dueAmount.toLocaleString("en-IN")}`);
            }
            await api.post(`/salaries/${record._id}/pay`, {
                amount: payAmount,
                mode,
                transactionId: txnId || undefined,
                remarks: remarks || undefined,
            });
        },
        onSuccess: () => {
            toast.success("Salary payment recorded", {
                description: payAmount < dueAmount
                    ? `₹${payAmount.toLocaleString("en-IN")} paid. ₹${(dueAmount - payAmount).toLocaleString("en-IN")} still due.`
                    : "Full salary disbursed.",
            });
            setMode("cash"); setTxnId(""); setRemarks(""); setCustomAmount("");
            onSuccess();
        },
        onError: (e: any) => toast.error(e.response?.data?.message ?? e.message ?? "Payment failed"),
    });

    if (!record) return null;
    const allowTotal = (record.allowances || []).reduce((s: number, a: any) => s + a.amount, 0);
    const deductTotal = (record.deductions || []).reduce((s: number, d: any) => s + d.amount, 0);
    const alreadyPaid = record.paidAmount || 0;
    const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

    return (
        <Modal isOpen={!!record} onClose={onClose} title={`Pay – ${record.staffId?.name ?? "Staff"}`} description={`${record.month} ${record.year}`}>
            <div className="space-y-4">
                <div className="rounded-xl border bg-muted/30 p-4 space-y-1.5 text-sm">
                    <Row label="Base salary" value={fmt(record.basicSalary)} />
                    {(record.allowances || []).map((a: any, i: number) => (
                        <Row key={i} label={a.title} value={`+${fmt(a.amount)}`} cls="text-emerald-600" indent />
                    ))}
                    {allowTotal > 0 && <Row label="Total allowances" value={`+${fmt(allowTotal)}`} cls="text-emerald-600 font-medium" border />}
                    {(record.deductions || []).map((d: any, i: number) => (
                        <Row key={i} label={d.title} value={`-${fmt(d.amount)}`} cls="text-rose-500" indent />
                    ))}
                    {deductTotal > 0 && <Row label="Total deductions" value={`-${fmt(deductTotal)}`} cls="text-rose-500 font-medium" border />}
                    <div className="flex justify-between font-semibold pt-2 border-t text-base">
                        <span>Net payable</span>
                        <span>{fmt(record.netSalary)}</span>
                    </div>
                    {alreadyPaid > 0 && (
                        <>
                            <div className="flex justify-between text-sm text-emerald-600">
                                <span>Already paid</span>
                                <span>{fmt(alreadyPaid)}</span>
                            </div>
                            <div className="flex justify-between font-semibold text-base text-rose-600 pt-1 border-t">
                                <span>Remaining due</span>
                                <span>{fmt(dueAmount)}</span>
                            </div>
                        </>
                    )}
                </div>

                <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Payment amount</Label>
                    <Input
                        type="number"
                        min={1}
                        max={dueAmount}
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        placeholder={`Max ${fmt(dueAmount)}`}
                        className="h-9 text-sm"
                    />
                    {customAmount && Number(customAmount) < dueAmount && Number(customAmount) > 0 && (
                        <p className="text-xs text-blue-600">Partial payment — ₹{(dueAmount - Number(customAmount)).toLocaleString("en-IN")} will remain due.</p>
                    )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Payment mode</Label>
                        <select value={mode} onChange={(e) => setMode(e.target.value)}
                            className="w-full h-9 rounded-lg border bg-card px-3 text-sm focus:ring-2 focus:ring-primary">
                            {PAYMENT_MODES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Transaction / Ref ID</Label>
                        <Input value={txnId} onChange={(e) => setTxnId(e.target.value)} placeholder="Optional" className="h-9 text-sm" />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Remarks</Label>
                    <Input value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional" className="h-9 text-sm" />
                </div>
                <div className="flex gap-3 pt-1">
                    <Button variant="outline" className="flex-1" onClick={onClose} disabled={payMut.isPending}>Cancel</Button>
                    <Button
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500"
                        onClick={() => payMut.mutate()}
                        disabled={payMut.isPending || payAmount <= 0 || payAmount > dueAmount}
                    >
                        {payMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : `Pay ${fmt(payAmount)}`}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

function Row({ label, value, cls, indent, border }: { label: string; value: string; cls?: string; indent?: boolean; border?: boolean }) {
    return (
        <div className={`flex justify-between text-sm ${indent ? "pl-3" : ""} ${border ? "border-t pt-1" : ""}`}>
            <span className="text-muted-foreground">{label}</span>
            <span className={cls}>{value}</span>
        </div>
    );
}

/* ─── Slip Viewer ────────────────────────────────── */
function SlipViewer({
    record,
    school,
    onClose,
}: {
    record: any | null;
    school: any;
    onClose: () => void;
}) {
    if (!record) return null;
    const allowTotal = (record.allowances || []).reduce((s: number, a: any) => s + a.amount, 0);
    const deductTotal = (record.deductions || []).reduce((s: number, d: any) => s + d.amount, 0);
    const settledOtherPayments = record.settledOtherPayments || [];
    const settledBonusTotal = record.settledBonusTotal || 0;
    const settledAdjustmentTotal = record.settledAdjustmentTotal || 0;
    const settledExtraNet = record.settledExtraNet || 0;
    const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

    const handlePrint = () => {
        const el = document.getElementById("salary-slip-content");
        if (!el) return;
        const w = window.open("", "_blank", "width=600,height=700");
        if (!w) return;
        w.document.write(`<html><head><title>Salary Slip – ${record.staffId?.name}</title>
            <style>
              body{font-family:system-ui,sans-serif;padding:28px;color:#111;background:#fff}
              .slip-wrap{border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.04)}
              .slip-header{display:flex;gap:14px;justify-content:space-between;align-items:flex-start;background:linear-gradient(135deg,#4f46e5 0%,#1d4ed8 40%,#0ea5e9 100%);color:#fff;padding:18px}
              .slip-logo{width:56px;height:56px;border-radius:14px;background:#fff;display:flex;align-items:center;justify-content:center;overflow:hidden}
              .slip-logo img{width:100%;height:100%;object-fit:cover}
              .slip-school-name{font-size:18px;font-weight:800;line-height:1.15}
              .slip-slip-title{font-size:13px;font-weight:600;opacity:0.95;margin-top:4px}
              .slip-meta{padding:16px 18px}
              .slip-meta-row{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:4px 0;font-size:13px}
              .slip-meta-row b{color:#0f172a}
              table{width:100%;border-collapse:collapse;margin:0}
              th,td{padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:left;font-size:13px}
              th{background:#f5f7ff;color:#3730a3;font-weight:700;border-bottom:1px solid #e0e7ff}
              .right{text-align:right}
              .money{font-variant-numeric:tabular-nums}
              .net{background:#ecfeff}
              .positive{color:#059669;font-weight:700}
              .negative{color:#e11d48;font-weight:700}
              .slip-paid{background:#ecfdf3}
              .slip-bottom{display:flex;justify-content:space-between;gap:18px;padding:16px 18px}
              .sig-box{flex:1;border:1px dashed #94a3b8;border-radius:12px;padding:10px 12px;min-height:78px}
              .sig-title{font-size:12px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.03em}
              .sig-name{font-size:16px;font-weight:800;margin-top:8px;color:#0f172a}
              .sig-img{max-width:150px;max-height:44px;object-fit:contain;margin-top:8px}
              .stamp-box{flex:1;border:1px dashed #f59e0b;border-radius:12px;padding:10px 12px;min-height:78px;display:flex;flex-direction:column;align-items:center;justify-content:center}
              .stamp-img{max-width:120px;max-height:52px;object-fit:contain}
              .slip-footnote{padding:0 18px 18px;color:#64748b;font-size:12px}
            </style>
          </head><body>${el.innerHTML}</body></html>`);
        w.document.close();
        w.print();
    };

    return (
        <Modal isOpen={!!record} onClose={onClose} title="Salary Slip" description={`${record.staffId?.name ?? "Staff"} · ${record.month} ${record.year}`}>
            <div id="salary-slip-content" className="slip-wrap rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="slip-header flex items-start justify-between gap-4 bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-500 text-white p-5">
                    <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                        <div className="slip-logo w-14 h-14 rounded-2xl bg-white flex items-center justify-center overflow-hidden">
                            {school?.logo ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img className="w-full h-full object-cover" src={school.logo} alt="School logo" />
                            ) : (
                                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <span style={{ color: "#4f46e5", fontWeight: 900, fontSize: 18 }}>
                                        {String(school?.schoolName ?? "S").charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            )}
                        </div>
                        <div>
                            <div className="slip-school-name text-xl font-extrabold leading-tight">{school?.schoolName ?? "School Name"}</div>
                            <div className="slip-slip-title text-xs font-semibold opacity-95 mt-1">Salary Slip</div>
                        </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 800, fontSize: 14, opacity: 0.95 }}>{record.month} {record.year}</div>
                        <div style={{ marginTop: 6, display: "flex", justifyContent: "flex-end" }}>
                            <StatusBadge status={record.status} />
                        </div>
                    </div>
                </div>

                <div className="slip-meta p-4">
                    <div className="slip-meta-row">
                        <span style={{ color: "#64748b" }}>Employee</span>
                        <b>{record.staffId?.name}</b>
                    </div>
                    <div className="slip-meta-row">
                        <span style={{ color: "#64748b" }}>Role</span>
                        <b className="capitalize">{(record.staffId?.role || "").replace(/_/g, " ")}</b>
                    </div>
                    <div className="slip-meta-row">
                        <span style={{ color: "#64748b" }}>Net Payable</span>
                        <b className="money positive">{fmt(record.netSalary)}</b>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Component</th>
                            <th className="right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Base Salary</td>
                            <td className="right money">{fmt(record.basicSalary)}</td>
                        </tr>
                        {(record.allowances || []).map((a: any, i: number) => (
                            <tr key={`a${i}`}>
                                <td style={{ paddingLeft: 22, color: "#059669", fontWeight: 600 }}>{a.title}</td>
                                <td className="right money" style={{ color: "#059669", fontWeight: 700 }}>+{fmt(a.amount)}</td>
                            </tr>
                        ))}
                        {(record.deductions || []).map((d: any, i: number) => (
                            <tr key={`d${i}`}>
                                <td style={{ paddingLeft: 22, color: "#e11d48", fontWeight: 600 }}>{d.title}</td>
                                <td className="right money" style={{ color: "#e11d48", fontWeight: 700 }}>-{fmt(d.amount)}</td>
                            </tr>
                        ))}

                        {settledOtherPayments.map((sp: any) => (
                            <tr key={`sp-${sp._id}`}>
                                <td style={{ paddingLeft: 22, color: sp.type === "bonus" ? "#059669" : "#e11d48", fontWeight: 600 }}>
                                    {sp.type === "bonus" ? "Bonus" : "Adjustment"} — {sp.title}
                                    {sp.date ? (
                                        <span style={{ marginLeft: 8, fontSize: 11, color: "#64748b", fontWeight: 500 }}>
                                            ({new Date(sp.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}{" "}
                                            {new Date(sp.date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })})
                                        </span>
                                    ) : null}
                                </td>
                                <td
                                    className="right money"
                                    style={{ color: sp.type === "bonus" ? "#059669" : "#e11d48", fontWeight: 700 }}
                                >
                                    {sp.type === "bonus" ? "+" : "-"}{fmt(sp.amount)}
                                </td>
                            </tr>
                        ))}

                        {(settledBonusTotal > 0 || settledAdjustmentTotal > 0) && (
                            <tr>
                                <td style={{ fontWeight: 800 }}>Settled Extras (outside payroll)</td>
                                <td
                                    className="right money"
                                    style={{ fontWeight: 800, color: settledExtraNet >= 0 ? "#059669" : "#e11d48" }}
                                >
                                    {settledExtraNet >= 0 ? "+" : "-"}{fmt(Math.abs(settledExtraNet))}
                                </td>
                            </tr>
                        )}

                        <tr className="total">
                            <td style={{ fontWeight: 800 }}>Gross Salary</td>
                            <td className="right money" style={{ fontWeight: 800 }}>{fmt(record.totalSalary)}</td>
                        </tr>

                        <tr className="net">
                            <td style={{ fontWeight: 900 }}>Net Payable</td>
                            <td className="right money" style={{ fontWeight: 900, color: "#059669" }}>{fmt(record.netSalary)}</td>
                        </tr>

                        {(record.paidAmount || 0) > 0 && (
                            <tr className="slip-paid">
                                <td style={{ color: "#059669", fontWeight: 800 }}>Amount Paid</td>
                                <td className="right money" style={{ color: "#059669", fontWeight: 900 }}>{fmt(record.paidAmount)}</td>
                            </tr>
                        )}

                        {record.status !== "paid" && (record.paidAmount || 0) > 0 && (
                            <tr>
                                <td style={{ color: "#e11d48", fontWeight: 800 }}>Remaining Due</td>
                                <td className="right money" style={{ color: "#e11d48", fontWeight: 900 }}>{fmt(record.netSalary - (record.paidAmount || 0))}</td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {(record.status === "paid" || record.status === "partial") && (
                    <div style={{ padding: "14px 18px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 12, color: "#64748b" }}>
                            <span>Paid on</span>
                            <span style={{ color: "#0f172a", fontWeight: 700 }}>
                                {record.paymentDate ? new Date(record.paymentDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                            </span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 12, color: "#64748b", marginTop: 6 }}>
                            <span>Mode</span>
                            <span style={{ color: "#0f172a", fontWeight: 700, textTransform: "capitalize" }}>{record.paymentMode || "—"}</span>
                        </div>
                        {record.transactionId && (
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 12, color: "#64748b", marginTop: 6 }}>
                                <span>Txn ID</span>
                                <span style={{ color: "#0f172a", fontWeight: 700 }}>{record.transactionId}</span>
                            </div>
                        )}
                        {record.remarks && (
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 12, color: "#64748b", marginTop: 6 }}>
                                <span>Remarks</span>
                                <span style={{ color: "#0f172a", fontWeight: 700 }}>{record.remarks}</span>
                            </div>
                        )}
                    </div>
                )}

                <div className="slip-bottom flex justify-between gap-6 p-4">
                    <div className="sig-box flex-1 border border-dashed border-slate-400 rounded-xl p-3 min-h-[78px]">
                        <div className="sig-title text-xs font-bold text-slate-500 uppercase tracking-wide">Principal Signature</div>
                        {school?.principalSignature ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img className="sig-img max-w-[150px] max-h-[44px] object-contain mt-2" src={school.principalSignature} alt="Principal signature" />
                        ) : (
                            <div className="sig-name text-base font-extrabold mt-2 text-slate-900">{school?.principalName ?? "Principal"}</div>
                        )}
                        {!school?.principalSignature && (
                            <div style={{ marginTop: 6, color: "#64748b", fontSize: 12 }}>
                                {school?.principalName ?? "Principal"}
                            </div>
                        )}
                    </div>
                    <div className="stamp-box flex-1 border border-dashed border-amber-400 rounded-xl p-3 min-h-[78px] flex flex-col items-center justify-center">
                        <div className="sig-title text-xs font-bold text-amber-600 uppercase tracking-wide">Principal Stamp</div>
                        {school?.stamp ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img className="stamp-img max-w-[120px] max-h-[52px] object-contain" src={school.stamp} alt="Principal stamp" />
                        ) : (
                            <div style={{ fontSize: 12, fontWeight: 800, color: "#b45309" }}>STAMP</div>
                        )}
                    </div>
                </div>

                <div className="slip-footnote">
                    Generated by SMS School Management System.
                </div>
            </div>
            <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={onClose}>Close</Button>
                <Button className="flex-1 gap-1.5" onClick={handlePrint}>
                    <Download className="h-4 w-4" /> Print / Save PDF
                </Button>
            </div>
        </Modal>
    );
}
