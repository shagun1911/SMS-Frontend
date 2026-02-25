"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Headphones, Loader2, MessageSquare, ChevronDown, CheckCircle2, Clock, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import api from "@/lib/api";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

const STATUS_OPTIONS = [
    { value: "open", label: "Open", icon: Circle },
    { value: "in_progress", label: "In progress", icon: Clock },
    { value: "resolved", label: "Resolved", icon: CheckCircle2 },
];
const PRIORITY_STYLES: Record<string, string> = {
    low: "bg-gray-100 text-gray-700",
    medium: "bg-amber-100 text-amber-700",
    high: "bg-red-100 text-red-700",
};
const STATUS_STYLES: Record<string, string> = {
    open: "bg-sky-100 text-sky-700",
    in_progress: "bg-amber-100 text-amber-700",
    resolved: "bg-emerald-100 text-emerald-700",
};

export default function MasterSupportPage() {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [status, setStatus] = useState<string>("");
    const [resolution, setResolution] = useState("");
    const queryClient = useQueryClient();

    const { data: tickets, isLoading } = useQuery({
        queryKey: ["master-support"],
        queryFn: async () => {
            const res = await api.get("/master/support");
            return res.data?.data ?? [];
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, body }: { id: string; body: { status?: string; resolution?: string } }) => {
            const res = await api.patch(`/master/support/${id}`, body);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["master-support"] });
            toast.success("Ticket updated.");
            setSelectedId(null);
        },
        onError: () => toast.error("Failed to update ticket."),
    });

    const list = Array.isArray(tickets) ? tickets : [];
    const selected = list.find((t: any) => t._id === selectedId);

    const openDetail = (t: any) => {
        setSelectedId(t._id);
        setStatus(t.status ?? "open");
        setResolution(t.resolution ?? "");
    };

    const saveUpdate = () => {
        if (!selectedId) return;
        updateMutation.mutate({ id: selectedId, body: { status, resolution } });
    };

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
                <h1 className="text-2xl font-bold tracking-tight">Support tickets</h1>
                <p className="mt-1 text-sm text-muted-foreground">View and resolve tickets raised by schools.</p>
            </div>

            <Card className="overflow-hidden rounded-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/50 text-left font-medium text-muted-foreground">
                                <th className="p-4">School</th>
                                <th className="p-4">Subject</th>
                                <th className="p-4">Priority</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Created</th>
                                <th className="p-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {list.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                        No support tickets yet.
                                    </td>
                                </tr>
                            ) : (
                                list.map((t: any) => (
                                    <tr
                                        key={t._id}
                                        className="cursor-pointer border-b hover:bg-muted/30"
                                        onClick={() => openDetail(t)}
                                    >
                                        <td className="p-4">
                                            <div className="font-medium">{t.schoolName}</div>
                                            <div className="text-xs text-muted-foreground">{t.schoolCode ?? t.schoolId}</div>
                                        </td>
                                        <td className="p-4 max-w-[200px] truncate">{t.subject}</td>
                                        <td className="p-4">
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLES[t.priority] ?? PRIORITY_STYLES.medium}`}>
                                                {t.priority}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[t.status] ?? STATUS_STYLES.open}`}>
                                                {t.status ?? "open"}
                                            </span>
                                        </td>
                                        <td className="p-4 text-muted-foreground">
                                            {t.createdAt ? new Date(t.createdAt).toLocaleDateString(undefined, { dateStyle: "short" }) : "—"}
                                        </td>
                                        <td className="p-4 text-right">
                                            <Button variant="ghost" size="sm" className="gap-1" onClick={(e) => { e.stopPropagation(); openDetail(t); }}>
                                                View <ChevronDown className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Dialog open={!!selected} onOpenChange={(open) => !open && setSelectedId(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5" />
                            Ticket details
                        </DialogTitle>
                    </DialogHeader>
                    {selected && (
                        <>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <span className="font-medium text-muted-foreground">School</span>
                                    <p className="font-medium">{selected.schoolName}</p>
                                </div>
                                <div>
                                    <span className="font-medium text-muted-foreground">Subject</span>
                                    <p className="font-medium">{selected.subject}</p>
                                </div>
                                <div>
                                    <span className="font-medium text-muted-foreground">Message</span>
                                    <p className="mt-1 rounded-md border bg-muted/30 p-3 text-muted-foreground">{selected.message}</p>
                                </div>
                                <div>
                                    <label className="font-medium text-muted-foreground">Status</label>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                                    >
                                        {STATUS_OPTIONS.map((o) => (
                                            <option key={o.value} value={o.value}>{o.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="font-medium text-muted-foreground">Resolution note</label>
                                    <textarea
                                        value={resolution}
                                        onChange={(e) => setResolution(e.target.value)}
                                        placeholder="Add a resolution note for the school..."
                                        className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                                        rows={3}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setSelectedId(null)}>Close</Button>
                                <Button onClick={saveUpdate} disabled={updateMutation.isPending}>
                                    {updateMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : "Save changes"}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
