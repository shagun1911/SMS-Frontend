"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Megaphone, Loader2, Plus, Trash2, AlertCircle, Info, AlertTriangle } from "lucide-react";
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

const PRIORITY_LABELS: Record<string, string> = {
    info: "Info",
    warning: "Warning",
    critical: "Critical",
};
const PRIORITY_ICONS: Record<string, typeof Info> = {
    info: Info,
    warning: AlertTriangle,
    critical: AlertCircle,
};
const PRIORITY_STYLES: Record<string, string> = {
    info: "bg-sky-100 text-sky-700",
    warning: "bg-amber-100 text-amber-700",
    critical: "bg-red-100 text-red-700",
};

export default function MasterAnnouncementsPage() {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({
        title: "",
        message: "",
        priority: "info" as "info" | "warning" | "critical",
        expiresAt: "",
        isActive: true,
    });
    const queryClient = useQueryClient();

    const { data: list, isLoading } = useQuery({
        queryKey: ["master-announcements"],
        queryFn: async () => {
            const res = await api.get("/master/announcements");
            return res.data?.data ?? [];
        },
    });

    const createMutation = useMutation({
        mutationFn: async (body: any) => {
            const res = await api.post("/master/announcements", body);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["master-announcements"] });
            setOpen(false);
            setForm({ title: "", message: "", priority: "info", expiresAt: "", isActive: true });
            toast.success("Announcement created.");
        },
        onError: () => toast.error("Failed to create announcement."),
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/master/announcements/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["master-announcements"] });
            toast.success("Announcement deleted.");
        },
        onError: () => toast.error("Failed to delete."),
    });

    const submit = () => {
        createMutation.mutate({
            title: form.title.trim(),
            message: form.message.trim(),
            priority: form.priority,
            expiresAt: form.expiresAt || undefined,
            isActive: form.isActive,
        });
    };

    const announcements = Array.isArray(list) ? list : [];

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
                    <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Broadcast messages to all school dashboards.</p>
                </div>
                <Button className="w-fit gap-2" onClick={() => setOpen(true)}>
                    <Plus className="h-4 w-4" /> New announcement
                </Button>
            </div>

            <Card className="overflow-hidden rounded-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/50 text-left font-medium text-muted-foreground">
                                <th className="p-4">Priority</th>
                                <th className="p-4">Title</th>
                                <th className="p-4">Message</th>
                                <th className="p-4">Expires</th>
                                <th className="p-4">Active</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {announcements.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                        No announcements. Create one to show a banner on school dashboards.
                                    </td>
                                </tr>
                            ) : (
                                announcements.map((a: any) => {
                                    const Icon = PRIORITY_ICONS[a.priority] ?? Info;
                                    return (
                                        <tr key={a._id} className="border-b hover:bg-muted/30">
                                            <td className="p-4">
                                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${PRIORITY_STYLES[a.priority] ?? PRIORITY_STYLES.info}`}>
                                                    <Icon className="h-3.5 w-3.5" />
                                                    {PRIORITY_LABELS[a.priority] ?? "Info"}
                                                </span>
                                            </td>
                                            <td className="p-4 font-medium">{a.title}</td>
                                            <td className="p-4 max-w-xs truncate text-muted-foreground">{a.message}</td>
                                            <td className="p-4">
                                                {a.expiresAt ? new Date(a.expiresAt).toLocaleDateString(undefined, { dateStyle: "short" }) : "—"}
                                            </td>
                                            <td className="p-4">
                                                <span className={a.isActive ? "text-emerald-600" : "text-muted-foreground"}>
                                                    {a.isActive ? "Yes" : "No"}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => deleteMutation.mutate(a._id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>New announcement</DialogTitle>
                        <p className="text-sm text-muted-foreground">This will appear as a banner on all school dashboards.</p>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div>
                            <label className="text-sm font-medium">Title</label>
                            <Input
                                value={form.title}
                                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                                placeholder="e.g. Scheduled maintenance"
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Message</label>
                            <textarea
                                value={form.message}
                                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                                placeholder="Full message for school admins..."
                                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                                rows={3}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Priority</label>
                            <select
                                value={form.priority}
                                onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as "info" | "warning" | "critical" }))}
                                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                            >
                                <option value="info">Info</option>
                                <option value="warning">Warning</option>
                                <option value="critical">Critical</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Expiry date (optional)</label>
                            <Input
                                type="date"
                                value={form.expiresAt}
                                onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                                className="mt-1"
                            />
                        </div>
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={form.isActive}
                                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                                className="h-4 w-4 rounded border-input"
                            />
                            Active (show on dashboards)
                        </label>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button onClick={submit} disabled={!form.title.trim() || createMutation.isPending}>
                            {createMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</> : "Create"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
