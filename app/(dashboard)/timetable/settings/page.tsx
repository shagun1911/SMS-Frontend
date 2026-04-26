"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, Plus, Trash2, Settings2, CalendarCheck2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { toast } from "sonner";
import { useMemo, useState } from "react";
import { normalizeTimetableBreaks } from "@/lib/timetableSchedule";

const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DEFAULT_WORKING_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const breakRowSchema = z.object({
    afterPeriod: z.number().min(0).max(12),
    label: z.string().min(1).max(40),
    durationMinutes: z.number().min(5).max(120),
});

const classSettingRowSchema = z.object({
    className: z.string().min(1),
    section: z.string().min(1),
    periodCount: z.number().min(1).max(12),
    periodDurationMinutes: z.number().min(10).max(120),
    firstPeriodStart: z.string().min(1),
    breaks: z.array(breakRowSchema),
});

const schema = z.object({
    periodCount: z.number().min(1).max(12),
    firstPeriodStart: z.string().min(1),
    periodDurationMinutes: z.number().min(30).max(60),
    subjects: z.string().optional(),
    breaks: z.array(breakRowSchema).min(1, "Add at least one break"),
    classSettings: z.array(classSettingRowSchema).optional(),
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

function ClassSettingBreaks({ control, nestIndex, register, errors }: any) {
    const { fields, remove, append } = useFieldArray({
        control,
        name: `classSettings.${nestIndex}.breaks`,
    });

    return (
        <div className="space-y-3 mt-4 border-t border-gray-100 pt-3">
            <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-gray-700">Class Breaks</Label>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs px-2"
                    onClick={() => append({ afterPeriod: 4, label: "Break", durationMinutes: 15 })}
                >
                    <Plus className="mr-1 h-3 w-3" /> Add break
                </Button>
            </div>
            {errors?.root && <p className="text-xs text-red-600">{String(errors.root.message)}</p>}
            <div className="space-y-2">
                {fields.map((item, k) => (
                    <div key={item.id} className="grid gap-2 grid-cols-[1fr_1.2fr_1fr_auto] items-end bg-gray-50/50 p-2 rounded-md border border-gray-100">
                        <div className="space-y-1">
                            <Label className="text-[10px] text-gray-500">After period</Label>
                            <input
                                type="number"
                                min={0}
                                max={12}
                                className="flex h-8 w-full rounded-md border border-gray-200 px-2 text-xs"
                                {...register(`classSettings.${nestIndex}.breaks.${k}.afterPeriod`, { valueAsNumber: true })}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] text-gray-500">Label</Label>
                            <Input
                                className="h-8 text-xs"
                                {...register(`classSettings.${nestIndex}.breaks.${k}.label`)}
                                placeholder="e.g. Lunch"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] text-gray-500">Minutes</Label>
                            <input
                                type="number"
                                min={5}
                                max={120}
                                className="flex h-8 w-full rounded-md border border-gray-200 px-2 text-xs"
                                {...register(`classSettings.${nestIndex}.breaks.${k}.durationMinutes`, { valueAsNumber: true })}
                            />
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:bg-red-50"
                            onClick={() => remove(k)}
                            disabled={fields.length <= 1}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function TimetableSettingsPage() {
    const queryClient = useQueryClient();
    const [workingDays, setWorkingDays] = useState<string[]>(DEFAULT_WORKING_DAYS);
    const [workingDaysInitialized, setWorkingDaysInitialized] = useState(false);
    const [showClassSettings, setShowClassSettings] = useState(false);

    const { data: settings, isLoading } = useQuery({
        queryKey: ["timetable-settings"],
        queryFn: async () => {
            const res = await api.get("/timetable/settings");
            return res.data.data;
        },
    });

    // Initialize workingDays from server once
    useMemo(() => {
        if (settings && !workingDaysInitialized) {
            if (Array.isArray(settings.workingDays) && settings.workingDays.length > 0) {
                setWorkingDays(settings.workingDays);
            }
            setWorkingDaysInitialized(true);
        }
    }, [settings, workingDaysInitialized]);

    const defaultBreaks = useMemo(() => breaksFromSettings(settings), [settings]);
    const defaultClassSettings: FormValues["classSettings"] = useMemo(
        () =>
            Array.isArray(settings?.classSettings)
                ? settings.classSettings.map((cs: any) => ({
                      className: cs.className || "",
                      section: cs.section || "A",
                      periodCount: cs.periodCount ?? 7,
                      periodDurationMinutes: cs.periodDurationMinutes ?? 40,
                      firstPeriodStart: cs.firstPeriodStart || "08:00",
                      breaks:
                          cs.breaks?.length > 0
                              ? cs.breaks
                              : [{ afterPeriod: 4, label: "Lunch Break", durationMinutes: 40 }],
                  }))
                : [],
        [settings]
    );

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            periodCount: 7,
            firstPeriodStart: "08:00",
            periodDurationMinutes: 40,
            subjects: "",
            breaks: [{ afterPeriod: 4, label: "Lunch Break", durationMinutes: 40 }],
            classSettings: [],
        },
        values: settings
            ? {
                  periodCount: settings.periodCount ?? 7,
                  firstPeriodStart: settings.firstPeriodStart || "08:00",
                  periodDurationMinutes: settings.periodDurationMinutes ?? 40,
                  subjects: Array.isArray(settings.subjects) ? settings.subjects.join(", ") : "",
                  breaks: defaultBreaks,
                  classSettings: defaultClassSettings,
              }
            : undefined,
    });

    const { fields, append, remove } = useFieldArray({ control: form.control, name: "breaks" });
    const {
        fields: csFields,
        append: csAppend,
        remove: csRemove,
    } = useFieldArray({ control: form.control, name: "classSettings" });

    const toggleDay = (day: string) => {
        setWorkingDays((prev) => {
            if (prev.includes(day)) {
                if (prev.length <= 1) return prev; // keep at least one day
                return prev.filter((d) => d !== day);
            }
            // maintain order
            return ALL_DAYS.filter((d) => [...prev, day].includes(d));
        });
    };

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
                workingDays,
                classSettings: data.classSettings ?? [],
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
                    Configure working days, period times, breaks, and optional per-class overrides.
                </p>
            </div>

            <form onSubmit={form.handleSubmit((data) => saveMutation.mutate(data))} className="space-y-6">
                {/* ── General Settings ── */}
                <Card className="max-w-3xl border border-gray-200 bg-white shadow-sm">
                    <CardHeader>
                        <CardTitle>General</CardTitle>
                        <CardDescription>These settings apply school-wide unless overridden per class.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
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

                        {/* Breaks */}
                        <div className="space-y-3 rounded-lg border border-amber-100 bg-amber-50/40 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <Label className="text-base font-semibold text-gray-900">Breaks during the day</Label>
                                    <p className="text-xs text-gray-600 mt-0.5">
                                        <strong>After period</strong>: 0 = before P1; 3 = after P3. Add multiple rows for
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

                        {/* Subjects */}
                        <div className="space-y-2">
                            <Label>Subjects (comma-separated, for autocomplete)</Label>
                            <textarea
                                className="flex min-h-20 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                                placeholder="e.g. English, Math, Science, Hindi, SST, Computer, Art"
                                {...form.register("subjects")}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* ── Working Days ── */}
                <Card className="max-w-3xl border border-indigo-100 bg-white shadow-sm">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <CalendarCheck2 className="h-5 w-5 text-indigo-600" />
                            <CardTitle>Working Days</CardTitle>
                        </div>
                        <CardDescription>
                            Only selected days will appear as tabs in the timetable editor. Non-working days are hidden.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-3">
                            {ALL_DAYS.map((day) => {
                                const active = workingDays.includes(day);
                                return (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => toggleDay(day)}
                                        className={`min-w-14 rounded-lg border px-4 py-2 text-sm font-semibold transition-all ${
                                            active
                                                ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                                                : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                                        } ${workingDays.length <= 1 && active ? "cursor-not-allowed opacity-60" : ""}`}
                                    >
                                        {day}
                                    </button>
                                );
                            })}
                        </div>
                        <p className="mt-3 text-xs text-gray-500">
                            Selected: <span className="font-medium text-indigo-700">{workingDays.join(", ")}</span>
                            {" · "}At least one day must remain selected.
                        </p>
                    </CardContent>
                </Card>

                {/* ── Per-Class Settings (collapsible) ── */}
                <Card className="max-w-3xl border border-gray-200 bg-white shadow-sm">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Settings2 className="h-5 w-5 text-gray-600" />
                                <CardTitle>Per-Class Overrides</CardTitle>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setShowClassSettings((v) => !v)}
                            >
                                {showClassSettings ? "Hide" : "Show"}
                            </Button>
                        </div>
                        <CardDescription>
                            Optional. If a class has a different period count, duration, or start time, add an override
                            here. Classes without an override use the global settings above.
                        </CardDescription>
                    </CardHeader>
                    {showClassSettings && (
                        <CardContent className="space-y-4">
                            {csFields.length === 0 && (
                                <p className="text-sm text-gray-400">No overrides yet. Click "Add override" to add one.</p>
                            )}
                            {csFields.map((field, idx) => (
                                <div
                                    key={field.id}
                                    className="rounded-lg border border-gray-200 p-4 space-y-3"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-gray-700">Override #{idx + 1}</span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-500 hover:bg-red-50"
                                            onClick={() => csRemove(idx)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div className="space-y-1">
                                            <Label className="text-xs text-gray-500">Class name (e.g. 1, 5A, 10B)</Label>
                                            <Input
                                                {...form.register(`classSettings.${idx}.className`)}
                                                placeholder="1"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs text-gray-500">Section</Label>
                                            <Input
                                                {...form.register(`classSettings.${idx}.section`)}
                                                placeholder="A"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs text-gray-500">Period count</Label>
                                            <input
                                                type="number"
                                                min={1}
                                                max={12}
                                                className="flex h-9 w-full rounded-md border border-gray-200 px-2 text-sm"
                                                {...form.register(`classSettings.${idx}.periodCount`, { valueAsNumber: true })}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs text-gray-500">Period duration (min)</Label>
                                            <input
                                                type="number"
                                                min={10}
                                                max={120}
                                                className="flex h-9 w-full rounded-md border border-gray-200 px-2 text-sm"
                                                {...form.register(`classSettings.${idx}.periodDurationMinutes`, { valueAsNumber: true })}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs text-gray-500">First period start</Label>
                                            <Input
                                                {...form.register(`classSettings.${idx}.firstPeriodStart`)}
                                                placeholder="08:00"
                                            />
                                        </div>
                                    </div>
                                    <ClassSettingBreaks
                                        control={form.control}
                                        nestIndex={idx}
                                        register={form.register}
                                        errors={form.formState.errors.classSettings?.[idx]?.breaks}
                                    />
                                </div>
                            ))}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    csAppend({
                                        className: "",
                                        section: "A",
                                        periodCount: 7,
                                        periodDurationMinutes: 40,
                                        firstPeriodStart: "08:00",
                                        breaks: [{ afterPeriod: 4, label: "Lunch Break", durationMinutes: 40 }],
                                    })
                                }
                            >
                                <Plus className="mr-1 h-4 w-4" /> Add override
                            </Button>
                        </CardContent>
                    )}
                </Card>

                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500" disabled={saveMutation.isPending}>
                    {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" /> Save Settings
                </Button>
            </form>
        </div>
    );
}
