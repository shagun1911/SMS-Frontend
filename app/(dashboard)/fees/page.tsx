"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Banknote,
    Search,
    Download,
    Plus,
    Loader2,
    FileText
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
import { Badge } from "@/components/ui/badge";
import { CollectFeeModal } from "@/components/fees/collect-fee-modal";
import { LockedFeatureGate } from "@/components/plan/locked-feature-gate";
import api from "@/lib/api";

function formatCurrency(amount: number): string {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount.toLocaleString()}`;
}

export default function FeesPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [isCollectFeeOpen, setIsCollectFeeOpen] = useState(false);

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ["fees-stats"],
        queryFn: async () => {
            const res = await api.get("/fees/stats");
            return res.data.data;
        },
    });

    const { data: feesData, isLoading: feesLoading } = useQuery({
        queryKey: ["fees-list"],
        queryFn: async () => {
            const res = await api.get("/fees");
            return res.data.data;
        },
    });

    const fees = feesData ?? [];
    const filteredFees = useMemo(() => {
        if (!searchTerm.trim()) return fees;
        const q = searchTerm.toLowerCase();
        return fees.filter((fee: any) => {
            const name = fee.studentId
                ? `${fee.studentId.firstName ?? ""} ${fee.studentId.lastName ?? ""}`.toLowerCase()
                : "";
            const adm = (fee.studentId?.admissionNumber ?? "").toString().toLowerCase();
            const receipt = (fee.receiptNo ?? fee._id).toString().toLowerCase();
            return name.includes(q) || adm.includes(q) || receipt.includes(q);
        });
    }, [fees, searchTerm]);

    const isLoading = statsLoading || feesLoading;
    const totalCollected = stats?.totalCollected ?? 0;
    const outstanding = stats?.outstanding ?? 0;
    const collectionRate = stats?.collectionRate ?? 0;
    const transactionCount = stats?.transactionCount ?? 0;

    return (
        <LockedFeatureGate featureKey="fees" featureLabel="Fee management">
        <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                        Fee Management
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Track student fee collections, pending dues, and financial history.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2 border-gray-200 hover:bg-gray-50">
                        <Download className="h-4 w-4" /> Export Ledger
                    </Button>
                    <Button 
                        className="bg-indigo-600 hover:bg-indigo-500 gap-2"
                        onClick={() => setIsCollectFeeOpen(true)}
                    >
                        <Plus className="h-4 w-4" /> Collect Fee
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Total Collected</p>
                    <div className="mt-2 flex items-baseline gap-2">
                        <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(totalCollected)}</h3>
                    </div>
                </Card>
                <Card className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Outstanding</p>
                    <div className="mt-2 flex items-baseline gap-2">
                        <h3 className="text-2xl font-bold text-amber-600">{formatCurrency(outstanding)}</h3>
                    </div>
                </Card>
                <Card className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Collection Rate</p>
                    <div className="mt-2 flex items-baseline gap-2">
                        <h3 className="text-2xl font-bold text-gray-900">{collectionRate}%</h3>
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
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                            <Banknote className="h-5 w-5 text-indigo-600" /> Payment Records
                        </CardTitle>
                        <div className="relative w-64">
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
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex h-64 w-full items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                        </div>
                    ) : filteredFees.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            No payment records found.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="border-gray-200 bg-gray-50 hover:bg-gray-50">
                                    <TableHead className="text-xs font-medium uppercase text-gray-500">Receipt</TableHead>
                                    <TableHead className="text-xs font-medium uppercase text-gray-500">Student</TableHead>
                                    <TableHead className="text-xs font-medium uppercase text-gray-500">Fee Head</TableHead>
                                    <TableHead className="text-xs font-medium uppercase text-gray-500">Amount</TableHead>
                                    <TableHead className="text-xs font-medium uppercase text-gray-500">Status</TableHead>
                                    <TableHead className="text-right text-xs font-medium uppercase text-gray-500">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredFees.map((fee: any) => {
                                    const amount = fee.paidAmount ?? fee.amountPaid ?? 0;
                                    const feeLabel = fee.month ?? fee.feeBreakdown?.[0]?.title ?? "Fee";
                                    return (
                                        <TableRow key={fee._id} className="border-gray-100 hover:bg-gray-50/50">
                                            <TableCell className="font-mono text-xs text-gray-600">
                                                {fee.receiptNo ?? `RC-${String(fee._id).slice(-6)}`}
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium text-gray-900">
                                                    {fee.studentId
                                                        ? `${fee.studentId.firstName ?? ""} ${fee.studentId.lastName ?? ""}`.trim() || "—"
                                                        : "Unknown"}
                                                </div>
                                                <div className="text-xs text-gray-500">Adm: {fee.studentId?.admissionNumber ?? "N/A"}</div>
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-600">{feeLabel}</TableCell>
                                            <TableCell className="font-semibold text-gray-900">₹{Number(amount).toLocaleString()}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    className={
                                                        fee.status === "paid"
                                                            ? "bg-emerald-100 text-emerald-700"
                                                            : fee.status === "partial"
                                                                ? "bg-amber-100 text-amber-700"
                                                                : "bg-red-100 text-red-700"
                                                    }
                                                >
                                                    {(fee.status ?? "").toUpperCase()}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" className="hover:bg-gray-100 hover:text-indigo-600">
                                                    <FileText className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
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
