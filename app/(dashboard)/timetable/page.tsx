"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    CalendarDays,
    Loader2,
    Download,
    Printer,
    Eye,
    Save,
    Settings,
    ChevronDown,
    LayoutGrid,
    Trash2,
} from "lucide-react";
import { LockedFeatureGate } from "@/components/plan/locked-feature-gate";
import api from "@/lib/api";
import { toast } from "sonner";
import { buildScheduleColumnDtos, normalizeTimetableBreaks } from "@/lib/timetableSchedule";

// ── Day helpers ─────────────────────────────────────────────────────────────
const DAY_LABELS: Record<string, string> = {
    Mon: "Monday",
    Tue: "Tuesday",
    Wed: "Wednesday",
    Thu: "Thursday",
    Fri: "Friday",
    Sat: "Saturday",
    Sun: "Sunday",
};
const DAY_TO_NUM: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
};
const NUM_TO_SHORT: Record<number, string> = {
    0: "Sun", 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat",
};

type SlotValue = { subject: string; teacherId: string };

// ─────────────────────────────────────────────────────────────────────────────
export default function TimetablePage() {
    const queryClient = useQueryClient();
    const [pdfAction, setPdfAction] = useState<"preview" | "download" | "print" | null>(null);
    const [showLegacyGrid, setShowLegacyGrid] = useState(false);

    // Class selector
    const [selectedClass, setSelectedClass] = useState<{ className: string; section: string } | null>(null);

    // Active day tab (short name, e.g. "Mon")
    const [activeDay, setActiveDay] = useState<string>("");

    // Per-slot edit state: key = colIdx
    const [slots, setSlots] = useState<Record<number, SlotValue>>({});

    // ── Queries ────────────────────────────────────────────────────────────
    const { data: settingsData } = useQuery({
        queryKey: ["timetable-settings"],
        queryFn: async () => {
            const res = await api.get("/timetable/settings");
            return res.data.data;
        },
    });

    const { data: classes = [] } = useQuery({
        queryKey: ["classes-list"],
        queryFn: async () => {
            const res = await api.get("/classes");
            const list = res.data.data ?? res.data ?? [];
            return Array.isArray(list) ? list : [];
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

    // Working days from settings
    const workingDays: string[] = useMemo(
        () =>
            Array.isArray(settingsData?.workingDays) && settingsData.workingDays.length > 0
                ? settingsData.workingDays
                : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        [settingsData]
    );

    // Set default active day when workingDays loads
    useEffect(() => {
        if (workingDays.length > 0 && !activeDay) {
            setActiveDay(workingDays[0]);
        }
    }, [workingDays, activeDay]);

    // Set default selected class
    useEffect(() => {
        if (classes.length > 0 && !selectedClass) {
            const first = classes[0] as any;
            setSelectedClass({ className: first.className, section: first.section || "A" });
        }
    }, [classes, selectedClass]);

    // Subjects autocomplete list
    const subjects: string[] = useMemo(
        () =>
            Array.isArray(settingsData?.subjects) && settingsData.subjects.length > 0
                ? settingsData.subjects
                : ["English", "Math", "Science", "Hindi", "SST", "Computer", "Art"],
        [settingsData]
    );

    // Effective settings for selected class (class override or global)
    const effectiveSettings = useMemo(() => {
        if (!settingsData || !selectedClass) return settingsData;
        const override = (settingsData?.classSettings || []).find(
            (cs: any) =>
                String(cs.className).trim() === selectedClass.className &&
                String(cs.section || "A").toUpperCase() === selectedClass.section.toUpperCase()
        );
        if (!override) return settingsData;
        return {
            ...settingsData,
            periodCount: override.periodCount,
            periodDurationMinutes: override.periodDurationMinutes,
            firstPeriodStart: override.firstPeriodStart,
            breaks: override.breaks,
        };
    }, [settingsData, selectedClass]);

    const periodColumns = useMemo(() => buildScheduleColumnDtos(effectiveSettings ?? null), [effectiveSettings]);

    // Day timetable query
    const activeDayNum = activeDay ? DAY_TO_NUM[activeDay] : -1;
    const { data: dayData, isLoading: dayLoading } = useQuery({
        queryKey: ["timetable-day", selectedClass?.className, selectedClass?.section, activeDayNum],
        queryFn: async () => {
            if (!selectedClass || activeDayNum < 0) return null;
            const res = await api.get("/timetable/day", {
                params: {
                    className: selectedClass.className,
                    section: selectedClass.section,
                    dayOfWeek: activeDayNum,
                },
            });
            return res.data.data;
        },
        enabled: !!selectedClass && activeDayNum >= 0,
    });

    // Populate slot state when dayData or columns change
    useEffect(() => {
        if (!dayData) return;
        const serverSlots: any[] = dayData.slots || [];
        const next: Record<number, SlotValue> = {};
        periodColumns.forEach((col, idx) => {
            if (col.kind === "break") return;
            const match = serverSlots.find(
                (s: any) => s.startTime === col.startTime && s.type === "period"
            );
            next[idx] = {
                subject: match?.subject || "",
                teacherId: match?.teacherId?._id || match?.teacherId || "",
            };
        });
        setSlots(next);
    }, [dayData, periodColumns]);

    const updateSlot = (colIdx: number, field: "subject" | "teacherId", value: string) => {
        setSlots((prev) => ({ ...prev, [colIdx]: { ...(prev[colIdx] || { subject: "", teacherId: "" }), [field]: value } }));
    };

    // ── Save day mutation ──────────────────────────────────────────────────
    const saveDayMutation = useMutation({
        mutationFn: async () => {
            if (!selectedClass) throw new Error("No class selected");
            const slotsPayload = periodColumns
                .map((col, idx) => {
                    if (col.kind === "break") {
                        const isLunch = /lunch/i.test(col.label);
                        return {
                            startTime: col.startTime || "",
                            endTime: col.endTime || "",
                            type: isLunch ? "lunch" : "break",
                            title: col.label,
                            subject: col.label,
                        };
                    }
                    const val = slots[idx] || { subject: "", teacherId: "" };
                    return {
                        startTime: col.startTime,
                        endTime: col.endTime,
                        type: "period",
                        subject: val.subject || undefined,
                        teacherId: val.teacherId || undefined,
                    };
                })
                .filter(Boolean);

            await api.post("/timetable/day", {
                className: selectedClass.className,
                section: selectedClass.section,
                dayOfWeek: activeDayNum,
                slots: slotsPayload,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["timetable-day", selectedClass?.className, selectedClass?.section, activeDayNum],
            });
            toast.success(`${activeDay} timetable saved for ${selectedClass?.className}-${selectedClass?.section}.`);
        },
        onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed to save"),
    });

    const clearDay = () => {
        const next: Record<number, SlotValue> = {};
        periodColumns.forEach((_, idx) => {
            next[idx] = { subject: "", teacherId: "" };
        });
        setSlots(next);
    };

    // ── Legacy grid PDF ────────────────────────────────────────────────────
    const { data: gridData } = useQuery({
        queryKey: ["timetable-grid"],
        queryFn: async () => {
            const res = await api.get("/timetable/grid");
            return res.data.data ?? res.data;
        },
        enabled: showLegacyGrid,
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
        } catch {
            toast.error("Failed to load PDF");
        } finally {
            setPdfAction(null);
        }
    };

    // ─────────────────────────────────────────────────────────────────────
    return (
        <LockedFeatureGate featureKey="timetable" featureLabel="Timetable">
            <div className="space-y-6">
                {/* ── Header ── */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Timetable</h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Select a class and day to view or edit the schedule.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                        <Link href="/timetable/settings">
                            <Button variant="outline" size="sm">
                                <Settings className="mr-1 h-4 w-4" /> Settings
                            </Button>
                        </Link>
                        <Button variant="outline" size="sm" onClick={() => setShowLegacyGrid((v) => !v)}>
                            <LayoutGrid className="mr-1 h-4 w-4" />
                            {showLegacyGrid ? "Hide Grid" : "Grid View"}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handlePdf("preview")} disabled={!!pdfAction}>
                            {pdfAction === "preview" ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Eye className="mr-1 h-4 w-4" />}
                            Preview PDF
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

                {/* ── Class + Day Selector ── */}
                <div className="flex flex-wrap items-center gap-4">
                    {/* Class Dropdown */}
                    <div className="relative">
                        <select
                            id="class-selector"
                            className="h-10 appearance-none rounded-lg border border-gray-200 bg-white pl-4 pr-10 text-sm font-medium text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            value={selectedClass ? `${selectedClass.className}||${selectedClass.section}` : ""}
                            onChange={(e) => {
                                const [cn, sec] = e.target.value.split("||");
                                setSelectedClass({ className: cn, section: sec });
                                setSlots({});
                            }}
                        >
                            {(classes as any[]).map((cls) => {
                                const sec = cls.section || "A";
                                return (
                                    <option key={`${cls.className}-${sec}`} value={`${cls.className}||${sec}`}>
                                        {cls.className} – {sec}
                                    </option>
                                );
                            })}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>

                    {/* Day Tabs */}
                    <div className="flex flex-wrap gap-1">
                        {workingDays.map((day) => (
                            <button
                                key={day}
                                onClick={() => {
                                    setActiveDay(day);
                                    setSlots({});
                                }}
                                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                                    activeDay === day
                                        ? "bg-indigo-600 text-white shadow-sm"
                                        : "border border-gray-200 bg-white text-gray-600 hover:border-indigo-300 hover:text-indigo-600"
                                }`}
                            >
                                {day}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Day Timetable Editor ── */}
                <Card className="border border-gray-200 bg-white">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <CalendarDays className="h-5 w-5 text-indigo-600" />
                                {selectedClass
                                    ? `${selectedClass.className}-${selectedClass.section} · ${DAY_LABELS[activeDay] || activeDay}`
                                    : "Select a class"}
                            </CardTitle>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={clearDay}
                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                >
                                    <Trash2 className="mr-1 h-4 w-4" /> Clear Day
                                </Button>
                                <Button
                                    size="sm"
                                    className="bg-indigo-600 hover:bg-indigo-500"
                                    onClick={() => saveDayMutation.mutate()}
                                    disabled={saveDayMutation.isPending || !selectedClass || activeDayNum < 0}
                                >
                                    {saveDayMutation.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
                                    Save {activeDay}
                                </Button>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            {effectiveSettings
                                ? `Start: ${effectiveSettings.firstPeriodStart} · ${effectiveSettings.periodCount} periods · ${effectiveSettings.periodDurationMinutes} min each`
                                : "No settings configured yet — go to Settings first."}
                        </p>
                    </CardHeader>
                    <CardContent className="p-4 overflow-x-auto">
                        {dayLoading ? (
                            <div className="flex h-32 items-center justify-center">
                                <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
                            </div>
                        ) : !selectedClass ? (
                            <p className="py-8 text-center text-gray-400">Select a class above to edit its timetable.</p>
                        ) : periodColumns.length === 0 ? (
                            <p className="py-8 text-center text-gray-400">
                                No settings configured yet.{" "}
                                <Link href="/timetable/settings" className="text-indigo-600 underline">
                                    Go to Settings
                                </Link>
                            </p>
                        ) : (
                            <table className="w-full border-collapse text-sm min-w-[40rem]">
                                <thead>
                                    <tr className="bg-gray-50">
                                        {periodColumns.map((col, hci) => (
                                            <th
                                                key={`h-${hci}`}
                                                className={`border border-gray-200 p-2 text-center font-semibold min-w-[7rem] ${
                                                    col.kind === "break" ? "bg-amber-50 text-amber-700" : ""
                                                }`}
                                            >
                                                <div>{col.kind === "break" ? col.label : col.label}</div>
                                                <div className="text-xs font-normal text-gray-400">
                                                    {col.kind === "break" ? `${col.durationMinutes}m` : col.time}
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        {periodColumns.map((col, colIdx) => {
                                            if (col.kind === "break") {
                                                return (
                                                    <td
                                                        key={`b-${colIdx}`}
                                                        className="border border-gray-200 bg-amber-50 text-center text-amber-700 text-xs p-2 align-middle"
                                                    >
                                                        {col.label}
                                                    </td>
                                                );
                                            }
                                            const val = slots[colIdx] ?? { subject: "", teacherId: "" };
                                            return (
                                                <td key={`p-${colIdx}`} className="border border-gray-200 p-1.5 align-top">
                                                    <div className="space-y-1.5">
                                                        <input
                                                            type="text"
                                                            list={`subj-list-${colIdx}`}
                                                            value={val.subject}
                                                            onChange={(e) => updateSlot(colIdx, "subject", e.target.value)}
                                                            placeholder="Subject"
                                                            className="w-full rounded-md border border-gray-200 px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-300 focus:outline-none"
                                                        />
                                                        <datalist id={`subj-list-${colIdx}`}>
                                                            {subjects.map((s) => (
                                                                <option key={s} value={s} />
                                                            ))}
                                                        </datalist>
                                                        <select
                                                            value={val.teacherId}
                                                            onChange={(e) => updateSlot(colIdx, "teacherId", e.target.value)}
                                                            className="w-full rounded-md border border-gray-200 px-2 py-1 text-xs bg-white focus:ring-1 focus:ring-indigo-300 focus:outline-none"
                                                        >
                                                            <option value="">– Teacher –</option>
                                                            {(teachers as any[]).map((t: any) => (
                                                                <option key={t._id} value={t._id}>
                                                                    {t.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                </tbody>
                            </table>
                        )}
                    </CardContent>
                </Card>

                {/* ── Legacy Grid (collapsible, read-only, for PDF reference) ── */}
                {showLegacyGrid && (
                    <Card className="border border-gray-200 bg-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base text-gray-700 flex items-center gap-2">
                                <LayoutGrid className="h-4 w-4" />
                                All-Classes Grid View (read-only · same schedule shown for all days)
                            </CardTitle>
                            <p className="text-xs text-gray-400">
                                This is the legacy grid used for PDF export. Use the editor above to set day-specific schedules.
                            </p>
                        </CardHeader>
                        <CardContent className="overflow-x-auto p-4">
                            {!gridData ? (
                                <div className="flex h-16 items-center justify-center">
                                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                                </div>
                            ) : (gridData?.rows || []).length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-4">No grid data.</p>
                            ) : (
                                <table className="w-full border-collapse text-xs min-w-[40rem]">
                                    <thead>
                                        <tr className="bg-gray-100">
                                            <th className="border border-gray-200 p-2 text-left font-semibold w-24 sticky left-0 bg-gray-100">
                                                Class
                                            </th>
                                            {(gridData?.scheduleColumns || []).map((p: any, hci: number) => (
                                                <th
                                                    key={`gh-${hci}`}
                                                    className={`border border-gray-200 p-2 text-center font-semibold min-w-[5rem] ${
                                                        p.kind === "break" ? "bg-amber-100" : ""
                                                    }`}
                                                >
                                                    <div>{p.kind === "break" ? p.shortLabel ?? p.label : p.label}</div>
                                                    <div className="text-[10px] font-normal text-gray-400">{p.time}</div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(gridData?.rows || []).map((row: any, rowIdx: number) => (
                                            <tr key={`gr-${rowIdx}`} className="hover:bg-gray-50/50">
                                                <td className="border border-gray-200 p-2 font-medium sticky left-0 bg-white">
                                                    {row.className} – {row.section ?? "A"}
                                                </td>
                                                {(gridData?.scheduleColumns || []).map((p: any, colIdx: number) => {
                                                    if (p.kind === "break") {
                                                        return (
                                                            <td
                                                                key={`gb-${colIdx}`}
                                                                className="border border-gray-200 p-1 bg-amber-50 text-center text-amber-700"
                                                            >
                                                                {p.shortLabel ?? p.label}
                                                            </td>
                                                        );
                                                    }
                                                    const cell = row.cells?.[colIdx];
                                                    return (
                                                        <td key={`gp-${colIdx}`} className="border border-gray-200 p-1">
                                                            <p className="font-medium text-gray-700">{cell?.subject || "—"}</p>
                                                            {cell?.teacherName && (
                                                                <p className="text-[10px] text-gray-400">{cell.teacherName}</p>
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
                )}
            </div>
        </LockedFeatureGate>
    );
}
