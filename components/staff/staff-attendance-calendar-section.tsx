"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    startOfDay,
    isAfter,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isStaffAttendanceTrackedRole } from "@/lib/staffAttendance";

type MonthPayload = {
    absences: { date: string; status: "ABSENT" }[];
    totalAbsents: number;
    notTracked?: boolean;
};

export function StaffAttendanceCalendarSection({
    staffId,
    role,
}: {
    staffId: string;
    role?: string;
}) {
    const [cursor, setCursor] = useState(() => new Date());
    const year = cursor.getFullYear();
    const month = cursor.getMonth() + 1;

    const tracked = isStaffAttendanceTrackedRole(role);

    const { data, isLoading, isError } = useQuery({
        queryKey: ["staff-attendance-month", staffId, year, month],
        queryFn: async () => {
            const res = await api.get<{
                success: boolean;
                data: MonthPayload;
            }>(`/staff-attendance/staff/${staffId}/month`, {
                params: { year, month },
            });
            return res.data.data;
        },
        enabled: !!staffId && tracked,
    });

    const absentSet = useMemo(
        () => new Set((data?.absences ?? []).map((a) => a.date)),
        [data]
    );

    const monthStart = startOfMonth(cursor);
    const monthEnd = endOfMonth(cursor);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const leading = monthStart.getDay();
    const today = startOfDay(new Date());

    if (!tracked) {
        return (
            <Card className="border-dashed">
                <CardHeader>
                    <CardTitle className="text-lg">Staff attendance</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Attendance tracking is not used for this role (school admin, driver, or conductor).
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 space-y-0 pb-2">
                <div>
                    <CardTitle className="text-lg">Staff attendance</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                        Only absent days are stored. Red = absent.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                            setCursor(new Date(year, cursor.getMonth() - 1, 1))
                        }
                        aria-label="Previous month"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-semibold tabular-nums min-w-[10rem] text-center">
                        {format(cursor, "MMMM yyyy")}
                    </span>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                            setCursor(new Date(year, cursor.getMonth() + 1, 1))
                        }
                        aria-label="Next month"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {isError && (
                    <p className="text-sm text-destructive">
                        Could not load attendance for this month.
                    </p>
                )}
                <div className="rounded-lg border bg-muted/30 p-3 text-center">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Total absents this month
                    </p>
                    <p className="text-2xl font-bold tabular-nums text-foreground mt-1">
                        {isLoading ? "…" : data?.totalAbsents ?? 0}
                    </p>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                        <div key={d} className="py-1">
                            {d}
                        </div>
                    ))}
                    {Array.from({ length: leading }).map((_, i) => (
                        <div key={`pad-${i}`} />
                    ))}
                    {daysInMonth.map((day) => {
                        const ymd = format(day, "yyyy-MM-dd");
                        const isAbsent = absentSet.has(ymd);
                        const isFuture = isAfter(startOfDay(day), today);
                        return (
                            <div
                                key={ymd}
                                className={cn(
                                    "aspect-square flex items-center justify-center rounded-md text-sm font-medium",
                                    isFuture && "text-muted-foreground/40 bg-muted/20",
                                    !isFuture && !isAbsent && "bg-background border border-transparent",
                                    isAbsent &&
                                        !isFuture &&
                                        "bg-destructive text-destructive-foreground shadow-sm",
                                    isAbsent && isFuture && "bg-destructive/20 text-muted-foreground line-through"
                                )}
                                title={
                                    isAbsent
                                        ? `Absent — ${ymd}`
                                        : isFuture
                                          ? `Future — ${ymd}`
                                          : ymd
                                }
                            >
                                {format(day, "d")}
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
