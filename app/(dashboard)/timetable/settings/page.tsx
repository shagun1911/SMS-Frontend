"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { toast } from "sonner";
import { useMemo } from "react";
import { normalizeTimetableBreaks } from "@/lib/timetableSchedule";

const breakRowSchema = z.object({
    afterPeriod: z.number().min(0).max(12),
    label: z.string().min(1).max(40),
    durationMinutes: z.number().min(5).max(120),
});

const schema = z.object({
    periodCount: z.number().min(1).max(12),
    firstPeriodStart: z.string().min(1),
    periodDurationMinutes: z.number().min(30).max(60),
    subjects: z.string().optional(),
    breaks: z.array(breakRowSchema).min(1, "Add at least one break"),
});

type FormValues = z.infer<typeof schema>;

function breaksFromSettings(settings: any): FormValues["breaks"] {
    if (!settings) {
        return [{ afterPeriod: 4, label: "Lunch Break", durationMinutes: 40 }];
    }
    const norm = normalizeTimetableBreaks({
        breaks: settings.breaks,
        lunchAfterPeriod: settings.lunchAfterPeriod,
        lunchBreakDuration: settings.lunchBreakDuration,
        breakLabel: settings.breakLabel,
    });
    if (norm.length === 0) {
        return [{ afterPeriod: 4, label: "Lunch Break", durationMinutes: 40 }];
    }
    return norm.map((b) => ({
        afterPeriod: b.afterPeriod,
        label: b.label,
        durationMinutes: b.durationMinutes,
    }));
}

export default function TimetableSettingsPage() {
    const queryClient = useQueryClient();

    const { data: settings, isLoading } = useQuery({
        queryKey: ["timetable-settings"],
        queryFn: async () => {
            const res = await api.get("/timetable/settings");
            return res.data.data;
        },
    });

    const defaultBreaks = useMemo(() => breaksFromSettings(settings), [settings]);

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            periodCount: 7,
            firstPeriodStart: "08:00",
            periodDurationMinutes: 40,
            subjects: "",
            breaks: [{ afterPeriod: 4, label: "Lunch Break", durationMinutes: 40 }],
        },
        values: settings
            ? {
                  periodCount: settings.periodCount ?? 7,
                  firstPeriodStart: settings.firstPeriodStart || "08:00",
                  periodDurationMinutes: settings.periodDurationMinutes ?? 40,
                  subjects: Array.isArray(settings.subjects) ? settings.subjects.join(", ") : "",
                  breaks: defaultBreaks,
              }
            : undefined,
    });

    const { fields, append, remove } = useFieldArray({ control: form.control, name: "breaks" });

    const saveMutation = useMutation({
        mutationFn: async (data: FormValues) => {
            const subjects = data.subjects
                ? data.subjects
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean)
                : [];
            const first = data.breaks[0];
            await api.post("/timetable/settings", {
                periodCount: data.periodCount,
                firstPeriodStart: data.firstPeriodStart,
                periodDurationMinutes: data.periodDurationMinutes,
                breaks: data.breaks,
                lunchAfterPeriod: first?.afterPeriod ?? 0,
                lunchBreakDuration: first?.durationMinutes ?? 40,
                breakLabel: first?.label ?? "Break",
                subjects,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["timetable-settings"] });
            queryClient.invalidateQueries({ queryKey: ["timetable-grid"] });
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
                <p className="mt-1 text-sm text-gray-500">
                    Set period times and add as many breaks as you need (after which period, label, duration).
                </p>
            </div>
            <Card className="max-w-3xl border border-gray-200 bg-white shadow-sm">
                <CardHeader>
                    <CardTitle>General</CardTitle>
                    <CardDescription>These settings apply to the school-wide grid, per-class timetables, and PDFs.</CardDescription>
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
                                <Label>First period start (e.g. 08:00)</Label>
                                <Input {...form.register("firstPeriodStart")} />
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                                <Label>Period duration (minutes)</Label>
                                <input
                                    type="number"
                                    min={30}
                                    max={60}
                                    className="flex h-10 max-w-xs rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                                    {...form.register("periodDurationMinutes", { valueAsNumber: true })}
                                />
                            </div>
                        </div>

                        <div className="space-y-3 rounded-lg border border-amber-100 bg-amber-50/40 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <Label className="text-base font-semibold text-gray-900">Breaks during the day</Label>
                                    <p className="text-xs text-gray-600 mt-0.5">
                                        <strong>After period</strong>: 0 = before P1; 3 = after P3 (before P4). Add multiple rows for
                                        water break, lunch, etc.
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="border-amber-200 bg-white"
                                    onClick={() => append({ afterPeriod: 4, label: "Break", durationMinutes: 15 })}
                                >
                                    <Plus className="mr-1 h-4 w-4" /> Add break
                                </Button>
                            </div>
                            {form.formState.errors.breaks?.root && (
                                <p className="text-xs text-red-600">{String(form.formState.errors.breaks.root.message)}</p>
                            )}
                            <div className="space-y-3">
                                {fields.map((field, index) => (
                                    <div
                                        key={field.id}
                                        className="grid gap-3 rounded-lg border border-gray-200 bg-white p-3 sm:grid-cols-[1fr_1.2fr_auto_auto]"
                                    >
                                        <div className="space-y-1">
                                            <Label className="text-xs text-gray-500">After period (0–12)</Label>
                                            <input
                                                type="number"
                                                min={0}
                                                max={12}
                                                className="flex h-9 w-full rounded-md border border-gray-200 px-2 text-sm"
                                                {...form.register(`breaks.${index}.afterPeriod`, { valueAsNumber: true })}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs text-gray-500">Label</Label>
                                            <Input {...form.register(`breaks.${index}.label`)} placeholder="e.g. Lunch" />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs text-gray-500">Minutes</Label>
                                            <input
                                                type="number"
                                                min={5}
                                                max={120}
                                                className="flex h-9 w-full rounded-md border border-gray-200 px-2 text-sm"
                                                {...form.register(`breaks.${index}.durationMinutes`, { valueAsNumber: true })}
                                            />
                                        </div>
                                        <div className="flex items-end">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-600 hover:bg-red-50"
                                                onClick={() => remove(index)}
                                                disabled={fields.length <= 1}
                                                title={fields.length <= 1 ? "Keep at least one break" : "Remove"}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Subjects (comma-separated, for autocomplete)</Label>
                            <textarea
                                className="flex min-h-20 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
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
