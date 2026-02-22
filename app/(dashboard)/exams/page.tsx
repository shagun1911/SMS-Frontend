"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    FileText,
    Plus,
    Calendar,
    Loader2,
    Trophy,
    BookOpen,
    Users,
    MoreVertical,
    CheckCircle2,
    Edit
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NewExamModal } from "@/components/exams/new-exam-modal";
import { MarksEntryModal } from "@/components/exams/marks-entry-modal";
import { MeritListModal } from "@/components/exams/merit-list-modal";
import { LockedFeatureGate } from "@/components/plan/locked-feature-gate";
import api from "@/lib/api";

export default function ExamsPage() {
    const [isNewExamOpen, setIsNewExamOpen] = useState(false);
    const [isMarksEntryOpen, setIsMarksEntryOpen] = useState(false);
    const [isMeritListOpen, setIsMeritListOpen] = useState(false);
    const [selectedExam, setSelectedExam] = useState<any>(null);

    const { data: examsData, isLoading } = useQuery({
        queryKey: ["exams-list"],
        queryFn: async () => {
            const res = await api.get("/exams");
            return res.data.data;
        }
    });

    const exams = examsData || [];

    return (
        <LockedFeatureGate featureKey="exams" featureLabel="Exams & results">
        <div className="flex-1 space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
                        Academic Examinations
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Schedule assessments, manage date-sheets, and publish results.
                    </p>
                </div>
                <Button 
                    className="bg-indigo-600 hover:bg-indigo-500 gap-2 h-10 rounded-xl w-full sm:w-auto"
                    onClick={() => setIsNewExamOpen(true)}
                >
                    <Plus className="h-4 w-4" /> New Examination
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm border-l-4 border-l-indigo-500">
                    <div className="flex items-center gap-4">
                        <div className="rounded-xl bg-indigo-100 p-3">
                            <BookOpen className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-xs font-medium uppercase text-gray-500">Active Assessments</p>
                            <h3 className="mt-0.5 text-2xl font-bold text-gray-900">{Array.isArray(exams) ? exams.filter((e: any) => e.status === "scheduled" || e.status === "upcoming").length : 0}</h3>
                        </div>
                    </div>
                </Card>
                <Card className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm border-l-4 border-l-emerald-500">
                    <div className="flex items-center gap-4">
                        <div className="rounded-xl bg-emerald-100 p-3">
                            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-xs font-medium uppercase text-gray-500">Results Published</p>
                            <h3 className="mt-0.5 text-2xl font-bold text-gray-900">{Array.isArray(exams) ? exams.filter((e: any) => e.status === "completed").length : 0}</h3>
                        </div>
                    </div>
                </Card>
                <Card className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm border-l-4 border-l-amber-500">
                    <div className="flex items-center gap-4">
                        <div className="rounded-xl bg-amber-100 p-3">
                            <Users className="h-6 w-6 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-xs font-medium uppercase text-gray-500">Exams</p>
                            <h3 className="mt-0.5 text-2xl font-bold text-gray-900">{Array.isArray(exams) ? exams.length : 0}</h3>
                        </div>
                    </div>
                </Card>
            </div>

            <Tabs defaultValue="upcoming" className="space-y-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-gray-200 bg-white p-1.5">
                    <TabsList className="gap-2 border-0 bg-transparent w-full sm:w-auto">
                        <TabsTrigger value="upcoming" className="data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-700 rounded-xl px-3 sm:px-5 h-9 text-xs font-medium flex-1 sm:flex-none">Upcoming</TabsTrigger>
                        <TabsTrigger value="ongoing" className="data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-700 rounded-xl px-3 sm:px-5 h-9 text-xs font-medium flex-1 sm:flex-none">Ongoing</TabsTrigger>
                        <TabsTrigger value="completed" className="data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-700 rounded-xl px-3 sm:px-5 h-9 text-xs font-medium flex-1 sm:flex-none">Completed</TabsTrigger>
                    </TabsList>
                    <div className="flex items-center gap-3 px-2">
                        <div className="relative w-full sm:w-48">
                            <Input placeholder="Search exam..." className="h-9 border-gray-200 bg-white pl-9" />
                        </div>
                    </div>
                </div>

                <TabsContent value="upcoming" className="space-y-6 m-0">
                    {isLoading ? (
                        <div className="flex h-64 w-full items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {(Array.isArray(exams) && exams.length > 0 ? exams : []).map((exam: any) => (
                                <Card key={exam._id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                                    <CardHeader className="p-6">
                                        <div className="flex items-start justify-between">
                                            <Badge className="bg-indigo-100 text-indigo-700 text-xs">{exam.examType ?? "Exam"}</Badge>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-gray-500 hover:bg-gray-100">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <CardTitle className="mt-4 text-lg font-semibold text-gray-900">{exam.name ?? exam.title ?? "Examination"}</CardTitle>
                                        <CardDescription className="mt-1 text-xs text-gray-500">{exam.classId ?? exam.class ?? "—"}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-6 pt-0">
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3 text-xs text-gray-600">
                                                <Calendar className="h-4 w-4 text-indigo-500" />
                                                {exam.startDate && exam.endDate
                                                    ? `${new Date(exam.startDate).toLocaleDateString()} – ${new Date(exam.endDate).toLocaleDateString()}`
                                                    : "—"}
                                            </div>
                                            <div className="pt-4 flex gap-2 border-t border-gray-100">
                                                <Button 
                                                    size="sm" 
                                                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-xs gap-1"
                                                    onClick={() => {
                                                        setSelectedExam(exam);
                                                        setIsMarksEntryOpen(true);
                                                    }}
                                                >
                                                    <Edit className="h-3 w-3" /> Enter Marks
                                                </Button>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    className="text-xs border-gray-200"
                                                    onClick={() => {
                                                        setSelectedExam(exam);
                                                        setIsMeritListOpen(true);
                                                    }}
                                                >
                                                    <Trophy className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                            {(!exams || exams.length === 0) && (
                                <p className="col-span-full py-8 text-center text-sm text-gray-500">No exams found. Create one to get started.</p>
                            )}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            <NewExamModal open={isNewExamOpen} onOpenChange={setIsNewExamOpen} />
            {selectedExam && (
                <>
                    <MarksEntryModal 
                        exam={selectedExam}
                        open={isMarksEntryOpen}
                        onOpenChange={setIsMarksEntryOpen}
                    />
                    <MeritListModal 
                        exam={selectedExam}
                        open={isMeritListOpen}
                        onOpenChange={setIsMeritListOpen}
                    />
                </>
            )}
        </div>
        </LockedFeatureGate>
    );
}
