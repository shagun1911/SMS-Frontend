"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";

interface MarksEntryModalProps {
    exam: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function MarksEntryModal({ exam, open, onOpenChange }: MarksEntryModalProps) {
    const queryClient = useQueryClient();
    const [selectedClass, setSelectedClass] = useState("");
    const [subjects, setSubjects] = useState([{ subject: "Mathematics", maxMarks: 100 }]);
    const [studentMarks, setStudentMarks] = useState<any[]>([]);

    const { data: students, isLoading } = useQuery({
        queryKey: ["students-by-class", selectedClass],
        queryFn: async () => {
            const res = await api.get("/students");
            const allStudents = res.data.data ?? [];
            return allStudents.filter((s: any) => s.class === selectedClass);
        },
        enabled: open && !!selectedClass,
    });

    useEffect(() => {
        if (Array.isArray(students) && students.length > 0) {
            setStudentMarks(
                students.map((s: any) => ({
                    studentId: s._id,
                    name: `${s.firstName} ${s.lastName}`,
                    subjects: subjects.map(sub => ({ ...sub, obtainedMarks: 0 })),
                }))
            );
        }
    }, [students, subjects]);

    const saveMarks = useMutation({
        mutationFn: async (data: any) => {
            const res = await api.post(`/exams/${exam._id}/results`, data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["exam-results", exam._id] });
            toast.success("Marks saved successfully");
            onOpenChange(false);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message ?? "Failed to save marks");
        },
    });

    const handleMarksChange = (studentIndex: number, subjectIndex: number, value: string) => {
        const newMarks = [...studentMarks];
        newMarks[studentIndex].subjects[subjectIndex].obtainedMarks = Number(value) || 0;
        setStudentMarks(newMarks);
    };

    const handleSave = () => {
        const results = studentMarks.map(sm => ({
            studentId: sm.studentId,
            subjects: sm.subjects,
        }));
        saveMarks.mutate({ results });
    };

    const addSubject = () => {
        setSubjects([...subjects, { subject: "", maxMarks: 100 }]);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Enter Marks - {exam?.title}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Select Class</Label>
                            <select
                                className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                            >
                                <option value="">-- Select Class --</option>
                                {exam?.classes?.map((cls: string) => (
                                    <option key={cls} value={cls}>
                                        Class {cls}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-end">
                            <Button variant="outline" onClick={addSubject} className="w-full">
                                + Add Subject
                            </Button>
                        </div>
                    </div>

                    {subjects.length > 0 && (
                        <div className="space-y-2">
                            <Label>Subjects Configuration</Label>
                            <div className="grid grid-cols-2 gap-2">
                                {subjects.map((sub, idx) => (
                                    <div key={idx} className="flex gap-2">
                                        <Input
                                            placeholder="Subject name"
                                            value={sub.subject}
                                            onChange={(e) => {
                                                const newSubs = [...subjects];
                                                newSubs[idx].subject = e.target.value;
                                                setSubjects(newSubs);
                                            }}
                                        />
                                        <Input
                                            type="number"
                                            placeholder="Max"
                                            className="w-20"
                                            value={sub.maxMarks}
                                            onChange={(e) => {
                                                const newSubs = [...subjects];
                                                newSubs[idx].maxMarks = Number(e.target.value);
                                                setSubjects(newSubs);
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {selectedClass && (
                        <div className="space-y-2">
                            <Label>Enter Marks for Students</Label>
                            {isLoading ? (
                                <div className="flex h-32 items-center justify-center">
                                    <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                                </div>
                            ) : (
                                <div className="rounded-lg border border-gray-200">
                                    <table className="w-full text-xs">
                                        <thead className="bg-gray-50 text-left text-gray-700">
                                            <tr>
                                                <th className="p-2 font-medium">Student</th>
                                                {subjects.map((sub, idx) => (
                                                    <th key={idx} className="p-2 font-medium">
                                                        {sub.subject} (/{sub.maxMarks})
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {studentMarks.map((sm, sIdx) => (
                                                <tr key={sIdx} className="border-t border-gray-100">
                                                    <td className="p-2 text-gray-900">{sm.name}</td>
                                                    {sm.subjects.map((subj: any, subIdx: number) => (
                                                        <td key={subIdx} className="p-2">
                                                            <Input
                                                                type="number"
                                                                className="h-8 w-16 text-center"
                                                                value={subj.obtainedMarks}
                                                                onChange={(e) =>
                                                                    handleMarksChange(sIdx, subIdx, e.target.value)
                                                                }
                                                                max={subj.maxMarks}
                                                            />
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        className="flex-1 bg-indigo-600 hover:bg-indigo-500"
                        onClick={handleSave}
                        disabled={!selectedClass || saveMarks.isPending}
                    >
                        {saveMarks.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" /> Save Marks
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
