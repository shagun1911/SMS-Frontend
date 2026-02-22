"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
    BookOpen, Plus, Users, Loader2, Edit2, Trash2, ChevronRight,
    ArrowLeft, Search, GraduationCap, Phone, Mail, IndianRupee, X,
    FileDown, IdCard,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import api from "@/lib/api";
import { LockedFeatureGate } from "@/components/plan/locked-feature-gate";

const SECTIONS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function ClassesPage() {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClass, setEditingClass] = useState<any>(null);
    const [className, setClassName] = useState("");
    const [section, setSection] = useState("A");
    const [roomNumber, setRoomNumber] = useState("");
    const [capacity, setCapacity] = useState("");
    const [selectedClass, setSelectedClass] = useState<any>(null);

    const { data: classes, isLoading } = useQuery({
        queryKey: ["classes-list"],
        queryFn: async () => {
            const res = await api.get("/classes");
            return res.data.data ?? [];
        },
    });

    const createClass = useMutation({
        mutationFn: async (data: any) => (await api.post("/classes", data)).data,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["classes-list"] });
            toast.success("Class created successfully");
            resetForm();
            setIsModalOpen(false);
        },
        onError: (err: any) => toast.error(err.response?.data?.message ?? "Failed to create class"),
    });

    const updateClass = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => (await api.patch(`/classes/${id}`, data)).data,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["classes-list"] });
            toast.success("Class updated successfully");
            resetForm();
            setIsModalOpen(false);
        },
        onError: (err: any) => toast.error(err.response?.data?.message ?? "Failed to update class"),
    });

    const deleteClass = useMutation({
        mutationFn: async (id: string) => { await api.delete(`/classes/${id}`); },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["classes-list"] });
            toast.success("Class deleted successfully");
        },
        onError: (err: any) => toast.error(err.response?.data?.message ?? "Failed to delete class"),
    });

    const resetForm = () => { setClassName(""); setSection("A"); setRoomNumber(""); setCapacity(""); setEditingClass(null); };

    const handleOpenModal = (cls?: any) => {
        if (cls) {
            setEditingClass(cls);
            setClassName(cls.className ?? "");
            setSection(cls.section ?? "A");
            setRoomNumber(cls.roomNumber ?? "");
            setCapacity(cls.capacity?.toString() ?? "");
        } else { resetForm(); }
        setIsModalOpen(true);
    };

    const handleSubmit = () => {
        const payload = {
            className, section,
            roomNumber: roomNumber || undefined,
            capacity: capacity ? Number(capacity) : undefined,
        };
        if (editingClass) updateClass.mutate({ id: editingClass._id, data: payload });
        else createClass.mutate(payload);
    };

    if (selectedClass) {
        return (
            <LockedFeatureGate featureKey="classes" featureLabel="Classes & sections">
                <ClassDetailView
                    classData={selectedClass}
                    onBack={() => setSelectedClass(null)}
                />
            </LockedFeatureGate>
        );
    }

    return (
        <LockedFeatureGate featureKey="classes" featureLabel="Classes & sections">
            <div className="flex-1 space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">Classes & Sections</h2>
                        <p className="mt-1 text-sm text-gray-500">Manage classes, sections, and view student rosters.</p>
                    </div>
                    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 bg-indigo-600 hover:bg-indigo-500 w-full sm:w-auto" onClick={() => handleOpenModal()}>
                                <Plus className="h-4 w-4" /> Add Class & Section
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                            <DialogHeader>
                                <DialogTitle>{editingClass ? "Edit Class" : "Add New Class & Section"}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Class Name</Label>
                                    <Input placeholder="e.g. 4, V, X" value={className} onChange={(e) => setClassName(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Section</Label>
                                    <select value={section} onChange={(e) => setSection(e.target.value)}
                                        className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                        {SECTIONS.map((s) => (<option key={s} value={s}>Section {s}</option>))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Room Number (Optional)</Label>
                                        <Input placeholder="e.g. 101" value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Capacity (Optional)</Label>
                                        <Input type="number" placeholder="e.g. 40" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                                <Button className="flex-1 bg-indigo-600 hover:bg-indigo-500" onClick={handleSubmit}
                                    disabled={!className.trim() || createClass.isPending || updateClass.isPending}>
                                    {createClass.isPending || updateClass.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : editingClass ? "Update" : "Create"}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {isLoading ? (
                    <div className="flex h-64 items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {Array.isArray(classes) && classes.length > 0 ? (
                            classes.map((cls: any) => {
                                const sec = cls.section ?? cls.sections?.[0] ?? "A";
                                return (
                                    <Card
                                        key={cls._id}
                                        className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md hover:border-indigo-200 cursor-pointer group"
                                        onClick={() => setSelectedClass(cls)}
                                    >
                                        <CardHeader className="border-b border-gray-100 bg-gradient-to-br from-indigo-50 to-white p-5">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 group-hover:bg-indigo-200 transition-colors">
                                                        <BookOpen className="h-5 w-5 text-indigo-600" />
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-lg font-bold text-gray-900">
                                                            Class {cls.className} – {sec}
                                                        </CardTitle>
                                                        {cls.roomNumber && <p className="text-xs text-gray-500">Room {cls.roomNumber}</p>}
                                                    </div>
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-indigo-600" onClick={() => handleOpenModal(cls)}>
                                                        <Edit2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600"
                                                        onClick={() => { if (confirm(`Delete Class ${cls.className} Section ${sec}?`)) deleteClass.mutate(cls._id); }}>
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Users className="h-4 w-4" />
                                                {cls.capacity ? `Capacity: ${cls.capacity}` : "View students"}
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                                        </CardContent>
                                    </Card>
                                );
                            })
                        ) : (
                            <div className="col-span-full rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
                                <BookOpen className="mx-auto h-12 w-12 text-gray-300" />
                                <p className="mt-4 text-sm font-medium text-gray-600">No classes configured yet</p>
                                <p className="mt-1 text-xs text-gray-500">Add Class & Section to get started</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </LockedFeatureGate>
    );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   CLASS DETAIL VIEW — Full student roster
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function ClassDetailView({ classData, onBack }: { classData: any; onBack: () => void }) {
    const [search, setSearch] = useState("");
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const sec = classData.section ?? classData.sections?.[0] ?? "A";

    const { data: students, isLoading } = useQuery({
        queryKey: ["class-students", classData._id],
        queryFn: async () => {
            const res = await api.get(`/classes/${classData._id}/students`);
            return res.data.data ?? [];
        },
    });

    const filtered = (students ?? []).filter((s: any) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
            s.admissionNumber?.toLowerCase().includes(q) ||
            s.phone?.includes(q);
    });

    const fmt = (n: number) => `₹${(n || 0).toLocaleString("en-IN")}`;

    if (selectedStudent) {
        return (
            <StudentProfileView
                student={selectedStudent}
                classData={classData}
                onBack={() => setSelectedStudent(null)}
            />
        );
    }

    return (
        <div className="space-y-5">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={onBack}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Class {classData.className} – Section {sec}</h2>
                    <p className="text-sm text-gray-500">{students?.length ?? 0} students {classData.roomNumber ? `· Room ${classData.roomNumber}` : ""}</p>
                </div>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input placeholder="Search by name, admission no, phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10 rounded-xl" />
            </div>

            {isLoading ? (
                <div className="flex h-48 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-indigo-500" /></div>
            ) : filtered.length === 0 ? (
                <Card className="p-12 text-center">
                    <GraduationCap className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                    <p className="text-sm text-gray-500">{students?.length === 0 ? "No students in this class yet." : "No students match your search."}</p>
                </Card>
            ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((s: any) => (
                        <Card
                            key={s._id}
                            className="p-4 cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all group"
                            onClick={() => setSelectedStudent(s)}
                        >
                            <div className="flex items-start gap-3">
                                <Avatar className="h-11 w-11 border border-gray-200">
                                    <AvatarImage src={s.photo} />
                                    <AvatarFallback className="bg-indigo-50 text-indigo-600 font-bold text-sm">
                                        {s.firstName?.[0]}{s.lastName?.[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-900 text-sm group-hover:text-indigo-600 transition-colors truncate">
                                        {s.firstName} {s.lastName}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">{s.admissionNumber}</p>
                                    <div className="flex items-center gap-3 mt-2">
                                        {s.phone && (
                                            <span className="flex items-center gap-1 text-[11px] text-gray-400">
                                                <Phone className="h-3 w-3" /> {s.phone}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    {s.dueAmount > 0 ? (
                                        <Badge variant="outline" className="text-[10px] bg-rose-50 text-rose-600 border-rose-200">
                                            Due {fmt(s.dueAmount)}
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-600 border-emerald-200">
                                            Paid
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   STUDENT PROFILE VIEW — Full history from class context
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function StudentProfileView({ student, classData, onBack }: { student: any; classData: any; onBack: () => void }) {
    const sec = classData.section ?? classData.sections?.[0] ?? "A";

    const { data: examResults, isLoading: resultsLoading } = useQuery({
        queryKey: ["student-exam-results", student._id],
        queryFn: async () => {
            const examsRes = await api.get("/exams");
            const exams = examsRes.data?.data ?? [];
            const allResults: any[] = [];
            for (const exam of exams) {
                try {
                    const res = await api.get(`/exams/${exam._id}/results`);
                    const results = res.data?.data ?? [];
                    const match = results.find((r: any) => {
                        const sid = r.studentId?._id || r.studentId;
                        return sid === student._id;
                    });
                    if (match) {
                        allResults.push({ ...match, examTitle: exam.title, examType: exam.type, examDate: exam.startDate });
                    }
                } catch { /* skip */ }
            }
            return allResults;
        },
    });

    const { data: feePayments, isLoading: paymentsLoading } = useQuery({
        queryKey: ["student-payments", student._id],
        queryFn: async () => {
            const res = await api.get("/fees/payments", { params: { studentId: student._id } });
            return res.data?.data ?? [];
        },
    });

    const fmt = (n: number) => `₹${(n || 0).toLocaleString("en-IN")}`;
    const results = examResults ?? [];
    const payments = feePayments ?? [];

    const overallPercentage = results.length > 0
        ? (results.reduce((s: number, r: any) => s + (r.percentage || 0), 0) / results.length).toFixed(1)
        : null;

    const handleDownloadReportCard = async () => {
        try {
            const res = await api.get(`/exams/report-card/${student._id}`, { responseType: "blob" });
            const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
            const a = document.createElement("a");
            a.href = url;
            a.download = `report-card-${student.firstName}-${student.lastName}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            const { toast } = await import("sonner");
            toast.error("No exam results found to generate report card");
        }
    };

    const handleDownloadIdCard = async () => {
        try {
            const res = await api.get(`/students/${student._id}/id-card`, { responseType: "blob" });
            const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
            const a = document.createElement("a");
            a.href = url;
            a.download = `id-card-${student.firstName}-${student.lastName}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            const { toast } = await import("sonner");
            toast.error("Failed to generate ID card");
        }
    };

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl shrink-0" onClick={onBack}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <Avatar className="h-11 w-11 sm:h-14 sm:w-14 border-2 border-gray-200 shrink-0">
                        <AvatarImage src={student.photo} />
                        <AvatarFallback className="bg-indigo-100 text-indigo-600 font-bold text-sm sm:text-lg">
                            {student.firstName?.[0]}{student.lastName?.[0]}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                        <h2 className="text-base sm:text-xl font-bold text-gray-900 truncate">{student.firstName} {student.lastName}</h2>
                        <p className="text-xs sm:text-sm text-gray-500 truncate">
                            {student.admissionNumber} · Class {classData.className}-{sec}
                            {student.fatherName && ` · S/o ${student.fatherName}`}
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 pl-12 sm:pl-0 shrink-0">
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleDownloadIdCard}>
                        <IdCard className="h-3.5 w-3.5" /> ID Card
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleDownloadReportCard}>
                        <FileDown className="h-3.5 w-3.5" /> Report Card
                    </Button>
                    <Link href={`/students`}>
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                            Full Profile <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard label="Total Fee" value={fmt(student.totalYearlyFee)} color="blue" />
                <StatCard label="Paid" value={fmt(student.paidAmount)} color="emerald" />
                <StatCard label="Due" value={fmt(student.dueAmount)} color={student.dueAmount > 0 ? "rose" : "emerald"} />
                <StatCard label="Avg. Score" value={overallPercentage ? `${overallPercentage}%` : "—"} color="purple" />
            </div>

            {/* Contact */}
            <Card className="p-4">
                <div className="flex flex-wrap gap-4 text-sm">
                    {student.phone && <span className="flex items-center gap-1.5 text-gray-600"><Phone className="h-3.5 w-3.5 text-gray-400" /> {student.phone}</span>}
                    {student.email && <span className="flex items-center gap-1.5 text-gray-600"><Mail className="h-3.5 w-3.5 text-gray-400" /> {student.email}</span>}
                    {student.fatherName && <span className="text-gray-600">Father: <strong>{student.fatherName}</strong></span>}
                    {student.motherName && <span className="text-gray-600">Mother: <strong>{student.motherName}</strong></span>}
                </div>
            </Card>

            {/* Exam Results */}
            <div>
                <h3 className="text-base font-semibold text-gray-900 mb-3">Exam Results</h3>
                {resultsLoading ? (
                    <div className="flex h-24 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
                ) : results.length === 0 ? (
                    <Card className="p-8 text-center">
                        <p className="text-sm text-gray-500">No exam results found for this student.</p>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {results.map((r: any, i: number) => (
                            <Card key={i} className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <p className="font-semibold text-sm text-gray-900">{r.examTitle || "Exam"}</p>
                                        <p className="text-xs text-gray-500">{r.examType} {r.examDate ? `· ${new Date(r.examDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}` : ""}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-gray-900">{r.percentage?.toFixed(1)}%</p>
                                        <Badge variant="outline" className={`text-[10px] ${
                                            r.grade === "A+" || r.grade === "A" ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                                            r.grade === "B+" || r.grade === "B" ? "bg-blue-50 text-blue-600 border-blue-200" :
                                            r.grade === "C" ? "bg-amber-50 text-amber-600 border-amber-200" :
                                            "bg-rose-50 text-rose-600 border-rose-200"
                                        }`}>
                                            Grade {r.grade}
                                        </Badge>
                                    </div>
                                </div>
                                {r.subjects && r.subjects.length > 0 && (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                                        {r.subjects.map((sub: any, j: number) => {
                                            const pct = sub.maxMarks > 0 ? (sub.obtainedMarks / sub.maxMarks) * 100 : 0;
                                            return (
                                                <div key={j} className="rounded-lg bg-gray-50 px-3 py-2">
                                                    <p className="text-[11px] text-gray-500 truncate">{sub.subject}</p>
                                                    <p className="text-sm font-semibold text-gray-900">
                                                        {sub.obtainedMarks}/{sub.maxMarks}
                                                        <span className={`text-xs ml-1 ${pct >= 60 ? "text-emerald-500" : pct >= 40 ? "text-amber-500" : "text-rose-500"}`}>
                                                            ({pct.toFixed(0)}%)
                                                        </span>
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Fee Payments */}
            <div>
                <h3 className="text-base font-semibold text-gray-900 mb-3">Fee Payments</h3>
                {paymentsLoading ? (
                    <div className="flex h-24 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
                ) : payments.length === 0 ? (
                    <Card className="p-8 text-center">
                        <p className="text-sm text-gray-500">No payment records found.</p>
                    </Card>
                ) : (
                    <Card className="overflow-hidden">
                        <div className="overflow-x-auto">
                        <table className="w-full text-sm min-w-[400px]">
                            <thead>
                                <tr className="border-b bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                                    <th className="px-4 py-2.5 text-left">Date</th>
                                    <th className="px-4 py-2.5 text-right">Amount</th>
                                    <th className="px-4 py-2.5 text-left">Mode</th>
                                    <th className="px-4 py-2.5 text-left">Receipt</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.slice(0, 20).map((p: any, i: number) => (
                                    <tr key={i} className="border-b last:border-0 hover:bg-gray-50/50">
                                        <td className="px-4 py-2.5 text-gray-600">
                                            {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-semibold text-emerald-600">{fmt(p.amountPaid)}</td>
                                        <td className="px-4 py-2.5 capitalize text-gray-500">{p.paymentMode || "—"}</td>
                                        <td className="px-4 py-2.5 text-xs text-gray-400">{p.receiptNumber || "—"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
    const colorMap: Record<string, string> = {
        blue: "bg-blue-50 text-blue-700",
        emerald: "bg-emerald-50 text-emerald-700",
        rose: "bg-rose-50 text-rose-700",
        purple: "bg-purple-50 text-purple-700",
    };
    return (
        <Card className="p-3.5">
            <p className="text-[11px] text-gray-500 uppercase tracking-wider">{label}</p>
            <p className={`text-lg font-bold mt-0.5 ${colorMap[color] ? colorMap[color].split(" ")[1] : "text-gray-900"}`}>{value}</p>
        </Card>
    );
}
