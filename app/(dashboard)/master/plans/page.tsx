"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2, Edit2, Trash2, GraduationCap, Users, CreditCard } from "lucide-react";
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

/** Feature keys that master admin can enable/disable per plan. Must match server PLAN_FEATURE_KEYS. */
const PLAN_FEATURE_KEYS = [
    "dashboard", "students", "classes", "sessions", "fees", "staff", "transport", "exams", "admit_cards", "timetable", "ai", "reports", "plan_billing",
] as const;
const PLAN_FEATURE_LABELS: Record<string, string> = {
    dashboard: "Dashboard",
    students: "Students",
    classes: "Classes & sections",
    sessions: "Sessions",
    fees: "Fee management",
    staff: "Staff & payroll",
    transport: "Transport",
    exams: "Exams & results",
    admit_cards: "Admit cards",
    timetable: "Timetable",
    ai: "AI assistant",
    reports: "Reports & analytics",
    plan_billing: "Plan & billing",
};

function getDefaultPlan() {
    return {
        name: "",
        description: "",
        maxStudents: 500,
        maxTeachers: 50,
        priceMonthly: 0,
        priceYearly: 0,
        features: "",
        isDefault: false,
        enabledFeatures: [...PLAN_FEATURE_KEYS] as string[],
    };
}

