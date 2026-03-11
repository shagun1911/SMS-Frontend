"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { toast } from "sonner";
import api from "@/lib/api";
import { Loader2, Calculator } from "lucide-react";

interface GeneratePayrollModalProps {
    staffId: string;
    staffName: string;
    open: boolean;
    onOpenChange: (val: boolean) => void;
}

const ALL_MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

export function GeneratePayrollModal({
    staffId,
    staffName,
    open,
    onOpenChange,
}: GeneratePayrollModalProps) {
    const queryClient = useQueryClient();

    const now = new Date();
    const [month, setMonth] = useState(ALL_MONTHS[now.getMonth()]);
    const [year, setYear] = useState(now.getFullYear());

    const { data: sessionsData } = useQuery({
        queryKey: ["sessions-list"],
        queryFn: async () => {
            const res = await api.get("/sessions");
            return res.data?.data ?? res.data ?? [];
        },
    });

    const activeSession: any = useMemo(() => {
        const list = Array.isArray(sessionsData) ? sessionsData : [];
        return list.find((s: any) => s.isActive) ?? null;
    }, [sessionsData]);

    const sessionYears: number[] = useMemo(() => {
        if (!activeSession?.startDate || !activeSession?.endDate) {
            return [now.getFullYear()];
        }
        const startY = new Date(activeSession.startDate).getFullYear();
        const endY = new Date(activeSession.endDate).getFullYear();
        const years: number[] = [];
        for (let y = startY; y <= endY; y++) years.push(y);
        return years;
    }, [activeSession]);

    const availableMonths: string[] = useMemo(() => {
        if (!activeSession?.startDate || !activeSession?.endDate) return ALL_MONTHS;

        const start = new Date(activeSession.startDate);
        const end = new Date(activeSession.endDate);
        const startY = start.getFullYear();
        const endY = end.getFullYear();
        const startM = start.getMonth();
        const endM = end.getMonth();

        if (year === startY && year === endY) return ALL_MONTHS.slice(startM, endM + 1);
        if (year === startY) return ALL_MONTHS.slice(startM);
        if (year === endY) return ALL_MONTHS.slice(0, endM + 1);
        if (year > startY && year < endY) return ALL_MONTHS;
        return ALL_MONTHS;
    }, [activeSession, year]);

    useEffect(() => {
        if (sessionYears.length > 0 && !sessionYears.includes(year)) {
            setYear(sessionYears[0]);
        }
    }, [sessionYears, year]);

    useEffect(() => {
        if (availableMonths.length > 0 && !availableMonths.includes(month)) {
            setMonth(availableMonths[0]);
        }
    }, [availableMonths, month]);

    const generateMutation = useMutation({
        mutationFn: async (body: { month: string; year: number; specificStaffId: string }) => {
            const res = await api.post("/salaries/generate", body);
            return res.data;
        },
        onSuccess: async (data) => {
            if (data?.data?.created === 0 && data?.data?.skipped > 0) {
                toast.info(`Payroll for ${month} ${year} was already generated for this staff member.`);
            } else {
                toast.success(`Payroll generated successfully for ${month} ${year}!`);
            }

            await queryClient.invalidateQueries({ queryKey: ["salary-history", staffId] });
            await queryClient.invalidateQueries({ queryKey: ["staff-detail", staffId] });

            onOpenChange(false);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || "Failed to generate payroll");
        },
    });

    const handleGenerate = () => {
        if (!month || !year) {
            toast.error("Please select both month and year");
            return;
        }

        generateMutation.mutate({
            month,
            year,
            specificStaffId: staffId,
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Calculator className="h-5 w-5 text-indigo-600" />
                        Generate Payroll
                    </DialogTitle>
                    <DialogDescription>
                        Generate the salary slip for <b>{staffName}</b> for a specific month.
                        {activeSession?.startDate && activeSession?.endDate && (
                            <span className="block text-xs mt-1">
                                Session: {new Date(activeSession.startDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })} to{" "}
                                {new Date(activeSession.endDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                            </span>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Select
                            label="Month"
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                            options={availableMonths.map(m => ({ label: m, value: m }))}
                        />
                    </div>

                    <div className="space-y-2">
                        <Select
                            label="Year"
                            value={String(year)}
                            onChange={(e) => setYear(Number(e.target.value))}
                            options={sessionYears.map(y => ({ label: String(y), value: String(y) }))}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={generateMutation.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleGenerate}
                        disabled={generateMutation.isPending}
                        className="bg-indigo-600 hover:bg-indigo-700"
                    >
                        {generateMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Generate Salary
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
