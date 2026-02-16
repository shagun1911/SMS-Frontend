"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Building2,
    Search,
    MoreVertical,
    CheckCircle2,
    XCircle,
    Loader2,
    CreditCard,
    Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import api from "@/lib/api";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function MasterSchoolsPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ["master-schools", page],
        queryFn: async () => {
            const res = await api.get("/master/schools", { params: { page, limit: 10 } });
            return res.data?.data ?? { rows: [], pagination: {} };
        },
    });

    const updateSchoolMutation = useMutation({
        mutationFn: async ({ id, data: body }: { id: string; data: any }) => {
            const res = await api.patch(`/master/schools/${id}`, body);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["master-schools"] });
            toast.success("School updated.");
        },
        onError: () => toast.error("Failed to update school."),
    });

    const putSubscriptionMutation = useMutation({
        mutationFn: async ({ schoolId, body }: { schoolId: string; body: any }) => {
            const res = await api.put(`/master/subscription/${schoolId}`, body);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["master-schools"] });
            toast.success("Subscription updated.");
        },
        onError: () => toast.error("Failed to update subscription."),
    });

    const rows = data?.rows ?? [];
    const pagination = data?.pagination ?? { page: 1, pages: 1, total: 0 };
    const filtered = searchTerm
        ? rows.filter(
            (s: any) =>
                s.schoolName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.schoolCode?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : rows;

    if (isLoading) {
        return (
            <div className="flex h-[80vh] w-full items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-gray-900">Schools</h2>
                <p className="mt-1 text-sm text-gray-500">Plan, usage and subscription status. No student-level detail.</p>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                    placeholder="Search by name or code..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-gray-50 text-left font-medium text-gray-600">
                                <th className="p-3">School Name</th>
                                <th className="p-3">Plan</th>
                                <th className="p-3">Students</th>
                                <th className="p-3">Teachers</th>
                                <th className="p-3">Status</th>
                                <th className="p-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">
                                        No schools found.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((row: any) => (
                                    <tr key={row._id} className="border-b hover:bg-gray-50">
                                        <td className="p-3">
                                            <div className="font-medium text-gray-900">{row.schoolName}</div>
                                            <div className="text-xs text-gray-500">{row.schoolCode}</div>
                                        </td>
                                        <td className="p-3">{row.plan ?? "—"}</td>
                                        <td className="p-3">{row.students ?? 0}</td>
                                        <td className="p-3">{row.teachers ?? 0}</td>
                                        <td className="p-3">
                                            <span
                                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                                    row.status === "active"
                                                        ? "bg-emerald-100 text-emerald-700"
                                                        : row.status === "expired"
                                                            ? "bg-red-100 text-red-700"
                                                            : "bg-gray-100 text-gray-600"
                                                }`}
                                            >
                                                {row.status ?? "none"}
                                            </span>
                                        </td>
                                        <td className="p-3 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            putSubscriptionMutation.mutate({
                                                                schoolId: row._id,
                                                                body: { status: "active" },
                                                            })
                                                        }
                                                    >
                                                        <CheckCircle2 className="mr-2 h-4 w-4" /> Activate
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            putSubscriptionMutation.mutate({
                                                                schoolId: row._id,
                                                                body: { status: "suspended" },
                                                            })
                                                        }
                                                    >
                                                        <XCircle className="mr-2 h-4 w-4" /> Suspend
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            updateSchoolMutation.mutate({
                                                                id: row._id,
                                                                data: { isActive: !row.isActive },
                                                            })
                                                        }
                                                    >
                                                        <Building2 className="mr-2 h-4 w-4" /> Toggle active
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {pagination.pages > 1 && (
                    <div className="flex items-center justify-between border-t px-3 py-2 text-sm text-gray-500">
                        <span>
                            Total {pagination.total} • Page {pagination.page} of {pagination.pages}
                        </span>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={pagination.page <= 1}
                                onClick={() => setPage((p) => p - 1)}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={pagination.page >= pagination.pages}
                                onClick={() => setPage((p) => p + 1)}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
