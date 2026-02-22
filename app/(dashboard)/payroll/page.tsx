"use client";

import { useState, useMemo } from "react";
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
    { value: "online", label: "Online" },
    { value: "upi", label: "UPI" },
    { value: "bank", label: "Bank Transfer" },
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

    const generateMut = useMutation({
        mutationFn: async () => {
            const res = await api.post("/salaries/generate", { month, year });
            return res.data?.data ?? res.data;
        },
        onSuccess: (d) => {
            toast.success(`Generated ${d.created} salary records (${d.skipped} skipped)`);
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
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <select
                                value={month}
                                onChange={(e) => setMonth(e.target.value)}
                                className="h-9 appearance-none rounded-lg border border-border bg-card pl-3 pr-8 text-sm focus:ring-2 focus:ring-primary"
                            >
                                {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="relative">
                            <select
                                value={year}
                                onChange={(e) => setYear(Number(e.target.value))}
                                className="h-9 appearance-none rounded-lg border border-border bg-card pl-3 pr-8 text-sm focus:ring-2 focus:ring-primary"
                            >
                                {Array.from({ length: 5 }, (_, i) => currentYear() - 2 + i).map((y) => (
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
                        sub={`${s.pendingCount ?? 0} staff`}
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
                        {["all", "pending", "paid", "hold"].map((s) => (
                            <Button
                                key={s}
                                size="sm"
                                variant={statusFilter === s ? "default" : "outline"}
                                className="h-8 text-xs capitalize"
                                onClick={() => setStatusFilter(s)}
                            >
                                {s === "all" ? "All" : s}
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
                                        <th className="px-4 py-3 text-right">Net</th>
                                        <th className="px-4 py-3 text-center">Status</th>
                                        <th className="px-4 py-3">Payment</th>
                                        <th className="px-4 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((r: any) => {
                                        const allowTotal = (r.allowances || []).reduce((s: number, a: any) => s + a.amount, 0);
                                        const deductTotal = (r.deductions || []).reduce((s: number, d: any) => s + d.amount, 0);
                                        return (
                                            <tr key={r._id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                                                <td className="px-4 py-3 font-medium">{r.staffId?.name ?? "—"}</td>
                                                <td className="px-4 py-3 text-muted-foreground capitalize text-xs">
                                                    {(r.staffId?.role || "").replace(/_/g, " ")}
                                                </td>
                                                <td className="px-4 py-3 text-right tabular-nums">{fmt(r.basicSalary)}</td>
                                                <td className="px-4 py-3 text-right tabular-nums text-emerald-600">+{fmt(allowTotal)}</td>
                                                <td className="px-4 py-3 text-right tabular-nums text-rose-500">-{fmt(deductTotal)}</td>
                                                <td className="px-4 py-3 text-right tabular-nums font-semibold">{fmt(r.netSalary)}</td>
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
                                                            <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-600" title="Pay" onClick={() => setPayRecord(r)}>
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
                                        <td className="px-4 py-3" colSpan={5}>Total ({filtered.length} staff)</td>
                                        <td className="px-4 py-3 text-right tabular-nums">
                                            {fmt(filtered.reduce((s: number, r: any) => s + (r.netSalary || 0), 0))}
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
                <SlipViewer record={slipRecord} onClose={() => setSlipRecord(null)} />
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

    const payMut = useMutation({
        mutationFn: async () => {
            await api.post(`/salaries/${record._id}/pay`, {
                amount: record.netSalary,
                mode,
                transactionId: txnId || undefined,
                remarks: remarks || undefined,
            });
        },
        onSuccess: () => {
            toast.success("Salary payment recorded");
            setMode("cash"); setTxnId(""); setRemarks("");
            onSuccess();
        },
        onError: (e: any) => toast.error(e.response?.data?.message ?? "Payment failed"),
    });

    if (!record) return null;
    const allowTotal = (record.allowances || []).reduce((s: number, a: any) => s + a.amount, 0);
    const deductTotal = (record.deductions || []).reduce((s: number, d: any) => s + d.amount, 0);
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
                        <span className="text-emerald-600">{fmt(record.netSalary)}</span>
                    </div>
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
                    <Button className="flex-1 bg-emerald-600 hover:bg-emerald-500" onClick={() => payMut.mutate()} disabled={payMut.isPending}>
                        {payMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : `Pay ${fmt(record.netSalary)}`}
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
function SlipViewer({ record, onClose }: { record: any | null; onClose: () => void }) {
    if (!record) return null;
    const allowTotal = (record.allowances || []).reduce((s: number, a: any) => s + a.amount, 0);
    const deductTotal = (record.deductions || []).reduce((s: number, d: any) => s + d.amount, 0);
    const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

    const handlePrint = () => {
        const el = document.getElementById("salary-slip-content");
        if (!el) return;
        const w = window.open("", "_blank", "width=600,height=700");
        if (!w) return;
        w.document.write(`<html><head><title>Salary Slip – ${record.staffId?.name}</title>
            <style>body{font-family:system-ui,sans-serif;padding:32px;color:#111}
            table{width:100%;border-collapse:collapse;margin:16px 0}
            td,th{padding:8px 12px;border:1px solid #ddd;text-align:left;font-size:13px}
            th{background:#f5f5f5;font-weight:600} h2{margin:0 0 4px} .right{text-align:right}
            .total{font-weight:700;font-size:15px;border-top:2px solid #333}
            </style></head><body>${el.innerHTML}</body></html>`);
        w.document.close();
        w.print();
    };

    return (
        <Modal isOpen={!!record} onClose={onClose} title="Salary Slip" description={`${record.staffId?.name ?? "Staff"} · ${record.month} ${record.year}`}>
            <div id="salary-slip-content" className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <div><span className="text-muted-foreground">Employee:</span> <strong>{record.staffId?.name}</strong></div>
                    <div><span className="text-muted-foreground">Role:</span> <span className="capitalize">{(record.staffId?.role || "").replace(/_/g, " ")}</span></div>
                    <div><span className="text-muted-foreground">Period:</span> {record.month} {record.year}</div>
                    <div><span className="text-muted-foreground">Status:</span> <StatusBadge status={record.status} /></div>
                </div>
                <table className="w-full text-sm border rounded-lg overflow-hidden">
                    <thead>
                        <tr className="bg-muted/40 text-xs font-medium text-muted-foreground uppercase">
                            <th className="px-3 py-2 text-left">Component</th>
                            <th className="px-3 py-2 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-b"><td className="px-3 py-2">Base Salary</td><td className="px-3 py-2 text-right tabular-nums">{fmt(record.basicSalary)}</td></tr>
                        {(record.allowances || []).map((a: any, i: number) => (
                            <tr key={`a${i}`} className="border-b"><td className="px-3 py-2 pl-6 text-emerald-600">{a.title}</td><td className="px-3 py-2 text-right text-emerald-600 tabular-nums">+{fmt(a.amount)}</td></tr>
                        ))}
                        {(record.deductions || []).map((d: any, i: number) => (
                            <tr key={`d${i}`} className="border-b"><td className="px-3 py-2 pl-6 text-rose-500">{d.title}</td><td className="px-3 py-2 text-right text-rose-500 tabular-nums">-{fmt(d.amount)}</td></tr>
                        ))}
                        <tr className="border-t-2 font-semibold">
                            <td className="px-3 py-2">Gross Salary</td>
                            <td className="px-3 py-2 text-right tabular-nums">{fmt(record.totalSalary)}</td>
                        </tr>
                        <tr className="font-semibold text-base">
                            <td className="px-3 py-2">Net Payable</td>
                            <td className="px-3 py-2 text-right tabular-nums text-emerald-600">{fmt(record.netSalary)}</td>
                        </tr>
                    </tbody>
                </table>
                {record.status === "paid" && (
                    <div className="rounded-lg border bg-emerald-50 dark:bg-emerald-500/5 p-3 text-xs space-y-1">
                        <div className="flex justify-between"><span className="text-muted-foreground">Paid on</span><span>{record.paymentDate ? new Date(record.paymentDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Mode</span><span className="capitalize">{record.paymentMode || "—"}</span></div>
                        {record.transactionId && <div className="flex justify-between"><span className="text-muted-foreground">Txn ID</span><span>{record.transactionId}</span></div>}
                        {record.remarks && <div className="flex justify-between"><span className="text-muted-foreground">Remarks</span><span>{record.remarks}</span></div>}
                    </div>
                )}
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
