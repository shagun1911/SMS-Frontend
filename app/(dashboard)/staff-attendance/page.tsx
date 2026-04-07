"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardCheck, Loader2, Save, Search } from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatStaffRoleLabel } from "@/lib/utils";
import {
    effectiveStaffAttendanceMark,
    formatYmdLocal,
    staffAttendanceMarkForSave
} from "@/lib/staffAttendance";
import { toast } from "sonner";
import { LockedFeatureGate } from "@/components/plan/locked-feature-gate";
import { UserRole } from "@/types";

/** Roles that appear in staff attendance (aligned with API; no admin / drivers / conductors). */
const ATTENDANCE_ROLE_TABS = [
    { label: "All", value: "all" as const },
    { label: "Teacher", value: UserRole.TEACHER },
    { label: "Transport Manager", value: UserRole.TRANSPORT_MANAGER },
    { label: "Accountant", value: UserRole.ACCOUNTANT },
    { label: "Cleaning Staff", value: UserRole.CLEANING_STAFF },
    { label: "Other", value: UserRole.STAFF_OTHER },
] as const;

type EligibleStaff = {
    _id: string;
    name: string;
    role: string;
    staffRoleTitle?: string;
    /** Absent days recorded on or after joining date (or account created), through today. */
    totalAbsences?: number;
};

type Mark = "PRESENT" | "ABSENT";

