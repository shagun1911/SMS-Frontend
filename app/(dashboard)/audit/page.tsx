"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Loader2 } from "lucide-react";
import api from "@/lib/api";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export default function AuditPage() {
    const { data: logs, isLoading } = useQuery({
        queryKey: ["audit-logs"],
        queryFn: async () => {
            const res = await api.get("/audit-logs?limit=100");
            return res.data.data ?? [];
        },
    });

    const list = Array.isArray(logs) ? logs : [];

    return (
        <div className="flex-1 space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-gray-900">Audit Logs</h2>
                <p className="mt-1 text-sm text-gray-500">Security and compliance audit trail.</p>
            </div>
            <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <CardHeader className="border-b border-gray-100">
                    <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                        <ShieldCheck className="h-5 w-5 text-indigo-600" /> Audit Trail
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex h-48 items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                        </div>
                    ) : list.length === 0 ? (
                        <div className="p-8 text-center text-sm text-gray-500">No audit log entries yet.</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="border-gray-200 bg-gray-50 hover:bg-gray-50">
                                    <TableHead className="text-xs font-medium uppercase text-gray-500">Time</TableHead>
                                    <TableHead className="text-xs font-medium uppercase text-gray-500">User</TableHead>
                                    <TableHead className="text-xs font-medium uppercase text-gray-500">Action</TableHead>
                                    <TableHead className="text-xs font-medium uppercase text-gray-500">Module</TableHead>
                                    <TableHead className="text-xs font-medium uppercase text-gray-500">Description</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {list.map((log: any) => (
                                    <TableRow key={log._id} className="border-gray-100 hover:bg-gray-50/50">
                                        <TableCell className="text-xs text-gray-600">
                                            {log.createdAt ? new Date(log.createdAt).toLocaleString() : "—"}
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-900">
                                            {(log.userId as any)?.name ?? (log.userId as any)?._id ?? "—"}
                                        </TableCell>
                                        <TableCell className="text-xs font-medium text-gray-700">{log.action ?? "—"}</TableCell>
                                        <TableCell className="text-xs text-gray-600">{log.module ?? "—"}</TableCell>
                                        <TableCell className="text-sm text-gray-600">{log.description ?? "—"}</TableCell>
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
