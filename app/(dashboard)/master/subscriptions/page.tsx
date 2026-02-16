"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CreditCard, Calendar, Loader2, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import api from "@/lib/api";

export default function MasterSubscriptionsPage() {
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ["master-schools-subscriptions"],
        queryFn: async () => {
            const res = await api.get("/master/schools", { params: { limit: 100 } });
            return res.data?.data?.rows ?? [];
        },
    });

    const putSubscriptionMutation = useMutation({
        mutationFn: async ({ schoolId, body }: { schoolId: string; body: any }) => {
            const res = await api.put(`/master/subscription/${schoolId}`, body);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["master-schools-subscriptions"] });
            toast.success("Subscription updated.");
        },
        onError: () => toast.error("Failed to update subscription."),
    });

    const rows = data ?? [];

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
                <h2 className="text-2xl font-bold tracking-tight text-gray-900">Subscriptions</h2>
                <p className="mt-1 text-sm text-gray-500">Manage plan and expiry. Change plan or extend subscription per school.</p>
            </div>

            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-gray-50 text-left font-medium text-gray-600">
                                <th className="p-3">School</th>
                                <th className="p-3">Plan</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Subscription end</th>
                                <th className="p-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500">
                                        No subscriptions. Assign a plan to a school from Schools → Actions.
                                    </td>
                                </tr>
                            ) : (
                                rows.map((row: any) => (
                                    <tr key={row._id} className="border-b hover:bg-gray-50">
                                        <td className="p-3">
                                            <div className="font-medium text-gray-900">{row.schoolName}</div>
                                            <div className="text-xs text-gray-500">{row.schoolCode}</div>
                                        </td>
                                        <td className="p-3">{row.plan ?? "—"}</td>
                                        <td className="p-3">
                                            <span
                                                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
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
                                        <td className="p-3 text-gray-600">
                                            {row.subscriptionEnd
                                                ? new Date(row.subscriptionEnd).toLocaleDateString()
                                                : "—"}
                                        </td>
                                        <td className="p-3 text-right">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="mr-2"
                                                onClick={() => {
                                                    const end = new Date();
                                                    end.setFullYear(end.getFullYear() + 1);
                                                    putSubscriptionMutation.mutate({
                                                        schoolId: row._id,
                                                        body: { subscriptionEnd: end.toISOString().slice(0, 10) },
                                                    });
                                                }}
                                            >
                                                Extend 1 year
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    putSubscriptionMutation.mutate({
                                                        schoolId: row._id,
                                                        body: { status: row.status === "active" ? "suspended" : "active" },
                                                    })
                                                }
                                            >
                                                {row.status === "active" ? "Suspend" : "Activate"}
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
