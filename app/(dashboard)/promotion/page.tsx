"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    ArrowRight,
    Users,
    Loader2,
    CheckCircle2,
    AlertTriangle,
    GraduationCap,
    ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LockedFeatureGate } from "@/components/plan/locked-feature-gate";
import api from "@/lib/api";

const CLASS_OPTIONS = [
    "Nursery", "LKG", "UKG",
    "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12",
    "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII",
];

export default function PromotionPage() {
    const queryClient = useQueryClient();
    const [fromClass, setFromClass] = useState("");
    const [toClass, setToClass] = useState("");
    const [selectedSession, setSelectedSession] = useState("");
    const [promoted, setPromoted] = useState(false);

    const { data: sessions } = useQuery({
        queryKey: ["sessions-list"],
        queryFn: async () => {
            const res = await api.get("/sessions");
            return res.data.data ?? [];
        },
    });

    const { data: classes } = useQuery({
        queryKey: ["classes-list"],
        queryFn: async () => {
            const res = await api.get("/classes");
            return res.data.data ?? [];
        },
    });

    const uniqueClasses = classes
        ? [...new Set((classes as any[]).map((c: any) => c.className))].sort()
        : [];

    const { data: previewStudents, isLoading: previewLoading, refetch: refetchPreview } = useQuery({
        queryKey: ["promotion-preview", fromClass],
        queryFn: async () => {
            const res = await api.get(`/students/promote/preview?fromClass=${fromClass}`);
            return res.data.data ?? [];
        },
        enabled: !!fromClass,
    });

    const promoteMutation = useMutation({
        mutationFn: async () => {
            const res = await api.post("/students/promote", {
                fromClass,
                toClass,
                newSessionId: selectedSession,
            });
            return res.data;
        },
        onSuccess: (data: any) => {
            toast.success(data.message || `${data.data?.promoted ?? 0} students promoted!`);
            setPromoted(true);
            queryClient.invalidateQueries({ queryKey: ["students"] });
            queryClient.invalidateQueries({ queryKey: ["class-students"] });
            queryClient.invalidateQueries({ queryKey: ["promotion-preview"] });
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message ?? "Promotion failed");
        },
    });

    const activeSessions = Array.isArray(sessions) ? sessions.filter((s: any) => s.isActive) : [];
    const students = previewStudents ?? [];
    const canPromote = fromClass && toClass && selectedSession && fromClass !== toClass && students.length > 0;

    return (
        <LockedFeatureGate featureKey="students" featureLabel="Student Promotion">
            <div className="flex-1 space-y-4 sm:space-y-6">
                {/* Header */}
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                        <GraduationCap className="h-6 w-6 text-indigo-600" />
                        Student Promotion
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Promote students from one class to another for the new session.
                    </p>
                </div>

                {promoted ? (
                    <Card className="border-emerald-200 bg-emerald-50 p-8 sm:p-12 text-center rounded-2xl">
                        <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-emerald-800 mb-2">Promotion Complete!</h3>
                        <p className="text-sm text-emerald-600 mb-6">
                            All eligible students from Class {fromClass} have been promoted to Class {toClass}.
                        </p>
                        <Button
                            onClick={() => { setPromoted(false); setFromClass(""); setToClass(""); setSelectedSession(""); }}
                            className="bg-emerald-600 hover:bg-emerald-500"
                        >
                            Promote More Students
                        </Button>
                    </Card>
                ) : (
                    <>
                        {/* Configuration */}
                        <Card className="rounded-2xl border-gray-200 p-4 sm:p-6">
                            <div className="grid gap-4 sm:gap-6 sm:grid-cols-3">
                                {/* From Class */}
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        From Class
                                    </label>
                                    <select
                                        value={fromClass}
                                        onChange={(e) => { setFromClass(e.target.value); setPromoted(false); }}
                                        className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                                    >
                                        <option value="">Select class...</option>
                                        {uniqueClasses.map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Arrow */}
                                <div className="hidden sm:flex items-end justify-center pb-2">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
                                        <ArrowRight className="h-5 w-5 text-indigo-600" />
                                    </div>
                                </div>

                                {/* To Class */}
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        To Class
                                    </label>
                                    <select
                                        value={toClass}
                                        onChange={(e) => setToClass(e.target.value)}
                                        className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                                    >
                                        <option value="">Select class...</option>
                                        {uniqueClasses.filter(c => c !== fromClass).map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Session Selector */}
                            <div className="mt-4 sm:mt-6 space-y-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Target Session
                                </label>
                                <select
                                    value={selectedSession}
                                    onChange={(e) => setSelectedSession(e.target.value)}
                                    className="h-11 w-full sm:max-w-sm rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                                >
                                    <option value="">Select session...</option>
                                    {activeSessions.map((s: any) => (
                                        <option key={s._id} value={s._id}>
                                            {s.sessionYear} {s.isActive ? "(Active)" : ""}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </Card>

                        {/* Preview */}
                        {fromClass && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <Users className="h-4 w-4 text-gray-400" />
                                        Students in Class {fromClass}
                                        <Badge variant="outline" className="text-xs ml-1">{students.length}</Badge>
                                    </h3>
                                </div>

                                {previewLoading ? (
                                    <div className="flex h-32 items-center justify-center">
                                        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                                    </div>
                                ) : students.length === 0 ? (
                                    <Card className="p-8 text-center rounded-2xl">
                                        <AlertTriangle className="h-10 w-10 text-amber-400 mx-auto mb-2" />
                                        <p className="text-sm text-gray-500">No active students found in Class {fromClass}.</p>
                                    </Card>
                                ) : (
                                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                        {students.map((s: any) => (
                                            <Card key={s._id} className="p-3 border-gray-200">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-9 w-9 shrink-0">
                                                        <AvatarFallback className="bg-indigo-50 text-indigo-600 text-xs font-bold">
                                                            {s.firstName?.[0]}{s.lastName?.[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                            {s.firstName} {s.lastName}
                                                        </p>
                                                        <p className="text-[11px] text-gray-500">
                                                            {s.admissionNumber} · Sec {s.section}
                                                        </p>
                                                    </div>
                                                    {toClass && (
                                                        <Badge className="bg-indigo-50 text-indigo-600 text-[10px] shrink-0">
                                                            <ArrowUpRight className="h-3 w-3 mr-0.5" /> {toClass}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Promote Button */}
                        {canPromote && !promoted && (
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-amber-800">
                                        Ready to promote {students.length} students
                                    </p>
                                    <p className="text-xs text-amber-600 mt-0.5">
                                        Class {fromClass} → Class {toClass}. This action cannot be undone.
                                    </p>
                                </div>
                                <Button
                                    className="bg-indigo-600 hover:bg-indigo-500 gap-2 font-semibold"
                                    disabled={promoteMutation.isPending}
                                    onClick={() => {
                                        if (confirm(`Promote ${students.length} students from Class ${fromClass} to Class ${toClass}? This cannot be undone.`)) {
                                            promoteMutation.mutate();
                                        }
                                    }}
                                >
                                    {promoteMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <ArrowUpRight className="h-4 w-4" />
                                    )}
                                    Promote All
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </LockedFeatureGate>
    );
}
