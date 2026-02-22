"use client";

import { useQuery } from "@tanstack/react-query";
import { UserX, Download, Loader2, Search } from "lucide-react";
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

    const { data: defaulters = [], isLoading } = useQuery({
        queryKey: ["fee-defaulters"],
        queryFn: async () => {
            const res = await api.get("/fees/defaulters");
            return res.data.data ?? [];
        },
    });

    const filtered = useMemo(() => {
        if (!search.trim()) return defaulters;
        const q = search.toLowerCase();
        return defaulters.filter((d: any) => {
            const name = `${d.firstName || ""} ${d.lastName || ""}`.toLowerCase();
            const adm = (d.admissionNumber || "").toLowerCase();
            const cls = (d.class || "").toLowerCase();
            return name.includes(q) || adm.includes(q) || cls.includes(q);
        });
    }, [defaulters, search]);

    const downloadCsv = () => {
        const headers = ["Admission No", "Student Name", "Father Name", "Class", "Section", "Total Fee", "Paid", "Due"];
        const rows = filtered.map((d: any) => [
            d.admissionNumber,
            `${d.firstName || ""} ${d.lastName || ""}`.trim(),
            d.fatherName || "",
            d.class || "",
            d.section || "",
            d.totalYearlyFee ?? 0,
            d.paidAmount ?? 0,
            d.dueAmount ?? 0,
        ]);
        const csv = [headers.join(","), ...rows.map((r: any[]) => r.join(","))].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `fee-defaulters-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
    };

    return (
        <LockedFeatureGate featureKey="fees" featureLabel="Fee defaulters">
        <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">Fee Defaulters</h2>
                    <p className="mt-1 text-sm text-gray-500">Students with pending fee (due amount &gt; 0).</p>
                </div>
                <Button variant="outline" className="gap-2" onClick={downloadCsv} disabled={filtered.length === 0}>
                    <Download className="h-4 w-4" /> Download list
                </Button>
            </div>

            <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                            <UserX className="h-5 w-5 text-amber-600" /> Defaulters ({filtered.length})
                        </CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="Search student..."
                                className="h-9 pl-9"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex h-48 items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">No defaulters at the moment.</div>
                    ) : (
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
                                {filtered.map((d: any) => (
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
                    )}
                </CardContent>
            </Card>
        </div>
        </LockedFeatureGate>
    );
}
