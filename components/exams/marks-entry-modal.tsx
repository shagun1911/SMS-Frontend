"use client";

import { useState, useEffect, useLayoutEffect, useRef, useMemo } from "react";
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

function parseMarks(v: unknown): number {
    if (typeof v === "number" && !Number.isNaN(v)) return Math.max(0, v);
    const n = parseFloat(String(v).replace(/[^0-9.-]/g, ""));
    return Number.isNaN(n) ? 0 : Math.max(0, n);
}

type SubjectDef = { subject: string; maxMarks: number };

/** Build student rows: init from scratch with zeros */
function initStudentMarksFromStudents(students: any[], subjectDefs: SubjectDef[]) {
    return students.map((s: any) => ({
        studentId: s._id,
        name: `${s.firstName} ${s.lastName}`,
        subjects: subjectDefs.map((sub) => ({ ...sub, obtainedMarks: 0 })),
    }));
}

/** Same student cohort (same ids, same count): align subject columns, preserve marks by column index */
function mergeSubjectsIntoStudentMarks(
    prev: any[],
    students: any[],
    subjectDefs: SubjectDef[]
) {
    const prevById = new Map(prev.map((p) => [String(p.studentId), p]));
    const newIds = new Set(students.map((s: any) => String(s._id)));
    const sameCohort =
        prev.length > 0 &&
        prev.length === students.length &&
        students.every((s: any) => prevById.has(String(s._id))) &&
        prev.every((p) => newIds.has(String(p.studentId)));

    if (!sameCohort) {
        return initStudentMarksFromStudents(students, subjectDefs);
    }

    return students.map((s: any) => {
        const existing = prevById.get(String(s._id))!;
        const aligned = subjectDefs.map((def, j) => ({
            ...def,
            obtainedMarks:
                existing.subjects[j] !== undefined
                    ? parseMarks(existing.subjects[j].obtainedMarks)
                    : 0,
        }));
        return {
            studentId: s._id,
            name: `${s.firstName} ${s.lastName}`,
            subjects: aligned,
        };
    });
}

function resultStudentId(r: any): string {
    const sid = r.studentId;
    if (sid && typeof sid === "object" && sid._id) return String(sid._id);
    return String(sid ?? "");
}

/** Subject columns from saved exam results for this class (stable order) */
function deriveSubjectDefsFromResults(resultsForClass: any[]): SubjectDef[] {
    const seen = new Set<string>();
    const out: SubjectDef[] = [];
    for (const r of resultsForClass) {
        for (const s of r.subjects || []) {
            const name = String(s.subject || "").trim();
            const key = name.toLowerCase();
            if (!name || seen.has(key)) continue;
            seen.add(key);
            out.push({ subject: name, maxMarks: parseMarks(s.maxMarks) || 100 });
        }
    }
    return out.length > 0 ? out : [{ subject: "Mathematics", maxMarks: 100 }];
}

function buildRowsFromServer(
    students: any[],
    subjectDefs: SubjectDef[],
    resultsForClass: any[]
) {
    return students.map((s: any) => {
        const res = resultsForClass.find((r: any) => resultStudentId(r) === String(s._id));
        const subjects = subjectDefs.map((def) => {
            const saved = res?.subjects?.find(
                (x: any) =>
                    String(x.subject || "")
                        .trim()
                        .toLowerCase() === def.subject.trim().toLowerCase()
            );
            return {
                subject: def.subject,
                maxMarks: def.maxMarks,
                obtainedMarks: saved != null ? parseMarks(saved.obtainedMarks) : 0,
            };
        });
        return {
            studentId: s._id,
            name: `${s.firstName} ${s.lastName}`,
            subjects,
        };
    });
}

