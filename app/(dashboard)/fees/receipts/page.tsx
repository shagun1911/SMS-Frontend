"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Receipt, Download, Loader2, Search, Eye, Printer } from "lucide-react";
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

function formatDate(d: string | Date) {
    const x = new Date(d);
    return x.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatCurrency(n: number) {
    return `₹${Number(n).toLocaleString("en-IN")}`;
}

export default function ReceiptsPage() {
    const [search, setSearch] = useState("");
    const [pdfAction, setPdfAction] = useState<{ id: string; action: "preview" | "download" | "print" } | null>(null);

    const { data: payments = [], isLoading } = useQuery({
        queryKey: ["fee-payments"],
        queryFn: async () => {
            const res = await api.get("/fees/payments");
            return res.data.data ?? [];
        },
    });

    const filtered = useMemo(() => {
        if (!search.trim()) return payments;
        const q = search.toLowerCase();
        return payments.filter((p: any) => {
            const name = p.studentId
                ? `${p.studentId.firstName || ""} ${p.studentId.lastName || ""}`.toLowerCase()
                : "";
            const receipt = (p.receiptNumber || "").toLowerCase();
            return name.includes(q) || receipt.includes(q);
        });
    }, [payments, search]);

    const handleReceiptPdf = async (receiptId: string, action: "preview" | "download" | "print") => {
        setPdfAction({ id: receiptId, action });
        try {
            const res = await api.get(`/fees/receipt/${receiptId}${action === "preview" ? "?preview=1" : ""}`, {
                responseType: "blob",
            });
            const blob = res.data as Blob;
            const blobUrl = URL.createObjectURL(blob);
            if (action === "preview") {
                window.open(blobUrl, "_blank", "noopener");
                setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
            } else if (action === "download") {
                const a = document.createElement("a");
                a.href = blobUrl;
                a.download = `receipt-${receiptId}.pdf`;
                a.click();
                URL.revokeObjectURL(blobUrl);
            } else {
                const w = window.open(blobUrl, "_blank", "noopener");
                if (w) setTimeout(() => { w.print(); URL.revokeObjectURL(blobUrl); }, 800);
                else URL.revokeObjectURL(blobUrl);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setPdfAction(null);
        }
    };

    return (
        <LockedFeatureGate featureKey="fees" featureLabel="Fee receipts">
        <div className="flex-1 space-y-6">
            <div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">Receipts</h2>
                <p className="mt-1 text-sm text-gray-500">View and download fee payment receipts.</p>
            </div>

            <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                            <Receipt className="h-5 w-5 text-indigo-600" /> Payment receipts
                        </CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="Search by name or receipt..."
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
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">No receipts found.</div>
                    ) : (
                        <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50">
                                    <TableHead className="text-xs font-medium uppercase text-gray-500">Receipt No</TableHead>
                                    <TableHead className="text-xs font-medium uppercase text-gray-500">Student</TableHead>
                                    <TableHead className="text-xs font-medium uppercase text-gray-500">Date</TableHead>
                                    <TableHead className="text-xs font-medium uppercase text-gray-500">Amount</TableHead>
                                    <TableHead className="text-right text-xs font-medium uppercase text-gray-500">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((p: any) => (
                                    <TableRow key={p._id}>
                                        <TableCell className="font-mono text-sm">{p.receiptNumber}</TableCell>
                                        <TableCell>
                                            {p.studentId
                                                ? `${p.studentId.firstName || ""} ${p.studentId.lastName || ""}`.trim() || "—"
                                                : "—"}
                                            {p.studentId?.admissionNumber && (
                                                <span className="ml-1 text-xs text-gray-500">({p.studentId.admissionNumber})</span>
                                            )}
                                        </TableCell>
                                        <TableCell>{formatDate(p.paymentDate)}</TableCell>
                                        <TableCell className="font-semibold">{formatCurrency(p.amountPaid || 0)}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Preview" onClick={() => handleReceiptPdf(p._id, "preview")} disabled={pdfAction?.id === p._id}>
                                                {pdfAction?.id === p._id && pdfAction?.action === "preview" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Download" onClick={() => handleReceiptPdf(p._id, "download")} disabled={pdfAction?.id === p._id}>
                                                {pdfAction?.id === p._id && pdfAction?.action === "download" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Print" onClick={() => handleReceiptPdf(p._id, "print")} disabled={pdfAction?.id === p._id}>
                                                {pdfAction?.id === p._id && pdfAction?.action === "print" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                                            </Button>
                                        </TableCell>
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
