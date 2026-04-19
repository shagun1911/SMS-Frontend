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
    const [selectedClass, setSelectedClass] = useState("all");
    const [selectedSection, setSelectedSection] = useState("all");
    const [minDue, setMinDue] = useState("");

    const { data: overdue = [], isLoading: overdueLoading } = useQuery({
        queryKey: ["fee-defaulters-overdue"],
        queryFn: async () => {
            const res = await api.get("/fees/defaulters");
            return res.data.data ?? [];
        },
        staleTime: 60_000,
    });

    const { data: currentPending = [], isLoading: currentPendingLoading } = useQuery({
        queryKey: ["fee-pending-current-month"],
        queryFn: async () => {
            const res = await api.get("/fees/pending-current");
            return res.data.data ?? [];
        },
        staleTime: 60_000,
    });

    const allStudents = useMemo(() => [...overdue, ...currentPending], [overdue, currentPending]);

    const classOptions = useMemo(() => {
        return Array.from(
            new Set(
                allStudents
                    .map((s: any) => (s.class || "").toString().trim())
                    .filter(Boolean)
            )
        ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
    }, [allStudents]);

    const sectionOptions = useMemo(() => {
        return Array.from(
            new Set(
                allStudents
                    .filter((s: any) => selectedClass === "all" || (s.class || "").toString() === selectedClass)
                    .map((s: any) => (s.section || "").toString().trim())
                    .filter(Boolean)
            )
        ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
    }, [allStudents, selectedClass]);

    const matchesFilters = (d: any, which: "overdue" | "current") => {
        const classMatch = selectedClass === "all" || (d.class || "").toString() === selectedClass;
        const sectionMatch = selectedSection === "all" || (d.section || "").toString() === selectedSection;
        if (!classMatch || !sectionMatch) return false;

        const dueAmount = which === "current" ? Number(d.currentMonthDue ?? 0) : Number(d.dueAmount ?? 0);
        const minDueValue = minDue.trim() ? Number(minDue) : null;

        if (minDueValue !== null && !Number.isNaN(minDueValue) && dueAmount < minDueValue) return false;

        if (!search.trim()) return true;
        const q = search.toLowerCase();
        
        const name = `${d.firstName || ""} ${d.lastName || ""}`.toLowerCase();
        const adm = (d.admissionNumber || "").toLowerCase();
        const cls = (d.class || "").toLowerCase();
        const sec = (d.section || "").toLowerCase();
        return name.includes(q) || adm.includes(q) || cls.includes(q) || sec.includes(q);
    };

    const filteredOverdue = useMemo(() => {
        return overdue.filter((d: any) => matchesFilters(d, "overdue"));
    }, [overdue, search, selectedClass, selectedSection, minDue]);

    const filteredCurrentPending = useMemo(() => {
        return currentPending.filter((d: any) => matchesFilters(d, "current"));
    }, [currentPending, search, selectedClass, selectedSection, minDue]);

    const downloadCsv = (which: "overdue" | "current") => {
        const headers = which === "current"
            ? ["Admission No", "Student Name", "Father Name", "Class", "Section", "Month Fee", "Paid (Month)", "Due (Month)"]
            : ["Admission No", "Student Name", "Father Name", "Class", "Section", "Expected (Till Last Month)", "Paid (Till Last Month)", "Due (Till Last Month)"];
        const source = which === "overdue" ? filteredOverdue : filteredCurrentPending;
        const rows = source.map((d: any) => [
            d.admissionNumber,
            `${d.firstName || ""} ${d.lastName || ""}`.trim(),
            d.fatherName || "",
            d.class || "",
            d.section || "",
            which === "current" ? (d.currentMonthTotal ?? 0) : (d.expectedTillPrev ?? 0),
            which === "current" ? (d.currentMonthPaid ?? 0) : (d.paidTillPrev ?? 0),
            which === "current" ? (d.currentMonthDue ?? 0) : (d.previousMonthDue ?? 0),
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
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                    <select
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                        value={selectedClass}
                        onChange={(e) => {
                            setSelectedClass(e.target.value);
                            setSelectedSection("all");
                        }}
                    >
                        <option value="all">All Classes</option>
                        {classOptions.map((cls) => (
                            <option key={cls} value={cls}>{cls}</option>
                        ))}
                    </select>
                    <select
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                        value={selectedSection}
                        onChange={(e) => setSelectedSection(e.target.value)}
                    >
                        <option value="all">All Sections</option>
                        {sectionOptions.map((section) => (
                            <option key={section} value={section}>{section}</option>
                        ))}
                    </select>
                    <Input
                        type="number"
                        min="0"
                        placeholder="Min due"
                        className="h-9 w-full sm:w-28"
                        value={minDue}
                        onChange={(e) => setMinDue(e.target.value)}
                    />
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
                                    <TableHead className="text-xs font-medium uppercase text-gray-500">Expected (Till Last Month)</TableHead>
                                    <TableHead className="text-xs font-medium uppercase text-gray-500">Paid (Till Last Month)</TableHead>
                                    <TableHead className="text-xs font-medium uppercase text-amber-600">Due (Till Last Month)</TableHead>
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
                                        <TableCell>{formatCurrency(d.expectedTillPrev ?? 0)}</TableCell>
                                        <TableCell>{formatCurrency(d.paidTillPrev ?? 0)}</TableCell>
                                        <TableCell className="font-semibold text-amber-600">{formatCurrency(d.previousMonthDue ?? 0)}</TableCell>
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
