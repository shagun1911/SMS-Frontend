"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Headphones, Loader2, Send, MessageSquare, Clock, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import api from "@/lib/api";

const PRIORITY_OPTIONS = [{ value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }];
const STATUS_STYLES: Record<string, string> = {
    open: "bg-sky-100 text-sky-700",
    in_progress: "bg-amber-100 text-amber-700",
    resolved: "bg-emerald-100 text-emerald-700",
};

export default function SupportPage() {
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
    const queryClient = useQueryClient();

    const { data: tickets, isLoading } = useQuery({
        queryKey: ["support-tickets"],
        queryFn: async () => {
            const res = await api.get("/support/tickets");
            return res.data?.data ?? [];
        },
    });

    const createMutation = useMutation({
        mutationFn: async (body: { subject: string; message: string; priority: string }) => {
            const res = await api.post("/support/tickets", body);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
            setSubject("");
            setMessage("");
            setPriority("medium");
            toast.success("Ticket submitted. We'll get back to you soon.");
        },
        onError: () => toast.error("Failed to submit ticket."),
    });

    const submit = () => {
        if (!subject.trim() || !message.trim()) {
            toast.error("Please enter subject and message.");
            return;
        }
        createMutation.mutate({ subject: subject.trim(), message: message.trim(), priority });
    };

    const list = Array.isArray(tickets) ? tickets : [];

    return (
        <div className="flex-1 space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Support</h1>
                <p className="mt-1 text-sm text-muted-foreground">Raise a ticket or view your ticket history.</p>
            </div>

            <Card className="rounded-2xl p-6">
                <h2 className="mb-4 flex items-center gap-2 font-semibold">
                    <Headphones className="h-5 w-5 text-primary" />
                    New ticket
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <label className="text-sm font-medium">Subject</label>
                        <Input
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Brief subject"
                            className="mt-1"
                        />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="text-sm font-medium">Message</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Describe your issue or question..."
                            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                            rows={4}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Priority</label>
                        <select
                            value={priority}
                            onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high")}
                            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                        >
                            {PRIORITY_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <Button
                    className="mt-4 gap-2"
                    onClick={submit}
                    disabled={!subject.trim() || !message.trim() || createMutation.isPending}
                >
                    {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Submit ticket
                </Button>
            </Card>

            <Card className="overflow-hidden rounded-2xl">
                <div className="border-b px-6 py-4">
                    <h2 className="flex items-center gap-2 font-semibold">
                        <MessageSquare className="h-5 w-5" />
                        Your tickets
                    </h2>
                </div>
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : list.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        No tickets yet. Submit one above if you need help.
                    </div>
                ) : (
                    <div className="divide-y">
                        {list.map((t: any) => (
                            <div key={t._id} className="px-6 py-4">
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div>
                                        <p className="font-medium">{t.subject}</p>
                                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{t.message}</p>
                                        <p className="mt-2 text-xs text-muted-foreground">
                                            {t.createdAt ? new Date(t.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : ""}
                                        </p>
                                    </div>
                                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[t.status] ?? STATUS_STYLES.open}`}>
                                        {t.status === "in_progress" ? "In progress" : t.status ?? "Open"}
                                    </span>
                                </div>
                                {t.resolution && (
                                    <div className="mt-3 rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
                                        <span className="font-medium text-foreground">Resolution: </span>
                                        {t.resolution}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
}
