"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, CreditCard, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import api from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function MasterUsersBillingPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [changePlanSchool, setChangePlanSchool] = useState<{ _id: string; schoolName: string } | null>(null);
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
    const queryClient = useQueryClient();

    const { data: schoolsData, isLoading } = useQuery({
        queryKey: ["master-schools-billing"],
        queryFn: async () => {
            const res = await api.get("/master/schools", { params: { limit: 100 } });
            return res.data?.data?.rows ?? [];
        },
    });

    const { data: plans } = useQuery({
        queryKey: ["master-plans"],
        queryFn: async () => {
            const res = await api.get("/master/plans");
            return res.data?.data ?? [];
        },
    });

    const putSubscriptionMutation = useMutation({
        mutationFn: async ({ schoolId, planId }: { schoolId: string; planId: string }) => {
            const end = new Date();
            end.setFullYear(end.getFullYear() + 1);
            await api.put(`/master/subscription/${schoolId}`, {
                planId,
                subscriptionEnd: end.toISOString().slice(0, 10),
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["master-schools-billing"] });
            setChangePlanSchool(null);
            setSelectedPlanId(null);
            toast.success("Plan assigned.");
        },
        onError: () => toast.error("Failed to assign plan."),
    });

    const rows = schoolsData ?? [];
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
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Users & Billing</h1>
                <p className="mt-1 text-sm text-muted-foreground">Manage user accounts and assign billing plans.</p>
            </div>

            <div className="relative max-w-md">
                <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="Search by school name or code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                />
            </div>

            <Card className="overflow-hidden rounded-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/50 text-left font-medium text-muted-foreground">
                                <th className="p-4">School</th>
                                <th className="p-4">Current plan</th>
                                <th className="p-4">Subscription end</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-muted-foreground">
                                        No schools found. Only registered schools are shown.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((row: any) => (
                                    <tr key={row._id} className="border-b hover:bg-muted/30">
                                        <td className="p-4">
                                            <div className="font-semibold">{row.schoolName}</div>
                                            <div className="text-xs text-muted-foreground">{row.schoolCode}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium">
                                                <CreditCard className="h-3.5 w-3.5" />
                                                {row.plan ?? "—"}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {row.subscriptionEnd
                                                ? new Date(row.subscriptionEnd).toLocaleDateString(undefined, { dateStyle: "medium" })
                                                : "—"}
                                        </td>
                                        <td className="p-4 text-right">
                                            <Button
                                                size="sm"
                                                onClick={() => setChangePlanSchool({ _id: row._id, schoolName: row.schoolName })}
                                            >
                                                Change plan
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Dialog open={!!changePlanSchool} onOpenChange={(open) => !open && setChangePlanSchool(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Change plan</DialogTitle>
                        <p className="text-sm text-muted-foreground">Update billing plan for {changePlanSchool?.schoolName}.</p>
                    </DialogHeader>
                    <div className="grid gap-3 py-4 sm:grid-cols-2">
                        {(plans ?? []).map((p: any) => (
                            <button
                                key={p._id}
                                type="button"
                                onClick={() => setSelectedPlanId(p._id)}
                                className={`rounded-xl border-2 p-4 text-left transition-all ${
                                    selectedPlanId === p._id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                                }`}
                            >
                                <div className="font-semibold">{p.name}</div>
                                <div className="mt-1 text-lg font-bold text-primary">
                                    {Number(p.priceMonthly) === 0 && Number(p.priceYearly) === 0 ? "Free" : `₹${Number(p.priceMonthly).toLocaleString()}/mo`}
                                </div>
                                <div className="mt-2 text-xs text-muted-foreground">
                                    Students: {p.maxStudents} · Teachers: {p.maxTeachers}
                                </div>
                            </button>
                        ))}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setChangePlanSchool(null)}>Cancel</Button>
                        <Button
                            disabled={!selectedPlanId}
                            onClick={() =>
                                changePlanSchool &&
                                selectedPlanId &&
                                putSubscriptionMutation.mutate({ schoolId: changePlanSchool._id, planId: selectedPlanId })
                            }
                        >
                            Assign plan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
