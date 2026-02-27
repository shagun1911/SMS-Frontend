"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { UserRole } from "@/types";

const schema = z.object({
    periodCount: z.number().min(1).max(12),
    lunchAfterPeriod: z.number().min(0).max(12),
    firstPeriodStart: z.string().min(1),
    periodDurationMinutes: z.number().min(30).max(60),
    lunchBreakDuration: z.number().min(20).max(60),
    subjects: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function TimetableSettingsPage() {
    const queryClient = useQueryClient();
    const router = useRouter();
    const { user } = useAuthStore();
    const isTeacher = user?.role === UserRole.TEACHER;
    const canEdit = !isTeacher || (user?.permissions ?? []).includes("edit_timetable");

    useEffect(() => {
        if (user && !canEdit) router.replace("/timetable");
    }, [user, canEdit, router]);

    const { data: settings, isLoading } = useQuery({
        queryKey: ["timetable-settings"],
        queryFn: async () => {
            const res = await api.get("/timetable/settings");
            return res.data.data;
        },
    });

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            periodCount: 7,
            lunchAfterPeriod: 4,
            firstPeriodStart: "08:00",
            periodDurationMinutes: 40,
            lunchBreakDuration: 40,
            subjects: "",
        },
        values: settings
            ? {
                  periodCount: settings.periodCount ?? 7,
                  lunchAfterPeriod: settings.lunchAfterPeriod ?? 4,
                  firstPeriodStart: settings.firstPeriodStart || "08:00",
                  periodDurationMinutes: settings.periodDurationMinutes ?? 40,
                  lunchBreakDuration: settings.lunchBreakDuration ?? 40,
                  subjects: Array.isArray(settings.subjects) ? settings.subjects.join(", ") : "",
              }
            : undefined,
    });

    const saveMutation = useMutation({
        mutationFn: async (data: FormValues) => {
            const subjects = data.subjects
                ? data.subjects.split(",").map((s) => s.trim()).filter(Boolean)
                : [];
            await api.post("/timetable/settings", {
                periodCount: data.periodCount,
                lunchAfterPeriod: data.lunchAfterPeriod,
                firstPeriodStart: data.firstPeriodStart,
                periodDurationMinutes: data.periodDurationMinutes,
                lunchBreakDuration: data.lunchBreakDuration,
                subjects,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["timetable-settings"] });
            toast.success("Timetable settings saved.");
        },
        onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed to save"),
    });

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-gray-900">Timetable Settings</h2>
                <p className="mt-1 text-sm text-gray-500">Set period count, lunch position, and subjects for timetables.</p>
            </div>
            <Card className="max-w-2xl border border-gray-200 bg-white shadow-sm">
                <CardHeader>
                    <CardTitle>General</CardTitle>
                    <CardDescription>These settings apply when creating and printing timetables.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={form.handleSubmit((data) => saveMutation.mutate(data))} className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Period count</Label>
                                <input
                                    type="number"
                                    min={1}
                                    max={12}
                                    className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                                    {...form.register("periodCount", { valueAsNumber: true })}
                                />
                                {form.formState.errors.periodCount && (
                                    <p className="text-xs text-red-600">{form.formState.errors.periodCount.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label>Lunch after period (0 = before P1)</Label>
                                <input
                                    type="number"
                                    min={0}
                                    max={12}
                                    className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                                    {...form.register("lunchAfterPeriod", { valueAsNumber: true })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>First period start (e.g. 08:00)</Label>
                                <Input {...form.register("firstPeriodStart")} />
                            </div>
                            <div className="space-y-2">
                                <Label>Period duration (minutes)</Label>
                                <input
                                    type="number"
                                    min={30}
                                    max={60}
                                    className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                                    {...form.register("periodDurationMinutes", { valueAsNumber: true })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Lunch break duration (minutes)</Label>
                                <input
                                    type="number"
                                    min={20}
                                    max={60}
                                    className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                                    {...form.register("lunchBreakDuration", { valueAsNumber: true })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Subjects (comma-separated, for autocomplete)</Label>
                            <textarea
                                className="flex min-h-[80px] w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                                placeholder="e.g. English, Math, Science, Hindi, SST, Computer, Art"
                                {...form.register("subjects")}
                            />
                        </div>
                        <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500" disabled={saveMutation.isPending}>
                            {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Save className="mr-2 h-4 w-4" /> Save Settings
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
