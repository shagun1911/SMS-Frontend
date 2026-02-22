"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    Layers,
    Plus,
    Pencil,
    Trash2,
    Printer,
    Loader2,
    X,
    Eye,
    Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { LockedFeatureGate } from "@/components/plan/locked-feature-gate";
import api from "@/lib/api";
import { toast } from "sonner";

const componentSchema = z.object({
    name: z.string().min(1),
    amount: z.number().min(0),
    type: z.enum(["monthly", "one-time"]),
});
const formSchema = z.object({
    class: z.string().min(1, "Select class"),
    components: z.array(componentSchema).min(1, "Add at least one component"),
});

type FormValues = z.infer<typeof formSchema>;

function formatCurrency(n: number) {
    return `₹${Number(n).toLocaleString("en-IN")}`;
}

export default function FeeStructurePage() {
    const queryClient = useQueryClient();
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [pdfAction, setPdfAction] = useState<{ id: string; action: "preview" | "download" | "print" } | null>(null);

    const { data: structures = [], isLoading } = useQuery({
        queryKey: ["fee-structures"],
        queryFn: async () => {
            const res = await api.get("/fees/structure/list");
            return res.data.data ?? [];
        },
    });

    const { data: classes = [] } = useQuery({
        queryKey: ["classes"],
        queryFn: async () => {
            const res = await api.get("/classes");
            return res.data.data ?? res.data ?? [];
        },
    });

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { class: "", components: [{ name: "Tuition Fee", amount: 0, type: "monthly" }] },
    });

    const { fields, append, remove } = useFieldArray({ control: form.control, name: "components" });

    // Annual total: monthly × 12, one-time as-is
    const totalAmount = form.watch("components")?.reduce((s, c) => {
        const amt = c?.amount ?? 0;
        return s + (c?.type === "one-time" ? amt : amt * 12);
    }, 0) ?? 0;

    const createMutation = useMutation({
        mutationFn: async (data: FormValues) => {
            const res = await api.post("/fees/structure", {
                class: data.class,
                components: data.components,
            });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["fee-structures"] });
            toast.success("Fee structure created");
            setModalOpen(false);
            form.reset();
        },
        onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed to create"),
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: FormValues }) => {
            const res = await api.put(`/fees/structure/${id}`, {
                class: data.class,
                components: data.components,
            });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["fee-structures"] });
            toast.success("Fee structure updated");
            setModalOpen(false);
            setEditingId(null);
            form.reset();
        },
        onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed to update"),
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/fees/structure/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["fee-structures"] });
            toast.success("Fee structure deleted");
        },
        onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed to delete"),
    });

    const openCreate = () => {
        setEditingId(null);
        form.reset({ class: "", components: [{ name: "Tuition Fee", amount: 0, type: "monthly" }] });
        setModalOpen(true);
    };

    const openEdit = (s: any) => {
        setEditingId(s._id);
        const comps = (s.components && s.components.length)
            ? s.components.map((c: any) => ({ name: c.name, amount: c.amount || 0, type: c.type || "monthly" }))
            : (s.fees || []).map((f: any) => ({ name: f.title || f.name, amount: f.amount || 0, type: f.type === "one-time" ? "one-time" : "monthly" }));
        if (!comps.length) comps.push({ name: "Tuition Fee", amount: 0, type: "monthly" });
        form.reset({ class: s.class, components: comps });
        setModalOpen(true);
    };

    const onSubmit = (data: FormValues) => {
        if (editingId) updateMutation.mutate({ id: editingId, data });
        else createMutation.mutate(data);
    };

    const handleStructurePdf = async (id: string, action: "preview" | "download" | "print") => {
        setPdfAction({ id, action });
        try {
            const res = await api.get(`/fees/structure/print/${id}${action === "preview" ? "?preview=1" : ""}`, {
                responseType: "blob",
            });
            const blob = res.data as Blob;
            const blobUrl = URL.createObjectURL(blob);
            if (action === "preview") {
                window.open(blobUrl, "_blank", "noopener");
                setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
            } else if (action === "download") {
                const a = document.createElement("a");
                a.href = blobUrl;
                a.download = `fee-structure-${id}.pdf`;
                a.click();
                URL.revokeObjectURL(blobUrl);
            } else {
                const w = window.open(blobUrl, "_blank", "noopener");
                if (w) setTimeout(() => { w.print(); URL.revokeObjectURL(blobUrl); }, 800);
                else URL.revokeObjectURL(blobUrl);
            }
        } catch (e) {
            toast.error("Failed to load PDF");
        } finally {
            setPdfAction(null);
        }
    };

    const classOptions = Array.isArray(classes) ? classes : [];
    const classNameList = [...new Set(classOptions.map((c: any) => c.className || c.class).filter(Boolean))];

    return (
        <LockedFeatureGate featureKey="fees" featureLabel="Fee structure">
        <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">Fee Structure</h2>
                    <p className="mt-1 text-sm text-gray-500">Define class-wise annual fee components.</p>
                </div>
                <Button className="gap-2 bg-indigo-600 hover:bg-indigo-500" onClick={openCreate}>
                    <Plus className="h-4 w-4" /> Add Structure
                </Button>
            </div>

            <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                        <Layers className="h-5 w-5 text-indigo-600" /> Class-wise structures
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex h-48 items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                        </div>
                    ) : structures.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">No fee structures. Add one for a class.</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50">
                                    <TableHead className="text-xs font-medium uppercase text-gray-500">Class</TableHead>
                                    <TableHead className="text-xs font-medium uppercase text-gray-500">Components</TableHead>
                                    <TableHead className="text-xs font-medium uppercase text-gray-500">Total (₹)</TableHead>
                                    <TableHead className="text-right text-xs font-medium uppercase text-gray-500">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {structures.map((s: any) => {
                                    const comps = s.components?.length ? s.components : s.fees || [];
                                    const total = s.totalAmount ?? s.totalAnnualFee ?? 0;
                                    return (
                                        <TableRow key={s._id} className="border-gray-100">
                                            <TableCell className="font-medium">{s.class}</TableCell>
                                            <TableCell className="text-sm text-gray-600">
                                                {comps.map((c: any) => {
                                                    const label = c.name || c.title;
                                                    const typeLabel = c.type === "one-time" ? " (One-time)" : " (Monthly)";
                                                    return `${label}${typeLabel}`;
                                                }).join(", ") || "—"}
                                            </TableCell>
                                            <TableCell className="font-semibold">{formatCurrency(total)}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" className="h-8 w-8" title="Preview" onClick={() => handleStructurePdf(s._id, "preview")} disabled={pdfAction?.id === s._id}>
                                                    {pdfAction?.id === s._id && pdfAction?.action === "preview" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8" title="Download" onClick={() => handleStructurePdf(s._id, "download")} disabled={pdfAction?.id === s._id}>
                                                    {pdfAction?.id === s._id && pdfAction?.action === "download" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8" title="Print" onClick={() => handleStructurePdf(s._id, "print")} disabled={pdfAction?.id === s._id}>
                                                    {pdfAction?.id === s._id && pdfAction?.action === "print" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => deleteMutation.mutate(s._id)}>
                                                    <Trash2 className="h-4 w-4" />
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

            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingId ? "Edit" : "Create"} Fee Structure</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <Label>Class</Label>
                            {classNameList.length > 0 ? (
                                <select
                                    className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                                    {...form.register("class")}
                                >
                                    <option value="">Select class</option>
                                    {classNameList.map((c: string) => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            ) : (
                                <Input
                                    className="mt-1"
                                    placeholder="e.g. 8th A"
                                    {...form.register("class")}
                                />
                            )}
                            {form.formState.errors.class && (
                                <p className="mt-1 text-xs text-red-600">{form.formState.errors.class.message}</p>
                            )}
                        </div>
                        <div>
                            <div className="flex items-center justify-between">
                                <Label>Fee components</Label>
                                <Button type="button" variant="outline" size="sm" className="h-8" onClick={() => append({ name: "", amount: 0, type: "monthly" })}>
                                    <Plus className="mr-1 h-3 w-3" /> Add row
                                </Button>
                            </div>
                            <div className="mt-2 space-y-2">
                                {fields.map((field, i) => (
                                    <div key={field.id} className="flex flex-wrap items-center gap-2">
                                        <Input placeholder="e.g. Tuition Fee" className="min-w-[120px] flex-1" {...form.register(`components.${i}.name`)} />
                                        <select
                                            className="h-10 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                                            {...form.register(`components.${i}.type`)}
                                        >
                                            <option value="monthly">Monthly</option>
                                            <option value="one-time">One-time</option>
                                        </select>
                                        <Input type="number" placeholder="0" className="w-28" {...form.register(`components.${i}.amount`, { valueAsNumber: true })} />
                                        <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => remove(i)}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <p className="mt-2 text-sm font-medium text-gray-700">Total (annual): {formatCurrency(totalAmount)} <span className="text-gray-500 font-normal">— monthly × 12, one-time as-is</span></p>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
                            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500" disabled={createMutation.isPending || updateMutation.isPending}>
                                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingId ? "Update" : "Create"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
        </LockedFeatureGate>
    );
}
