"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CalendarDays, Loader2, Plus } from "lucide-react";
import api from "@/lib/api";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function TimetablePage() {
    const [selectedClass, setSelectedClass] = useState("");
    const [selectedSection, setSelectedSection] = useState("");

    const { data: classes } = useQuery({
        queryKey: ["classes-list"],
        queryFn: async () => {
            const res = await api.get("/classes");
            return res.data.data ?? [];
        },
    });

    const { data: timetables, isLoading } = useQuery({
        queryKey: ["timetable", selectedClass, selectedSection],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (selectedClass) params.set("className", selectedClass);
            if (selectedSection) params.set("section", selectedSection);
            const res = await api.get(`/timetable?${params}`);
            return res.data.data ?? [];
        },
    });

    const byDay = (timetables ?? []).reduce((acc: Record<number, any>, t: any) => {
        acc[t.dayOfWeek] = t;
        return acc;
    }, {});

    return (
        <div className="flex-1 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">Timetable</h2>
                    <p className="mt-1 text-sm text-gray-500">
                        View and manage class timetables with periods, breaks, and lunch.
                    </p>
                </div>
            </div>

            <Card className="border border-gray-200 bg-white p-6 shadow-sm">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500">Class</label>
                        <select
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                        >
                            <option value="">All</option>
                            {[...new Set((classes ?? []).map((c: any) => c.className))].map((cn: string) => (
                                <option key={cn} value={cn}>{cn}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500">Section</label>
                        <select
                            value={selectedSection}
                            onChange={(e) => setSelectedSection(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                        >
                            <option value="">All</option>
                            {["A", "B", "C", "D"].map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </Card>

            {isLoading ? (
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {DAYS.slice(1, 6).map((dayName, dayIndex) => {
                        const dayNum = dayIndex + 1;
                        const tt = byDay[dayNum];
                        return (
                            <Card key={dayNum} className="border border-gray-200 bg-white overflow-hidden shadow-sm">
                                <div className="border-b border-gray-100 bg-indigo-50/50 px-4 py-3 font-semibold text-gray-900">
                                    {dayName}
                                </div>
                                <div className="p-4">
                                    {tt?.slots?.length > 0 ? (
                                        <ul className="space-y-2">
                                            {tt.slots.map((slot: any, i: number) => (
                                                <li key={i} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/50 px-3 py-2 text-sm">
                                                    <span className="font-medium text-gray-700">
                                                        {slot.startTime} - {slot.endTime}
                                                    </span>
                                                    <span className={slot.type === "lunch" || slot.type === "break" ? "text-amber-600" : "text-gray-600"}>
                                                        {slot.type === "lunch" ? "Lunch" : slot.type === "break" ? "Break" : slot.subject || slot.title || "Period"}
                                                    </span>
                                                    {slot.teacherId?.name && (
                                                        <span className="text-xs text-gray-500">{slot.teacherId.name}</span>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="py-6 text-center text-sm text-gray-500">No slots defined</p>
                                    )}
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            <Card className="border border-amber-200 bg-amber-50/50 p-4">
                <p className="text-sm text-amber-800">
                    <strong>Tip:</strong> To add or edit timetables, use the API or ask your admin to configure periods, lunch break, and teacher assignments per class and day.
                </p>
            </Card>
        </div>
    );
}