export default function StaffAttendancePage() {
    const queryClient = useQueryClient();
    const todayYmd = useMemo(() => formatYmdLocal(new Date()), []);
    const [date, setDate] = useState(todayYmd);
    const [marks, setMarks] = useState<Record<string, Mark>>({});
    const [selectedRole, setSelectedRole] = useState<(typeof ATTENDANCE_ROLE_TABS)[number]["value"]>("all");
    const [searchTerm, setSearchTerm] = useState("");

    const {
        data: eligible = [],
        isLoading: loadingStaff,
        isError: staffError
    } = useQuery({
        queryKey: ["staff-attendance-eligible"],
        queryFn: async () => {
            const res = await api.get<{ success: boolean; data: EligibleStaff[] }>(
                "/staff-attendance/eligible"
            );
            return res.data.data;
        }
    });

    const { data: dayData, isLoading: loadingDay } = useQuery({
        queryKey: ["staff-attendance-day", date],
        queryFn: async () => {
            const res = await api.get<{
                success: boolean;
                data: { absentStaffIds: string[]; presentStaffIds?: string[] };
            }>("/staff-attendance/day", { params: { date } });
            return res.data.data;
        },
        enabled: !!date,
    });

    const eligibleIdsKey = useMemo(() => eligible.map((s) => s._id).sort().join(","), [eligible]);
    const absentKey = useMemo(
        () => (dayData?.absentStaffIds ? [...dayData.absentStaffIds].sort().join(",") : ""),
        [dayData]
    );
    const presentKey = useMemo(
        () => (dayData?.presentStaffIds ? [...dayData.presentStaffIds].sort().join(",") : ""),
        [dayData]
    );

    useEffect(() => {
        if (!eligible.length || dayData == null) return;
        const absent = new Set(dayData.absentStaffIds);
        const present = new Set(dayData.presentStaffIds ?? []);
        const next: Record<string, Mark> = {};
        for (const s of eligible) {
            if (absent.has(s._id)) next[s._id] = "ABSENT";
            else if (present.has(s._id)) next[s._id] = "PRESENT";
        }
        setMarks(next);
    }, [date, absentKey, presentKey, eligibleIdsKey]);

    const countForRole = useCallback(
        (tabValue: (typeof ATTENDANCE_ROLE_TABS)[number]["value"]) => {
            if (tabValue === "all") return eligible.length;
            return eligible.filter((s) => s.role === tabValue).length;
        },
        [eligible]
    );

    const filteredEligible = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        return eligible.filter((s) => {
            if (selectedRole !== "all" && s.role !== selectedRole) return false;
            if (!q) return true;
            const roleLabel = formatStaffRoleLabel(s.role, s.staffRoleTitle).toLowerCase();
            return (
                (s.name || "").toLowerCase().includes(q) ||
                roleLabel.includes(q) ||
                (s.staffRoleTitle || "").toLowerCase().includes(q)
            );
        });
    }, [eligible, selectedRole, searchTerm]);

    const setMark = useCallback((staffId: string, status: Mark) => {
        setMarks((prev) => {
            const next = { ...prev };
            if (prev[staffId] === status) {
                delete next[staffId];
            } else {
                next[staffId] = status;
            }
            return next;
        });
    }, []);

    const saveMutation = useMutation({
        mutationFn: async () => {
            const marksPayload: Record<string, "PRESENT" | "ABSENT" | "PENDING"> = {};
            for (const s of eligible) {
                marksPayload[s._id] = staffAttendanceMarkForSave(
                    s._id,
                    marks,
                    dayData ?? undefined,
                    date,
                    todayYmd
                );
            }
            await api.post("/staff-attendance/day", { date, marks: marksPayload });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["staff-attendance-day", date] });
            queryClient.invalidateQueries({ queryKey: ["staff-attendance-eligible"] });
            toast.success("Attendance saved", {
                description: `Progress saved for ${date}. Use Final submit to record absent for anyone not marked present.`,
            });
        },
        onError: (err: unknown) => {
            const ax = err as {
                response?: { data?: { message?: string } };
            };
            const msg = ax.response?.data?.message || "Could not save attendance.";
            toast.error("Save failed", { description: msg });
        }
    });

    const finalizeMutation = useMutation({
        mutationFn: async () => {
            const res = await api.post<{
                success: boolean;
                data?: { presentCount?: number; absentCount?: number };
            }>("/staff-attendance/day/finalize", { date });
            return res.data;
        },
        onSuccess: (body) => {
            const d = body?.data;
            queryClient.invalidateQueries({ queryKey: ["staff-attendance-day", date] });
            queryClient.invalidateQueries({ queryKey: ["staff-attendance-eligible"] });
            toast.success("Attendance finalized", {
                description:
                    d != null
                        ? `Present: ${d.presentCount ?? 0}, absent: ${d.absentCount ?? 0}.`
                        : `Closed attendance for ${date}.`,
            });
        },
        onError: (err: unknown) => {
            const ax = err as {
                response?: { data?: { message?: string } };
            };
            const msg = ax.response?.data?.message || "Could not finalize attendance.";
            toast.error("Final submit failed", { description: msg });
        }
    });

    const maxDate = todayYmd;
    const disabledFuture = date > maxDate;
    const isToday = date === todayYmd;

    return (
        <LockedFeatureGate featureKey="staff" featureLabel="Staff attendance">
            <div className="space-y-6 p-1 max-w-4xl">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Staff attendance</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Staff who are in school mark themselves present (or you mark them here). Save attendance
                        stores progress; Final submit (today only) records everyone not marked present as absent for
                        the day. Total absences counts absent days since joining (or account creation).
                    </p>
                </div>

                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-base">Date</CardTitle>
                        <div className="flex flex-wrap items-center gap-3 pt-2">
                            <Input
                                type="date"
                                className="max-w-[200px]"
                                value={date}
                                max={maxDate}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    if (v && v <= maxDate) setDate(v);
                                }}
                            />
                            {disabledFuture && (
                                <span className="text-xs text-destructive">
                                    Future dates are not allowed.
                                </span>
                            )}
                        </div>
                    </CardHeader>
                </Card>

                {!staffError && !loadingStaff && eligible.length > 0 && (
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Filter &amp; search</CardTitle>
                            <p className="text-xs text-muted-foreground font-normal">
                                Narrow the table; saving still updates everyone on the full attendance list (
                                {eligible.length} staff).
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                                {ATTENDANCE_ROLE_TABS.map((tab) => {
                                    const count = countForRole(tab.value);
                                    const active = selectedRole === tab.value;
                                    return (
                                        <button
                                            key={tab.value}
                                            type="button"
                                            onClick={() => setSelectedRole(tab.value)}
                                            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                                                active
                                                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                                                    : "bg-white border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600 dark:bg-card dark:border-border"
                                            }`}
                                        >
                                            {tab.label}
                                            <span
                                                className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                                                    active
                                                        ? "bg-white/20 text-white"
                                                        : "bg-gray-100 text-gray-500 dark:bg-muted dark:text-muted-foreground"
                                                }`}
                                            >
                                                {count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="relative max-w-md">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                                <Input
                                    placeholder="Search by name or role…"
                                    className="pl-10 h-11 rounded-xl"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    aria-label="Search staff"
                                />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {staffError && (
                    <p className="text-sm text-destructive">
                        Could not load staff list. Try again later.
                    </p>
                )}

                {!staffError && !loadingStaff && eligible.length === 0 && (
                    <Card>
                        <CardContent className="py-10 text-center text-muted-foreground text-sm">
                            No staff members match this attendance list.
                        </CardContent>
                    </Card>
                )}

                {eligible.length > 0 && (
                    <Card>
                        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0 pb-4">
                            <div>
                                <CardTitle className="text-base">
                                    Staff ({filteredEligible.length}
                                    {filteredEligible.length !== eligible.length
                                        ? ` of ${eligible.length}`
                                        : ""}
                                    )
                                </CardTitle>
                                {filteredEligible.length !== eligible.length ? (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Table filtered; save applies to all {eligible.length} staff on the list.
                                    </p>
                                ) : null}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <Button
                                    type="button"
                                    disabled={
                                        saveMutation.isPending ||
                                        finalizeMutation.isPending ||
                                        loadingDay ||
                                        disabledFuture
                                    }
                                    className="gap-2"
                                    onClick={() => saveMutation.mutate()}
                                >
                                    {saveMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="h-4 w-4" />
                                    )}
                                    Save attendance
                                </Button>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    disabled={
                                        finalizeMutation.isPending ||
                                        saveMutation.isPending ||
                                        loadingDay ||
                                        disabledFuture ||
                                        !isToday
                                    }
                                    className="gap-2 border border-amber-200 bg-amber-50 text-amber-950 hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100 dark:hover:bg-amber-950/60"
                                    title={
                                        !isToday
                                            ? "Switch to today’s date to close attendance for the day."
                                            : undefined
                                    }
                                    onClick={() => {
                                        if (!isToday) {
                                            toast.message("Final submit is only available for today’s date.", {
                                                description:
                                                    "Choose today in the date picker, or save changes for other days without finalizing."
                                            });
                                            return;
                                        }
                                        const pending = eligible.filter(
                                            (s) =>
                                                effectiveStaffAttendanceMark(
                                                    s._id,
                                                    marks,
                                                    dayData ?? undefined,
                                                    date,
                                                    todayYmd
                                                ) === "PENDING"
                                        ).length;
                                        const msg =
                                            pending > 0
                                                ? `${pending} staff still not marked present will be recorded as absent. Continue?`
                                                : "Everyone without a present mark will be recorded as absent. Continue?";
                                        if (typeof window !== "undefined" && !window.confirm(msg)) return;
                                        finalizeMutation.mutate();
                                    }}
                                >
                                    {finalizeMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <ClipboardCheck className="h-4 w-4" />
                                    )}
                                    Final submit
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="overflow-x-auto">
                            {loadingDay ? (
                                <div className="flex justify-center py-16">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : filteredEligible.length === 0 ? (
                                <p className="py-10 text-center text-sm text-muted-foreground">
                                    No staff match this filter or search. Clear the search or choose &quot;All&quot; to
                                    see everyone.
                                </p>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-muted-foreground">
                                            <th className="py-3 pr-4 font-medium">Name</th>
                                            <th className="py-3 pr-4 font-medium">Role</th>
                                            <th className="py-3 pr-4 font-medium text-center whitespace-nowrap">
                                                Total absences
                                            </th>
                                            <th className="py-3 pr-4 font-medium text-center whitespace-nowrap">
                                                Today
                                            </th>
                                            <th className="py-3 font-medium text-center">Mark present</th>
                                            <th className="py-3 font-medium text-center">Mark absent</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredEligible.map((s) => {
                                            const m = effectiveStaffAttendanceMark(
                                                s._id,
                                                marks,
                                                dayData ?? undefined,
                                                date,
                                                todayYmd
                                            );
                                            return (
                                                <tr key={s._id} className="border-b last:border-0">
                                                    <td className="py-3 pr-4 font-medium">{s.name}</td>
                                                    <td className="py-3 pr-4 text-muted-foreground">
                                                        {formatStaffRoleLabel(
                                                            s.role || "",
                                                            s.staffRoleTitle
                                                        )}
                                                    </td>
                                                    <td className="py-3 pr-4 text-center tabular-nums text-muted-foreground">
                                                        {s.totalAbsences ?? 0}
                                                    </td>
                                                    <td className="py-3 pr-4 text-center text-xs text-muted-foreground">
                                                        {m === "PENDING" && date === todayYmd ? (
                                                            <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
                                                                Not marked
                                                            </span>
                                                        ) : m === "PRESENT" ? (
                                                            <span className="text-emerald-700 dark:text-emerald-400">
                                                                Present
                                                            </span>
                                                        ) : (
                                                            <span className="text-red-600 dark:text-red-400">
                                                                Absent
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 text-center">
                                                        <Button
                                                            type="button"
                                                            variant={m === "PRESENT" ? "default" : "outline"}
                                                            size="sm"
                                                            className={
                                                                m === "PRESENT"
                                                                    ? "bg-emerald-600 hover:bg-emerald-700"
                                                                    : ""
                                                            }
                                                            onClick={() => setMark(s._id, "PRESENT")}
                                                        >
                                                            Present
                                                        </Button>
                                                    </td>
                                                    <td className="py-3 text-center">
                                                        <Button
                                                            type="button"
                                                            variant={m === "ABSENT" ? "default" : "outline"}
                                                            size="sm"
                                                            className={
                                                                m === "ABSENT"
                                                                    ? "bg-destructive hover:bg-destructive/90"
                                                                    : ""
                                                            }
                                                            onClick={() => setMark(s._id, "ABSENT")}
                                                        >
                                                            Absent
                                                        </Button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
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
