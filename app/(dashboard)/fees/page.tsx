"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Banknote,
    Search,
    Filter,
    Download,
    Plus,
    Loader2,
    CheckCircle2,
    Clock,
    XCircle,
    IndianRupee,
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
import api from "@/lib/api";

export default function FeesPage() {
    const [searchTerm, setSearchTerm] = useState("");

    const { data: feesData, isLoading } = useQuery({
        queryKey: ["fees-list"],
        queryFn: async () => {
            const res = await api.get("/fees");
            return res.data.data;
        }
    });

    const fees = feesData || [];

    return (
        <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                        Fee Management
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Track student fee collections, pending dues, and financial history.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2 border-white/10 hover:bg-white/5">
                        <Download className="h-4 w-4" /> Export Ledger
                    </Button>
                    <Button className="bg-emerald-600 hover:bg-emerald-500 gap-2 font-bold">
                        <Plus className="h-4 w-4" /> Collect Fee
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card className="border-white/5 bg-neutral-900/50 backdrop-blur-xl p-4">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total Collected</p>
                    <div className="flex items-baseline gap-2 mt-2">
                        <h3 className="text-2xl font-bold text-white">₹12.4L</h3>
                        <span className="text-[10px] text-emerald-500 font-bold">+15%</span>
                    </div>
                </Card>
                <Card className="border-white/5 bg-neutral-900/50 backdrop-blur-xl p-4">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Outstanding</p>
                    <div className="flex items-baseline gap-2 mt-2">
                        <h3 className="text-2xl font-bold text-white text-yellow-500">₹2.8L</h3>
                    </div>
                </Card>
                <Card className="border-white/5 bg-neutral-900/50 backdrop-blur-xl p-4">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Collection Rate</p>
                    <div className="flex items-baseline gap-2 mt-2">
                        <h3 className="text-2xl font-bold text-white">82%</h3>
                    </div>
                </Card>
                <Card className="border-white/5 bg-neutral-900/50 backdrop-blur-xl p-4">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Transactions</p>
                    <div className="flex items-baseline gap-2 mt-2">
                        <h3 className="text-2xl font-bold text-white">1,042</h3>
                    </div>
                </Card>
            </div>

            <Card className="border-white/5 bg-neutral-900/50 backdrop-blur-xl overflow-hidden">
                <CardHeader className="border-b border-white/5 bg-white/[0.01]">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Banknote className="h-5 w-5 text-emerald-400" /> Payment Records
                        </CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                            <Input
                                placeholder="Search student or receipt..."
                                className="h-9 pl-9 text-xs bg-white/[0.02] border-white/10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex h-64 w-full items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                        </div>
                    ) : fees.length === 0 ? (
                        <div className="p-12 text-center text-zinc-500">
                            No payment records found.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-white/[0.02]">
                                <TableRow className="border-white/5">
                                    <TableHead className="text-zinc-500 font-bold uppercase text-[10px]">Receipt</TableHead>
                                    <TableHead className="text-zinc-500 font-bold uppercase text-[10px]">Student</TableHead>
                                    <TableHead className="text-zinc-500 font-bold uppercase text-[10px]">Fee Head</TableHead>
                                    <TableHead className="text-zinc-500 font-bold uppercase text-[10px]">Amount</TableHead>
                                    <TableHead className="text-zinc-500 font-bold uppercase text-[10px]">Status</TableHead>
                                    <TableHead className="text-zinc-500 font-bold uppercase text-[10px] text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {fees.map((fee: any) => (
                                    <TableRow key={fee._id} className="border-white/5 hover:bg-white/[0.01]">
                                        <TableCell className="font-mono text-xs text-zinc-400">{fee.receiptNo || "RC-000" + fee._id.slice(-4)}</TableCell>
                                        <TableCell>
                                            <div className="font-medium text-white">
                                                {fee.studentId ? `${fee.studentId.firstName} ${fee.studentId.lastName}` : "Unknown Student"}
                                            </div>
                                            <div className="text-[10px] text-zinc-500">Adm: {fee.studentId?.admissionNumber || "N/A"}</div>
                                        </TableCell>
                                        <TableCell className="text-xs text-zinc-300">{fee.feeStructure?.name || "Tuition Fee"}</TableCell>
                                        <TableCell className="font-bold text-white">₹{fee.amountPaid.toLocaleString()}</TableCell>
                                        <TableCell>
                                            <Badge className={
                                                fee.status === 'paid' ? "bg-emerald-500/10 text-emerald-500" :
                                                    fee.status === 'partial' ? "bg-yellow-500/10 text-yellow-500" :
                                                        "bg-red-500/10 text-red-500"
                                            }>
                                                {fee.status.toUpperCase()}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" className="hover:text-emerald-400">
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
        </div>
    );
}
