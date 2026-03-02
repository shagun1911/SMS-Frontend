"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import api from "@/lib/api";
import { Loader2, Calculator } from "lucide-react";

interface GeneratePayrollModalProps {
    staffId: string;
    staffName: string;
    open: boolean;
    onOpenChange: (val: boolean) => void;
}

const MONTHS = [
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

    // Default to current month and year
    const d = new Date();
    const [month, setMonth] = useState(MONTHS[d.getMonth()]);
    const [year, setYear] = useState(d.getFullYear().toString());

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

            // Invalidate queries to refresh the payments list and summary
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
            year: parseInt(year, 10),
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
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Select
                            label="Month"
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                            options={MONTHS.map(m => ({ label: m, value: m }))}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Year</label>
                        <Input
                            type="number"
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            min={2000}
                            max={2100}
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