export default function MasterPlansPage() {
    const [open, setOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(() => getDefaultPlan());
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
            setForm(getDefaultPlan());
            toast.success("Plan created.");
        },
        onError: () => toast.error("Failed to create plan."),
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, body }: { id: string; body: any }) => {
            const planId = typeof id === "string" ? id : (id as any)?._id ?? String(id);
            const res = await api.put(`/master/plans/${planId}`, body);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["master-plans"] });
            setOpen(false);
            setEditingId(null);
            setForm(getDefaultPlan());
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
        setForm(getDefaultPlan());
        setEditingId(null);
        setOpen(true);
    };

    const openEdit = (p: any) => {
        setForm({
            name: p.name ?? "",
            description: p.description ?? "",
            maxStudents: p.maxStudents ?? 0,
            maxTeachers: p.maxTeachers ?? 0,
            priceMonthly: p.priceMonthly ?? 0,
            priceYearly: p.priceYearly ?? 0,
            features: Array.isArray(p.features) ? p.features.join("\n") : "",
            isDefault: !!p.isDefault,
            enabledFeatures: Array.isArray(p.enabledFeatures) && p.enabledFeatures.length > 0 ? p.enabledFeatures : [...PLAN_FEATURE_KEYS],
        });
        setEditingId(p._id);
        setOpen(true);
    };

    const submit = () => {
        const monthly = Number(form.priceMonthly);
        const yearly = monthly === 0 ? 0 : monthly * 11;
        const body = {
            name: form.name.trim(),
            description: form.description?.trim() || undefined,
            maxStudents: Number(form.maxStudents),
            maxTeachers: Number(form.maxTeachers),
            priceMonthly: monthly,
            priceYearly: yearly,
            features: form.features.split("\n").map((s) => s.trim()).filter(Boolean),
            isDefault: !!form.isDefault,
            ...(typeof form.enabledFeatures !== "undefined" && { enabledFeatures: form.enabledFeatures }),
        };
        if (editingId) updateMutation.mutate({ id: String(editingId), body });
        else createMutation.mutate(body);
    };

    const isFree = (p: any) => Number(p?.priceMonthly) === 0 && Number(p?.priceYearly) === 0;

    if (isLoading) {
        return (
            <div className="flex h-[80vh] w-full items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Plans management</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Create and manage billing plans.</p>
                </div>
                <Button className="w-fit gap-2" onClick={openCreate}>
                    <Plus className="h-4 w-4" /> Create plan
                </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(plans ?? []).map((p: any) => (
                    <Card key={p._id} className="relative flex flex-col rounded-2xl p-6 transition-shadow hover:shadow-lg">
                        <div className="mb-3 flex items-start justify-between">
                            <div>
                                <h3 className="font-semibold">{p.name}</h3>
                                {p.description && (
                                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                                )}
                                <p className="mt-0.5 text-lg font-bold text-primary">
                                    {isFree(p) ? "Free" : `₹${Number(p.priceMonthly).toLocaleString()}/mo`}
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {isFree(p) && (
                                    <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                                        Free plan
                                    </span>
                                )}
                                {p.isDefault && (
                                    <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                                        Default
                                    </span>
                                )}
                                <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600">
                                    Active
                                </span>
                            </div>
                        </div>
                        <ul className="mb-4 flex-1 space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-center gap-2">
                                <GraduationCap className="h-4 w-4 text-primary" />
                                Students: {p.maxStudents}
                            </li>
                            <li className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-primary" />
                                Teachers: {p.maxTeachers}
                            </li>
                            {Array.isArray(p.features) &&
                                p.features.slice(0, 3).map((f: string, i: number) => (
                                    <li key={i} className="flex items-center gap-2">
                                        <CreditCard className="h-4 w-4 text-primary" />
                                        {f}
                                    </li>
                                ))}
                        </ul>
                        <div className="flex items-center gap-2 border-t pt-4">
                            <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => openEdit(p)}>
                                <Edit2 className="h-3.5 w-3.5" /> Edit
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1.5 text-destructive hover:text-destructive"
                                onClick={() => deleteMutation.mutate(p._id)}
                            >
                                <Trash2 className="h-3.5 w-3.5" /> Delete
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>

            {(plans ?? []).length === 0 && (
                <Card className="rounded-2xl border-dashed p-12 text-center">
                    <p className="text-muted-foreground">No plans yet. Create one to get started.</p>
                    <Button className="mt-4 gap-2" onClick={openCreate}>
                        <Plus className="h-4 w-4" /> Create plan
                    </Button>
                </Card>
            )}

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingId ? "Edit plan" : "Create plan"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div>
                            <label className="text-sm font-medium text-foreground">Name</label>
                            <Input
                                value={form.name}
                                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                placeholder="e.g. Basic, Free Tier"
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-foreground">Description (optional)</label>
                            <Input
                                value={form.description}
                                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                                placeholder="e.g. For new schools, limited features"
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
                                    min={0}
                                    value={form.priceMonthly}
                                    onChange={(e) => {
                                        const monthly = Number(e.target.value);
                                        setForm((f) => ({ ...f, priceMonthly: monthly, priceYearly: monthly === 0 ? 0 : monthly * 11 }));
                                    }}
                                    className="mt-1"
                                />
                                <p className="mt-0.5 text-xs text-muted-foreground">Use 0 for free plan.</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Price (yearly) ₹</label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={form.priceYearly}
                                    onChange={(e) => setForm((f) => ({ ...f, priceYearly: Number(e.target.value) }))}
                                    className="mt-1"
                                />
                                <p className="mt-0.5 text-xs text-muted-foreground">Auto: monthly × 11 (1 month free).</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="isDefault"
                                checked={form.isDefault}
                                onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
                                className="h-4 w-4 rounded border-input"
                            />
                            <label htmlFor="isDefault" className="text-sm font-medium">Set as default plan (for new school registrations)</label>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Features included in this plan (uncheck to lock for schools)</label>
                            <div className="mt-2 grid grid-cols-2 gap-2 rounded-md border p-3">
                                {PLAN_FEATURE_KEYS.map((key) => (
                                    <label key={key} className="flex items-center gap-2 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={(form.enabledFeatures ?? []).includes(key)}
                                            onChange={(e) => {
                                                const next = e.target.checked
                                                    ? [...(form.enabledFeatures ?? []), key]
                                                    : (form.enabledFeatures ?? []).filter((f) => f !== key);
                                                setForm((f) => ({ ...f, enabledFeatures: next }));
                                            }}
                                            className="h-4 w-4 rounded border-input"
                                        />
                                        {PLAN_FEATURE_LABELS[key] ?? key}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Feature bullets (one per line, for display)</label>
                            <textarea
                                value={form.features}
                                onChange={(e) => setForm((f) => ({ ...f, features: e.target.value }))}
                                placeholder="Basic support"
                                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                                rows={2}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="button" onClick={submit} disabled={!form.name.trim() || (editingId ? updateMutation.isPending : createMutation.isPending)}>
                            {(editingId ? updateMutation : createMutation).isPending ? (
                                <><Loader2 className="h-4 w-4 animate-spin" /> {editingId ? "Updating…" : "Creating…"}</>
                            ) : editingId ? "Update" : "Create"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
