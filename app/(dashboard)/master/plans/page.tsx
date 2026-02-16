"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import api from "@/lib/api";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

const defaultPlan = {
    name: "",
    maxStudents: 500,
    maxTeachers: 50,
    priceMonthly: 0,
    priceYearly: 0,
    features: "",
};

export default function MasterPlansPage() {
    const [open, setOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(defaultPlan);
    const queryClient = useQueryClient();

    const { data: plans, isLoading } = useQuery({
        queryKey: ["master-plans"],
        queryFn: async () => {
            const res = await api.get("/master/plans");
            return res.data?.data ?? [];
        },
    });

    const createMutation = useMutation({
        mutationFn: async (body: any) => {
            const res = await api.post("/master/plans", body);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["master-plans"] });
            setOpen(false);
            setForm(defaultPlan);
            toast.success("Plan created.");
        },
        onError: () => toast.error("Failed to create plan."),
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, body }: { id: string; body: any }) => {
            const res = await api.put(`/master/plans/${id}`, body);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["master-plans"] });
            setOpen(false);
            setEditingId(null);
            setForm(defaultPlan);
            toast.success("Plan updated.");
        },
        onError: () => toast.error("Failed to update plan."),
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/master/plans/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["master-plans"] });
            toast.success("Plan deleted.");
        },
        onError: () => toast.error("Cannot delete plan in use or failed."),
    });

    const openCreate = () => {
        setForm(defaultPlan);
        setEditingId(null);
        setOpen(true);
    };

    const openEdit = (p: any) => {
        setForm({
            name: p.name ?? "",
            maxStudents: p.maxStudents ?? 0,
            maxTeachers: p.maxTeachers ?? 0,
            priceMonthly: p.priceMonthly ?? 0,
            priceYearly: p.priceYearly ?? 0,
            features: Array.isArray(p.features) ? p.features.join("\n") : "",
        });
        setEditingId(p._id);
        setOpen(true);
    };

    const submit = () => {
        const body = {
            name: form.name,
            maxStudents: Number(form.maxStudents),
            maxTeachers: Number(form.maxTeachers),
            priceMonthly: Number(form.priceMonthly),
            priceYearly: Number(form.priceYearly),
            features: form.features.split("\n").map((s) => s.trim()).filter(Boolean),
        };
        if (editingId) updateMutation.mutate({ id: editingId, body });
        else createMutation.mutate(body);
    };

    if (isLoading) {
        return (
            <div className="flex h-[80vh] w-full items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">Plans</h2>
                    <p className="mt-1 text-sm text-gray-500">Create, edit or deactivate subscription tiers.</p>
                </div>
                <Button className="bg-indigo-600 hover:bg-indigo-500 gap-2" onClick={openCreate}>
                    <Plus className="h-4 w-4" /> Create plan
                </Button>
            </div>

            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-gray-50 text-left font-medium text-gray-600">
                                <th className="p-3">Name</th>
                                <th className="p-3">Max Students</th>
                                <th className="p-3">Max Teachers</th>
                                <th className="p-3">Price (mo)</th>
                                <th className="p-3">Price (yr)</th>
                                <th className="p-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(plans ?? []).map((p: any) => (
                                <tr key={p._id} className="border-b hover:bg-gray-50">
                                    <td className="p-3 font-medium">{p.name}</td>
                                    <td className="p-3">{p.maxStudents}</td>
                                    <td className="p-3">{p.maxTeachers}</td>
                                    <td className="p-3">₹{Number(p.priceMonthly).toLocaleString()}</td>
                                    <td className="p-3">₹{Number(p.priceYearly).toLocaleString()}</td>
                                    <td className="p-3 text-right">
                                        <Button variant="ghost" size="sm" className="mr-2" onClick={() => openEdit(p)}>
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-600 hover:text-red-700"
                                            onClick={() => deleteMutation.mutate(p._id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingId ? "Edit plan" : "Create plan"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div>
                            <label className="text-sm font-medium">Name</label>
                            <Input
                                value={form.name}
                                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                placeholder="e.g. Basic"
                                className="mt-1"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">Max Students</label>
                                <Input
                                    type="number"
                                    value={form.maxStudents}
                                    onChange={(e) => setForm((f) => ({ ...f, maxStudents: Number(e.target.value) }))}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Max Teachers</label>
                                <Input
                                    type="number"
                                    value={form.maxTeachers}
                                    onChange={(e) => setForm((f) => ({ ...f, maxTeachers: Number(e.target.value) }))}
                                    className="mt-1"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">Price (monthly) ₹</label>
                                <Input
                                    type="number"
                                    value={form.priceMonthly}
                                    onChange={(e) => setForm((f) => ({ ...f, priceMonthly: Number(e.target.value) }))}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Price (yearly) ₹</label>
                                <Input
                                    type="number"
                                    value={form.priceYearly}
                                    onChange={(e) => setForm((f) => ({ ...f, priceYearly: Number(e.target.value) }))}
                                    className="mt-1"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Features (one per line)</label>
                            <textarea
                                value={form.features}
                                onChange={(e) => setForm((f) => ({ ...f, features: e.target.value }))}
                                placeholder="Basic support"
                                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button onClick={submit} disabled={!form.name}>
                            {editingId ? "Update" : "Create"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
