"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Loader2, Download, Printer, Eye, Save, Settings } from "lucide-react";
import { LockedFeatureGate } from "@/components/plan/locked-feature-gate";
import api from "@/lib/api";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { UserRole } from "@/types";

function parseTime(s: string): number {
    const [h, m] = (s || "08:00").split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
}
function formatTime(mins: number): string {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default function TimetablePage() {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const isTeacher = user?.role === UserRole.TEACHER;
    const canEdit = !isTeacher || (user?.permissions ?? []).includes("edit_timetable");
    const [pdfAction, setPdfAction] = useState<"preview" | "download" | "print" | null>(null);

    const { data: gridData, isLoading } = useQuery({
        queryKey: ["timetable-grid"],
        queryFn: async () => {
            const res = await api.get("/timetable/grid");
            return res.data.data ?? res.data;
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

    const settings = gridData?.settings;
    const periodCount = settings?.periodCount ?? 7;
    const lunchAfterPeriod = settings?.lunchAfterPeriod ?? 4;
    const firstPeriodStart = settings?.firstPeriodStart || "08:00";
    const periodDuration = settings?.periodDurationMinutes ?? 40;
    const lunchBreakDuration = settings?.lunchBreakDuration ?? 40;
    const subjects: string[] = Array.isArray(settings?.subjects) ? settings.subjects : ["English", "Math", "Science", "Hindi", "SST", "Computer", "Art"];

    const periodColumns = useMemo(() => {
        const out: { label: string; time: string; isLunch: boolean }[] = [];
        let mins = parseTime(firstPeriodStart);
        for (let i = 1; i <= periodCount; i++) {
            if (i === lunchAfterPeriod + 1) {
                out.push({ label: "LUNCH", time: `${formatTime(mins)} (${lunchBreakDuration} min)`, isLunch: true });
                mins += lunchBreakDuration;
            }
            const start = formatTime(mins);
            mins += periodDuration;
            const end = formatTime(mins);
            out.push({ label: `P${i}`, time: `${start} – ${end}`, isLunch: false });
        }
        if (lunchAfterPeriod === 0) {
            const start = firstPeriodStart;
            out.unshift({ label: "LUNCH", time: `${start} (${lunchBreakDuration} min)`, isLunch: true });
        }
        return out;
    }, [periodCount, lunchAfterPeriod, firstPeriodStart, periodDuration, lunchBreakDuration]);

    const rows = gridData?.rows ?? [];
    const totalCols = periodCount + 1;

    const [grid, setGrid] = useState<Record<string, { subject: string; teacherId: string }>>({});

    useEffect(() => {
        if (!gridData?.rows?.length) return;
        const next: Record<string, { subject: string; teacherId: string }> = {};
        gridData.rows.forEach((row: any, ri: number) => {
            (row.cells || []).forEach((cell: any, ci: number) => {
                next[`${ri}-${ci}`] = {
                    subject: cell.subject || "",
                    teacherId: cell.teacherId?._id || cell.teacherId || "",
                };
            });
        });
        setGrid(next);
    }, [gridData]);

    const saveGridMutation = useMutation({
        mutationFn: async () => {
            const payload = rows.map((row: any, ri: number) => ({
                className: row.className,
                section: row.section,
                cells: Array.from({ length: totalCols }, (_, ci) => {
                    const key = `${ri}-${ci}`;
                    const g = grid[key] || {};
                    return { subject: g.subject || undefined, teacherId: g.teacherId || undefined };
                }),
            }));
            await api.post("/timetable/grid", { rows: payload });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["timetable-grid"] });
            toast.success("Timetable saved.");
        },
        onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed to save"),
    });

    const handlePdf = async (action: "preview" | "download" | "print") => {
        setPdfAction(action);
        try {
            const res = await api.get(
                `/timetable/print${action === "preview" ? "?preview=1" : ""}`,
                { responseType: "blob" }
            );
            const blob = res.data as Blob;
            const url = URL.createObjectURL(blob);
            if (action === "preview") {
                window.open(url, "_blank");
                setTimeout(() => URL.revokeObjectURL(url), 30000);
            } else if (action === "download") {
                const a = document.createElement("a");
                a.href = url;
                a.download = "timetable.pdf";
                a.click();
                URL.revokeObjectURL(url);
            } else {
                const w = window.open(url, "_blank");
                if (w) setTimeout(() => { w.print(); URL.revokeObjectURL(url); }, 800);
                else URL.revokeObjectURL(url);
            }
        } catch (e) {
            console.error(e);
            toast.error("Failed to load PDF");
        } finally {
            setPdfAction(null);
        }
    };

    const updateCell = (rowIdx: number, colIdx: number, field: "subject" | "teacherId", value: string) => {
        const key = `${rowIdx}-${colIdx}`;
        setGrid((prev) => ({ ...prev, [key]: { ...(prev[key] || {}), [field]: value } }));
    };

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <LockedFeatureGate featureKey="timetable" featureLabel="Timetable">
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">Timetable</h2>
                    <p className="mt-1 text-sm text-gray-500">
                        One schedule for all classes, Monday–Saturday. Vertical = classes, horizontal = periods.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                    {!canEdit && (
                        <span className="text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200 rounded-lg px-3 py-1.5">
                            View only — ask your admin for edit access
                        </span>
                    )}
                    {canEdit && (
                        <Link href="/timetable/settings">
                            <Button variant="outline" size="sm">
                                <Settings className="mr-1 h-4 w-4" /> Settings
                            </Button>
                        </Link>
                    )}
                    {canEdit && (
                        <Button
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-500"
                            onClick={() => saveGridMutation.mutate()}
                            disabled={saveGridMutation.isPending}
                        >
                            {saveGridMutation.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
                            Save Timetable
                        </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => handlePdf("preview")} disabled={!!pdfAction}>
                        {pdfAction === "preview" ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Eye className="mr-1 h-4 w-4" />}
                        Preview
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handlePdf("download")} disabled={!!pdfAction}>
                        {pdfAction === "download" ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Download className="mr-1 h-4 w-4" />}
                        Download PDF
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handlePdf("print")} disabled={!!pdfAction}>
                        {pdfAction === "print" ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Printer className="mr-1 h-4 w-4" />}
                        Print
                    </Button>
                </div>
            </div>

            <Card className="border border-gray-200 bg-white">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <CalendarDays className="h-5 w-5 text-indigo-600" /> Schedule (Mon–Sat same)
                    </CardTitle>
                    <p className="text-sm text-gray-500">
                        First period: {firstPeriodStart} · Period: {periodDuration} min · Lunch: {lunchBreakDuration} min
                    </p>
                </CardHeader>
                <CardContent className="p-4 overflow-x-auto">
                    {rows.length === 0 ? (
                        <p className="py-8 text-center text-gray-500">No classes found. Add classes in Classes first, then save settings in Timetable Settings.</p>
                    ) : (
                        <table className="w-full border-collapse text-sm min-w-[800px]">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border border-gray-200 p-2 text-left font-semibold w-24 sticky left-0 bg-gray-100 z-10">Class</th>
                                    {periodColumns.map((p) => (
                                        <th
                                            key={p.label}
                                            className={`border border-gray-200 p-2 text-center font-semibold min-w-[100px] ${p.isLunch ? "bg-amber-100" : ""}`}
                                        >
                                            <div>{p.label}</div>
                                            <div className="text-xs font-normal text-gray-500">{p.time}</div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row: any, rowIdx: number) => (
                                    <tr key={`${row.className}-${row.section ?? rowIdx}`} className="hover:bg-gray-50/50">
                                        <td className="border border-gray-200 p-2 font-medium sticky left-0 bg-white z-10">
                                            {row.className}{row.section ? ` – ${row.section}` : ""}
                                        </td>
                                        {periodColumns.map((p, colIdx) => {
                                            if (p.isLunch) {
                                                return (
                                                    <td key={p.label} className="border border-gray-200 p-1 bg-amber-50 text-center text-amber-800 text-xs">
                                                        LUNCH
                                                    </td>
                                                );
                                            }
                                            const key = `${rowIdx}-${colIdx}`;
                                            const val = grid[key] ?? { subject: row.cells?.[colIdx]?.subject ?? "", teacherId: row.cells?.[colIdx]?.teacherId?._id ?? row.cells?.[colIdx]?.teacherId ?? "" };
                                            const assignedTeacher = (teachers as any[]).find((t: any) => t._id === val.teacherId);
                                            return (
                                                <td key={p.label} className="border border-gray-200 p-1 align-top">
                                                    {canEdit ? (
                                                        <div className="space-y-1">
                                                            <input
                                                                type="text"
                                                                list={`subjects-${colIdx}`}
                                                                value={val.subject}
                                                                onChange={(e) => updateCell(rowIdx, colIdx, "subject", e.target.value)}
                                                                placeholder="Subject"
                                                                className="w-full rounded border border-gray-200 px-2 py-1 text-xs"
                                                            />
                                                            <datalist id={`subjects-${colIdx}`}>
                                                                {subjects.map((s) => (
                                                                    <option key={s} value={s} />
                                                                ))}
                                                            </datalist>
                                                            <select
                                                                value={val.teacherId}
                                                                onChange={(e) => updateCell(rowIdx, colIdx, "teacherId", e.target.value)}
                                                                className="w-full rounded border border-gray-200 px-2 py-1 text-xs bg-white"
                                                            >
                                                                <option value="">– Teacher –</option>
                                                                {(teachers as any[]).map((t: any) => (
                                                                    <option key={t._id} value={t._id}>{t.name}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    ) : (
                                                        <div className="p-1 space-y-0.5">
                                                            <p className="text-xs font-medium text-gray-800">{val.subject || <span className="text-gray-300">—</span>}</p>
                                                            {assignedTeacher && <p className="text-[10px] text-gray-500">{assignedTeacher.name}</p>}
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </CardContent>
            </Card>
        </div>
        </LockedFeatureGate>
    );
}
