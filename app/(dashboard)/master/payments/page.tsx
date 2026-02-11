"use client";

import {
    CreditCard,
    ArrowUpRight,
    ArrowDownLeft,
    Search,
    Filter,
    Download,
    CheckCircle2,
    Clock,
    ShieldCheck,
    TrendingUp,
    History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const TRANSACTIONS = [
    { id: "TX-1092", school: "Shagun Modern School", amount: "₹8,400", date: "Oct 12, 2026", status: "success", type: "Renewal" },
    { id: "TX-1091", school: "Elite Public School", amount: "₹1,999", date: "Oct 12, 2026", status: "pending", type: "Subscription" },
    { id: "TX-1090", school: "Greenwood International", amount: "₹45,231", date: "Oct 11, 2026", status: "success", type: "Annual" },
    { id: "TX-1089", school: "St. Mary's Academy", amount: "₹12,400", date: "Oct 10, 2026", status: "success", type: "Custom Support" },
    { id: "TX-1088", school: "Shagun Modern School", amount: "₹500", date: "Oct 10, 2026", status: "failed", type: "Add-on" },
];

export default function GlobalPaymentsPage() {
    return (
        <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                        Financial Clearinghouse
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Real-time monitoring of all ecosystem revenue, transaction health, and billing lifecycles.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2 border-white/10 hover:bg-white/5">
                        <Download className="h-4 w-4" /> Export Ledger
                    </Button>
                    <Button className="bg-indigo-600 hover:bg-indigo-500 gap-2 font-bold">
                        <Filter className="h-4 w-4" /> Filter Stream
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="border-white/5 bg-neutral-900/50 backdrop-blur-xl p-6">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                        <TrendingUp className="h-3 w-3 text-emerald-500" /> MRR (Ecosystem)
                    </p>
                    <div className="flex items-baseline gap-2 mt-4">
                        <h3 className="text-3xl font-bold text-white tracking-tight">₹1.42M</h3>
                        <span className="text-xs text-emerald-500 font-bold">+12.4%</span>
                    </div>
                </Card>

                <Card className="border-white/5 bg-neutral-900/50 backdrop-blur-xl p-6">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                        <ShieldCheck className="h-3 w-3 text-blue-500" /> Success Rate
                    </p>
                    <div className="flex items-baseline gap-2 mt-4">
                        <h3 className="text-3xl font-bold text-white tracking-tight">98.4%</h3>
                        <span className="text-xs text-blue-500 font-bold">Stable</span>
                    </div>
                </Card>

                <Card className="border-white/5 bg-neutral-900/50 backdrop-blur-xl p-6">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                        <Clock className="h-3 w-3 text-yellow-500" /> Avg. Settlement
                    </p>
                    <div className="flex items-baseline gap-2 mt-4">
                        <h3 className="text-3xl font-bold text-white tracking-tight">2.4h</h3>
                        <span className="text-xs text-yellow-500 font-bold">-0.8h</span>
                    </div>
                </Card>
            </div>

            <Card className="border-white/5 bg-neutral-900/50 backdrop-blur-xl overflow-hidden">
                <CardHeader className="border-b border-white/5 bg-white/[0.01]">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <History className="h-5 w-5 text-zinc-400" /> Live Transaction Stream
                        </CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                            <Input placeholder="Search records..." className="h-9 pl-9 text-xs bg-white/[0.02] border-white/10" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/[0.02]">
                                    <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Transaction ID</th>
                                    <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Institution</th>
                                    <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Amount</th>
                                    <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Type</th>
                                    <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {TRANSACTIONS.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className={`p-1.5 rounded-lg ${tx.status === 'success' ? 'bg-emerald-500/10' : tx.status === 'pending' ? 'bg-yellow-500/10' : 'bg-red-500/10'}`}>
                                                    {tx.status === 'success' ? <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" /> : <Clock className="h-3.5 w-3.5 text-yellow-500" />}
                                                </div>
                                                <span className="text-sm font-mono font-bold text-zinc-300">{tx.id}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-white">{tx.school}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-white font-mono">{tx.amount}</td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-bold bg-zinc-800 px-2 py-0.5 rounded text-zinc-400 uppercase tracking-wider">
                                                {tx.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {tx.status === 'success' ? (
                                                <div className="flex items-center gap-1.5 text-emerald-500 text-xs font-bold">
                                                    <CheckCircle2 className="h-4 w-4" /> SUCCESS
                                                </div>
                                            ) : tx.status === 'pending' ? (
                                                <div className="flex items-center gap-1.5 text-yellow-500 text-xs font-bold animate-pulse">
                                                    <Clock className="h-4 w-4" /> PENDING
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-red-500 text-xs font-bold">
                                                    <ShieldCheck className="h-4 w-4" /> FAILED
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
