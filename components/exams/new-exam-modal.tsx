"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";

interface NewExamModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function NewExamModal({ open, onOpenChange }: NewExamModalProps) {
    const queryClient = useQueryClient();
    const [title, setTitle] = useState("");
    const [type, setType] = useState("unit_test");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

    const { data: classes } = useQuery({
        queryKey: ["classes-list"],
        queryFn: async () => {
            const res = await api.get("/classes");
            return res.data.data ?? [];
        },
        enabled: open,
    });

    const { data: sessions } = useQuery({
        queryKey: ["sessions-list"],
        queryFn: async () => {
            const res = await api.get("/sessions");
            return res.data.data ?? [];
        },
        enabled: open,
    });

    const activeSess = Array.isArray(sessions) ? sessions.find((s: any) => s.isActive) : null;

    const createExam = useMutation({
        mutationFn: async (data: any) => {
            const res = await api.post("/exams", data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["exams-list"] });
            toast.success("Exam created successfully");
            resetForm();
            onOpenChange(false);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message ?? "Failed to create exam");
        },
    });

    const resetForm = () => {
        setTitle("");
        setType("unit_test");
        setStartDate("");
        setEndDate("");
        setSelectedClasses([]);
    };

    const toggleClass = (className: string) => {
        setSelectedClasses(prev =>
            prev.includes(className) ? prev.filter(c => c !== className) : [...prev, className]
        );
    };

    const handleSubmit = () => {
        if (!title || !startDate || !endDate || selectedClasses.length === 0) {
            toast.error("Please fill all required fields");
            return;
        }
        const payload = {
            title,
            type,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            classes: selectedClasses,
            sessionId: activeSess?._id,
        };
        createExam.mutate(payload);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Create New Examination</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 space-y-2">
                            <Label>Exam Title *</Label>
                            <Input
                                placeholder="e.g., Mid-Term Examination 2024"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Exam Type *</Label>
                            <select
                                className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                            >
                                <option value="unit_test">Unit Test</option>
                                <option value="quarterly">Quarterly</option>
                                <option value="half_yearly">Half-Yearly</option>
                                <option value="annual">Annual</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>Session</Label>
                            <Input value={activeSess?.sessionYear ?? "N/A"} disabled />
                        </div>
                        <div className="space-y-2">
                            <Label>Start Date *</Label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>End Date *</Label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                        <div className="col-span-2 space-y-2">
                            <Label>Select Classes *</Label>
                            <div className="flex flex-wrap gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                                {Array.isArray(classes) && classes.length > 0 ? (
                                    classes.map((cls: any) => (
                                        <Badge
                                            key={cls._id}
                                            onClick={() => toggleClass(cls.className)}
                                            className={`cursor-pointer ${
                                                selectedClasses.includes(cls.className)
                                                    ? "bg-indigo-600 text-white"
                                                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                            }`}
                                        >
                                            Class {cls.className}
                                        </Badge>
                                    ))
                                ) : (
                                    <p className="text-xs text-gray-500">No classes available</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                            resetForm();
                            onOpenChange(false);
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        className="flex-1 bg-indigo-600 hover:bg-indigo-500"
                        onClick={handleSubmit}
                        disabled={createExam.isPending}
                    >
                        {createExam.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            "Create Exam"
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
