"use client";

import { useQuery } from "@tanstack/react-query";
import { UserX, Download, Loader2, Search, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { LockedFeatureGate } from "@/components/plan/locked-feature-gate";
import api from "@/lib/api";
import { useState, useMemo } from "react";

function formatCurrency(n: number) {
    return `₹${Number(n).toLocaleString("en-IN")}`;
}

export default function DefaultersPage() {
    const [search, setSearch] = useState("");

    const { data: overdue = [], isLoading: overdueLoading } = useQuery({
        queryKey: ["fee-defaulters-overdue"],
        queryFn: async () => {
            const res = await api.get("/fees/defaulters");
            return res.data.data ?? [];
        },
    });

    const { data: currentPending = [], isLoading: currentPendingLoading } = useQuery({
        queryKey: ["fee-pending-current-month"],
        queryFn: async () => {
            const res = await api.get("/fees/pending-current");
            return res.data.data ?? [];
        },
    });

    const filteredOverdue = useMemo(() => {
        if (!search.trim()) return overdue;
        const q = search.toLowerCase();
        return overdue.filter((d: any) => {
            const name = `${d.firstName || ""} ${d.lastName || ""}`.toLowerCase();
            const adm = (d.admissionNumber || "").toLowerCase();
            const cls = (d.class || "").toLowerCase();
            return name.includes(q) || adm.includes(q) || cls.includes(q);
        });
    }, [overdue, search]);

    const filteredCurrentPending = useMemo(() => {
        if (!search.trim()) return currentPending;
        const q = search.toLowerCase();
        return currentPending.filter((d: any) => {
            const name = `${d.firstName || ""} ${d.lastName || ""}`.toLowerCase();
            const adm = (d.admissionNumber || "").toLowerCase();
            const cls = (d.class || "").toLowerCase();
            return name.includes(q) || adm.includes(q) || cls.includes(q);
        });
    }, [currentPending, search]);

    const downloadCsv = (which: "overdue" | "current") => {
        const headers = which === "current"
            ? ["Admission No", "Student Name", "Father Name", "Class", "Section", "Month Fee", "Paid (Month)", "Due (Month)"]
            : ["Admission No", "Student Name", "Father Name", "Class", "Section", "Total Fee", "Paid", "Due"];
        const source = which === "overdue" ? filteredOverdue : filteredCurrentPending;
        const rows = source.map((d: any) => [
            d.admissionNumber,
            `${d.firstName || ""} ${d.lastName || ""}`.trim(),
            d.fatherName || "",
            d.class || "",
            d.section || "",
            which === "current" ? (d.currentMonthTotal ?? 0) : (d.totalYearlyFee ?? 0),
            which === "current" ? (d.currentMonthPaid ?? 0) : (d.paidAmount ?? 0),
            which === "current" ? (d.currentMonthDue ?? 0) : (d.dueAmount ?? 0),
        ]);
        const csv = [headers.join(","), ...rows.map((r: any[]) => r.join(","))].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${which === "overdue" ? "defaulters" : "pending-current-month"}-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
    };

    return (
        <LockedFeatureGate featureKey="fees" featureLabel="Pending students">
        <div className="flex-1 space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">Pending Students</h2>
                    <p className="mt-1 text-sm text-gray-500">Defaulters (previous months) and students who haven’t paid the current month.</p>
                </div>
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                        placeholder="Search student..."
                        className="h-9 pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <CardHeader>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                            <AlertTriangle className="h-5 w-5 text-red-500" /> Defaulters (Previous months) ({filteredOverdue.length})
                        </CardTitle>
                        <Button
                            variant="outline"
                            className="w-full sm:w-auto gap-2"
                            onClick={() => downloadCsv("overdue")}
                            disabled={filteredOverdue.length === 0}
                        >
                            <Download className="h-4 w-4" /> Download list
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {overdueLoading ? (
                        <div className="flex h-48 items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                        </div>
                    ) : filteredOverdue.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">No defaulters at the moment.</div>
                    ) : (
                        <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50">
                                    <TableHead className="text-xs font-medium uppercase text-gray-500">Admission No</TableHead>
                                    <TableHead className="text-xs font-medium uppercase text-gray-500">Student</TableHead>
                                    <TableHead className="text-xs font-medium uppercase text-gray-500">Class</TableHead>
                                    <TableHead className="text-xs font-medium uppercase text-gray-500">Total Fee</TableHead>
                                    <TableHead className="text-xs font-medium uppercase text-gray-500">Paid</TableHead>
                                    <TableHead className="text-xs font-medium uppercase text-amber-600">Due</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredOverdue.map((d: any) => (
                                    <TableRow key={d._id}>
                                        <TableCell className="font-mono text-sm">{d.admissionNumber}</TableCell>
                                        <TableCell>
                                            {`${d.firstName || ""} ${d.lastName || ""}`.trim() || "—"}
                                            {d.fatherName && <span className="block text-xs text-gray-500">{d.fatherName}</span>}
                                        </TableCell>
                                        <TableCell>{d.class} {d.section}</TableCell>
                                        <TableCell>{formatCurrency(d.totalYearlyFee ?? 0)}</TableCell>
                                        <TableCell>{formatCurrency(d.paidAmount ?? 0)}</TableCell>
                                        <TableCell className="font-semibold text-amber-600">{formatCurrency(d.dueAmount ?? 0)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <CardHeader>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                            <UserX className="h-5 w-5 text-amber-600" /> Pending (Current month) ({filteredCurrentPending.length})
                        </CardTitle>
                        <Button
                            variant="outline"
                            className="w-full sm:w-auto gap-2"
                            onClick={() => downloadCsv("current")}
                            disabled={filteredCurrentPending.length === 0}
                        >
                            <Download className="h-4 w-4" /> Download list
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {currentPendingLoading ? (
                        <div className="flex h-40 items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                        </div>
                    ) : filteredCurrentPending.length === 0 ? (
                        <div className="p-10 text-center text-gray-500">No pending students for the current month.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50">
                                        <TableHead className="text-xs font-medium uppercase text-gray-500">Admission No</TableHead>
                                        <TableHead className="text-xs font-medium uppercase text-gray-500">Student</TableHead>
                                        <TableHead className="text-xs font-medium uppercase text-gray-500">Class</TableHead>
                                        <TableHead className="text-xs font-medium uppercase text-gray-500">Month Fee</TableHead>
                                        <TableHead className="text-xs font-medium uppercase text-gray-500">Paid (Month)</TableHead>
                                        <TableHead className="text-xs font-medium uppercase text-amber-600">Due (Month)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredCurrentPending.map((d: any) => (
                                        <TableRow key={d._id}>
                                            <TableCell className="font-mono text-sm">{d.admissionNumber}</TableCell>
                                            <TableCell>
                                                {`${d.firstName || ""} ${d.lastName || ""}`.trim() || "—"}
                                                {d.fatherName && <span className="block text-xs text-gray-500">{d.fatherName}</span>}
                                            </TableCell>
                                            <TableCell>{d.class} {d.section}</TableCell>
                                            <TableCell>{formatCurrency(d.currentMonthTotal ?? 0)}</TableCell>
                                            <TableCell>{formatCurrency(d.currentMonthPaid ?? 0)}</TableCell>
                                            <TableCell className="font-semibold text-amber-600">{formatCurrency(d.currentMonthDue ?? 0)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
        </LockedFeatureGate>
    );
}
