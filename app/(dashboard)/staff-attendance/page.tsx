"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatStaffRoleLabel } from "@/lib/utils";
import { formatYmdLocal } from "@/lib/staffAttendance";
import { toast } from "sonner";
import { LockedFeatureGate } from "@/components/plan/locked-feature-gate";

type EligibleStaff = {
    _id: string;
    name: string;
    role: string;
    staffRoleTitle?: string;
};

type Mark = "PRESENT" | "ABSENT";

export default function StaffAttendancePage() {
    const queryClient = useQueryClient();
    const todayYmd = useMemo(() => formatYmdLocal(new Date()), []);
    const [date, setDate] = useState(todayYmd);
    const [marks, setMarks] = useState<Record<string, Mark>>({});

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
                data: { absentStaffIds: string[] };
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

    useEffect(() => {
        if (!eligible.length || dayData == null) return;
        const absent = new Set(dayData.absentStaffIds);
        const next: Record<string, Mark> = {};
        for (const s of eligible) {
            if (absent.has(s._id)) {
                next[s._id] = "ABSENT";
            }
        }
        setMarks(next);
    }, [date, absentKey, eligibleIdsKey]);

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
            const marksPayload: Record<string, Mark> = {};
            for (const s of eligible) {
                const m = marks[s._id];
                if (m === "ABSENT" || m === "PRESENT") {
                    marksPayload[s._id] = m;
                } else {
                    marksPayload[s._id] = "PRESENT";
                }
            }
            await api.post("/staff-attendance/day", { date, marks: marksPayload });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["staff-attendance-day", date] });
            toast.success("Attendance saved", {
                description: `Saved for ${date}. Only absent days are stored.`,
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

    const maxDate = todayYmd;
    const disabledFuture = date > maxDate;

    return (
        <LockedFeatureGate featureKey="staff" featureLabel="Staff attendance">
            <div className="space-y-6 p-1 max-w-4xl">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Staff attendance</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Mark present or absent for staff (excluding school admin, drivers, and conductors).
                        Unselected rows are saved as present — only absent days are stored.
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
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                            <CardTitle className="text-base">
                                Staff ({eligible.length})
                            </CardTitle>
                            <Button
                                type="button"
                                disabled={
                                    saveMutation.isPending ||
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
                        </CardHeader>
                        <CardContent className="overflow-x-auto">
                            {loadingDay ? (
                                <div className="flex justify-center py-16">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-muted-foreground">
                                            <th className="py-3 pr-4 font-medium">Name</th>
                                            <th className="py-3 pr-4 font-medium">Role</th>
                                            <th className="py-3 font-medium text-center">Mark present</th>
                                            <th className="py-3 font-medium text-center">Mark absent</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {eligible.map((s) => {
                                            const m = marks[s._id];
                                            return (
                                                <tr key={s._id} className="border-b last:border-0">
                                                    <td className="py-3 pr-4 font-medium">{s.name}</td>
                                                    <td className="py-3 pr-4 text-muted-foreground">
                                                        {formatStaffRoleLabel(
                                                            s.role || "",
                                                            s.staffRoleTitle
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
