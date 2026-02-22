"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { toast } from "sonner";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

function parseTime(s: string): number {
    const [h, m] = (s || "08:00").split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
}
function formatTime(mins: number): string {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}:${String(m).padStart(2, "0")}`;
}

export default function CreateTimetablePage() {
    const queryClient = useQueryClient();
    const [classId, setClassId] = useState("");

    const { data: settings } = useQuery({
        queryKey: ["timetable-settings"],
        queryFn: async () => {
            const res = await api.get("/timetable/settings");
            return res.data.data;
        },
    });
    const { data: classes = [] } = useQuery({
        queryKey: ["classes"],
        queryFn: async () => {
            const res = await api.get("/classes");
            return res.data.data ?? res.data ?? [];
        },
    });
    const { data: teachers = [] } = useQuery({
        queryKey: ["users-teachers"],
        queryFn: async () => {
            const res = await api.get("/users");
            const list = res.data.data ?? res.data ?? [];
            return Array.isArray(list) ? list.filter((u: any) => u.role === "teacher") : [];
        },
    });

    const periodCount = settings?.periodCount ?? 7;
    const lunchAfterPeriod = settings?.lunchAfterPeriod ?? 4;
    const firstPeriodStart = settings?.firstPeriodStart || "08:00";
    const periodDuration = settings?.periodDurationMinutes ?? 40;
    const subjects: string[] = Array.isArray(settings?.subjects) ? settings.subjects : ["English", "Math", "Science", "Hindi", "SST", "Computer", "Art"];

    const periodSlots = useMemo(() => {
        const out: { label: string; startTime: string; endTime: string; isLunch: boolean }[] = [];
        let mins = parseTime(firstPeriodStart);
        const lunchDur = periodDuration;
        for (let i = 1; i <= periodCount; i++) {
            if (i === lunchAfterPeriod + 1) {
                out.push({ label: "LUNCH", startTime: formatTime(mins), endTime: formatTime(mins + lunchDur), isLunch: true });
                mins += lunchDur;
            }
            const start = formatTime(mins);
            mins += periodDuration;
            const end = formatTime(mins);
            out.push({ label: `P${i}`, startTime: start, endTime: end, isLunch: false });
        }
        if (lunchAfterPeriod === 0) out.unshift({ label: "LUNCH", startTime: firstPeriodStart, endTime: formatTime(parseTime(firstPeriodStart) + lunchDur), isLunch: true });
        return out;
    }, [periodCount, lunchAfterPeriod, firstPeriodStart, periodDuration]);

    const [grid, setGrid] = useState<Record<string, { subject: string; teacherId: string }>>({});

    const selectedClass = (classes as any[]).find((c: any) => c._id === classId);
    const section = selectedClass?.section ?? selectedClass?.sections?.[0] ?? "A";

    const { data: existingTimetable } = useQuery({
        queryKey: ["timetable-class", classId, section],
        queryFn: async () => {
            if (!classId) return null;
            const res = await api.get(`/timetable/class/${classId}?section=${section}`);
            return res.data.data;
        },
        enabled: !!classId,
    });

    useEffect(() => {
        if (!existingTimetable?.days || !periodSlots.length) return;
        const next: Record<string, { subject: string; teacherId: string }> = {};
        (existingTimetable.days || []).forEach((d: any) => {
            (d.slots || []).forEach((s: any) => {
                const key = `${d.dayOfWeek}-${s.startTime}`;
                next[key] = { subject: s.subject || "", teacherId: s.teacherId?._id || s.teacherId || "" };
            });
        });
        setGrid(next);
    }, [existingTimetable, periodSlots.length]);

    const createMutation = useMutation({
        mutationFn: async () => {
            const days = DAYS.map((_, dayIndex) => {
                const dayOfWeek = dayIndex + 1;
                const slots = periodSlots
                    .filter((p) => !p.isLunch)
                    .map((p) => {
                        const key = `${dayOfWeek}-${p.startTime}`;
                        const g = grid[key] || {};
                        return {
                            startTime: p.startTime,
                            endTime: p.endTime,
                            subject: g.subject || null,
                            teacherId: g.teacherId || null,
                            type: "period",
                        };
                    });
                return { dayOfWeek, slots };
            });
            await api.post("/timetable/create", { className: selectedClass?.className, section, days });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["timetable-class", classId, section] });
            queryClient.invalidateQueries({ queryKey: ["timetable"] });
            toast.success("Timetable saved.");
        },
        onError: (e: any) => {
            const msg = e.response?.data?.message ?? "Failed to save";
            const conflicts = e.response?.data?.conflicts;
            toast.error(conflicts?.length ? `${msg}: ${conflicts.join("; ")}` : msg);
        },
    });

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-gray-900">Create Timetable</h2>
                <p className="mt-1 text-sm text-gray-500">Select class (each class + section is one entry), then fill subject and teacher for each period.</p>
            </div>
            <Card className="border border-gray-200 bg-white shadow-sm">
                <CardHeader>
                    <CardTitle>Class & Section</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-4">
                            <div className="space-y-2">
                                <Label>Class & Section</Label>
                                <select
                                    value={classId}
                                    onChange={(e) => setClassId(e.target.value)}
                                    className="h-10 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm min-w-[180px]"
                                >
                                    <option value="">Select class</option>
                                    {(classes as any[]).map((c: any) => (
                                        <option key={c._id} value={c._id}>
                                            Class {c.className} – Section {c.section ?? c.sections?.[0] ?? "A"}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                </CardContent>
            </Card>

            {classId && (
                <Card className="border border-gray-200 bg-white overflow-x-auto shadow-sm">
                    <CardHeader>
                        <CardTitle>Grid – Class {selectedClass?.className} Section {section}</CardTitle>
                        <p className="text-sm text-gray-500">Select subject and teacher for each cell. Conflicts will be reported on save.</p>
                    </CardHeader>
                    <CardContent className="p-4">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-sm">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="border border-gray-200 p-2 text-left font-semibold w-24">Day</th>
                                        {periodSlots.map((p) => (
                                            <th key={p.label} className={`border border-gray-200 p-1 text-center font-semibold ${p.isLunch ? "bg-amber-100" : ""}`}>
                                                <div>{p.label}</div>
                                                <div className="text-xs font-normal text-gray-500">{p.startTime} – {p.endTime}</div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {DAYS.map((dayName, dayIndex) => {
                                        const dayOfWeek = dayIndex + 1;
                                        return (
                                            <tr key={dayOfWeek}>
                                                <td className="border border-gray-200 p-2 font-medium">{dayName}</td>
                                                {periodSlots.map((p) => {
                                                    if (p.isLunch) {
                                                        return (
                                                            <td key={p.label} className="border border-gray-200 p-1 bg-amber-50 text-center text-amber-700">
                                                                LUNCH
                                                            </td>
                                                        );
                                                    }
                                                    const key = `${dayOfWeek}-${p.startTime}`;
                                                    const val = grid[key] || { subject: "", teacherId: "" };
                                                    return (
                                                        <td key={p.label} className="border border-gray-200 p-1 align-top">
                                                            <div className="space-y-1">
                                                                <select
                                                                    value={val.subject}
                                                                    onChange={(e) => setGrid((g) => ({ ...g, [key]: { ...g[key], subject: e.target.value } }))}
                                                                    className="w-full rounded border border-gray-200 bg-white px-2 py-1 text-xs"
                                                                >
                                                                    <option value="">–</option>
                                                                    {subjects.map((s) => (
                                                                        <option key={s} value={s}>{s}</option>
                                                                    ))}
                                                                </select>
                                                                <select
                                                                    value={val.teacherId}
                                                                    onChange={(e) => setGrid((g) => ({ ...g, [key]: { ...g[key], teacherId: e.target.value } }))}
                                                                    className="w-full rounded border border-gray-200 bg-white px-2 py-1 text-xs"
                                                                >
                                                                    <option value="">–</option>
                                                                    {(teachers as any[]).map((t: any) => (
                                                                        <option key={t._id} value={t._id}>{t.name}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-4">
                            <Button
                                onClick={() => createMutation.mutate()}
                                disabled={createMutation.isPending}
                                className="bg-indigo-600 hover:bg-indigo-500"
                            >
                                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <Save className="mr-2 h-4 w-4" /> Save Timetable
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
