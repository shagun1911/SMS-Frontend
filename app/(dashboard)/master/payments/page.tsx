"use client";

import {
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
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                        Financial Clearinghouse
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Real-time monitoring of all ecosystem revenue, transaction health, and billing lifecycles.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2 border-gray-200 hover:bg-gray-50">
                        <Download className="h-4 w-4" /> Export
                    </Button>
                    <Button className="bg-indigo-600 hover:bg-indigo-500 gap-2">
                        <Filter className="h-4 w-4" /> Filter Stream
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <p className="flex items-center gap-2 text-xs font-medium uppercase text-gray-500">
                        <TrendingUp className="h-3 w-3 text-emerald-600" /> MRR
                    </p>
                    <div className="mt-2 flex items-baseline gap-2">
                        <h3 className="text-2xl font-bold text-gray-900">—</h3>
                        <span className="text-xs text-gray-500">From data</span>
                    </div>
                </Card>
                <Card className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <p className="flex items-center gap-2 text-xs font-medium uppercase text-gray-500">
                        <ShieldCheck className="h-3 w-3 text-indigo-600" /> Success Rate
                    </p>
                    <div className="mt-2 flex items-baseline gap-2">
                        <h3 className="text-2xl font-bold text-gray-900">—</h3>
                    </div>
                </Card>
                <Card className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <p className="flex items-center gap-2 text-xs font-medium uppercase text-gray-500">
                        <Clock className="h-3 w-3 text-amber-600" /> Settlement
                    </p>
                    <div className="mt-2 flex items-baseline gap-2">
                        <h3 className="text-2xl font-bold text-gray-900">—</h3>
                    </div>
                </Card>
            </div>

            <Card className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <CardHeader className="border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                            <History className="h-5 w-5 text-indigo-600" /> Transactions
                        </CardTitle>
                        <div className="relative w-56">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input placeholder="Search..." className="h-9 border-gray-200 bg-white pl-9 text-sm" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50">
                                    <th className="px-6 py-3 text-xs font-medium uppercase text-gray-500">ID</th>
                                    <th className="px-6 py-3 text-xs font-medium uppercase text-gray-500">Institution</th>
                                    <th className="px-6 py-3 text-xs font-medium uppercase text-gray-500">Amount</th>
                                    <th className="px-6 py-3 text-xs font-medium uppercase text-gray-500">Type</th>
                                    <th className="px-6 py-3 text-xs font-medium uppercase text-gray-500">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {TRANSACTIONS.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-gray-50/50">
                                        <td className="px-6 py-3 font-mono text-gray-700">{tx.id}</td>
                                        <td className="px-6 py-3 font-medium text-gray-900">{tx.school}</td>
                                        <td className="px-6 py-3 font-mono font-medium text-gray-900">{tx.amount}</td>
                                        <td className="px-6 py-3">
                                            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">{tx.type}</span>
                                        </td>
                                        <td className="px-6 py-3">
                                            {tx.status === "success" ? (
                                                <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                                                    <CheckCircle2 className="h-4 w-4" /> Success
                                                </span>
                                            ) : tx.status === "pending" ? (
                                                <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600">
                                                    <Clock className="h-4 w-4" /> Pending
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 text-xs font-medium text-red-600">Failed</span>
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