export function MarksEntryModal({ exam, open, onOpenChange }: MarksEntryModalProps) {
    const queryClient = useQueryClient();
    const [selectedClass, setSelectedClass] = useState("");
    const [subjects, setSubjects] = useState<SubjectDef[]>([{ subject: "Mathematics", maxMarks: 100 }]);
    const [studentMarks, setStudentMarks] = useState<any[]>([]);

    /** After picking a class, re-apply server marks once results have loaded */
    const pendingServerHydrationRef = useRef(false);

    const { data: examResultsRaw, isLoading: resultsLoading, isFetching: resultsFetching } = useQuery({
        queryKey: ["exam-results", exam?._id],
        queryFn: async () => {
            const res = await api.get(`/exams/${exam._id}/results`);
            return res.data.data ?? res.data ?? [];
        },
        enabled: open && !!exam?._id,
    });

    const resultsForClass = useMemo(() => {
        if (!selectedClass || !Array.isArray(examResultsRaw)) return [];
        return examResultsRaw.filter((r: any) => String(r.class) === String(selectedClass));
    }, [examResultsRaw, selectedClass]);

    const { data: students, isLoading: studentsLoading } = useQuery({
        queryKey: ["students-by-class", selectedClass],
        queryFn: async () => {
            const res = await api.get("/students");
            const allStudents = res.data.data ?? [];
            return allStudents.filter((s: any) => s.class === selectedClass);
        },
        enabled: open && !!selectedClass,
    });

    useEffect(() => {
        if (selectedClass) pendingServerHydrationRef.current = true;
    }, [selectedClass]);

    useEffect(() => {
        if (!open) {
            setSelectedClass("");
            setSubjects([{ subject: "Mathematics", maxMarks: 100 }]);
            setStudentMarks([]);
            pendingServerHydrationRef.current = false;
        }
    }, [open]);

    /**
     * 1) When class is chosen: after students + exam results are ready, hydrate from API once.
     * 2) Same class: merging subject columns preserves typed marks (add subject / rename max).
     * Never clear the grid while students query is still loading (avoids wiping marks mid-fetch).
     */
    useLayoutEffect(() => {
        if (!open || !selectedClass) {
            if (!selectedClass) setStudentMarks([]);
            return;
        }

        if (studentsLoading || students === undefined) {
            return;
        }

        if (!students.length) {
            setStudentMarks([]);
            return;
        }

        if (examResultsRaw === undefined && resultsLoading) {
            return;
        }

        if (pendingServerHydrationRef.current) {
            if (resultsFetching) {
                setStudentMarks((prev) => mergeSubjectsIntoStudentMarks(prev, students, subjects));
                return;
            }
            pendingServerHydrationRef.current = false;
            const defs = deriveSubjectDefsFromResults(resultsForClass);
            setSubjects(defs);
            setStudentMarks(buildRowsFromServer(students, defs, resultsForClass));
            return;
        }

        setStudentMarks((prev) => mergeSubjectsIntoStudentMarks(prev, students, subjects));
    }, [
        open,
        selectedClass,
        students,
        subjects,
        studentsLoading,
        resultsLoading,
        resultsFetching,
        examResultsRaw,
        resultsForClass,
    ]);

    const saveMarks = useMutation({
        mutationFn: async (data: any) => {
            const res = await api.post(`/exams/${exam._id}/results`, data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["exam-results", exam._id] });
            toast.success("Marks saved successfully");
            pendingServerHydrationRef.current = true;
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message ?? "Failed to save marks");
        },
    });

    const handleMarksChange = (studentIndex: number, subjectIndex: number, value: string) => {
        setStudentMarks((prev) => {
            const next = prev.map((row) => ({
                ...row,
                subjects: row.subjects.map((s: any) => ({ ...s })),
            }));
            if (next[studentIndex]?.subjects[subjectIndex]) {
                next[studentIndex].subjects[subjectIndex].obtainedMarks = parseMarks(value);
            }
            return next;
        });
    };

    const handleSave = () => {
        const results = studentMarks.map((sm) => ({
            studentId: sm.studentId,
            subjects: sm.subjects.map((s: any) => ({
                subject: s.subject,
                maxMarks: parseMarks(s.maxMarks),
                obtainedMarks: parseMarks(s.obtainedMarks),
            })),
        }));
        saveMarks.mutate({ results });
    };

    const addSubject = () => {
        setSubjects((prev) => [...prev, { subject: "", maxMarks: 100 }]);
    };

    const tableLoading = Boolean(
        selectedClass && (studentsLoading || (examResultsRaw === undefined && resultsLoading))
    );

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
                            <Button type="button" variant="outline" onClick={addSubject} className="w-full">
                                + Add Subject
                            </Button>
                        </div>
                    </div>

                    {subjects.length > 0 && (
                        <div className="space-y-2">
                            <Label>Subjects Configuration</Label>
                            <p className="text-xs text-gray-500">
                                Saved marks load automatically for this class. Add subjects, enter marks, then save — you
                                can save again later; the modal stays open.
                            </p>
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
                            {tableLoading ? (
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
                                                        {sub.subject || "—"} (/{sub.maxMarks})
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {studentMarks.map((sm, sIdx) => (
                                                <tr key={sm.studentId} className="border-t border-gray-100">
                                                    <td className="p-2 text-gray-900">{sm.name}</td>
                                                    {sm.subjects.map((subj: any, subIdx: number) => (
                                                        <td key={subIdx} className="p-2">
                                                            <Input
                                                                type="number"
                                                                className="h-8 w-16 text-center"
                                                                min={0}
                                                                max={subj.maxMarks || 100}
                                                                value={subj.obtainedMarks}
                                                                onChange={(e) =>
                                                                    handleMarksChange(sIdx, subIdx, e.target.value)
                                                                }
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
                        disabled={!selectedClass || saveMarks.isPending || tableLoading}
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
