"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Plus,
    Calendar,
    Loader2,
    Trophy,
    BookOpen,
    Users,
    MoreVertical,
    CheckCircle2,
    Edit,
    Trash2,
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { UserRole } from "@/types";
import { toast } from "sonner";
import { filterExamsByBucket, getExamScheduleBucket } from "@/lib/examSchedule";

export default function ExamsPage() {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const isTeacher = user?.role === UserRole.TEACHER;
    const canDeleteExam = user?.role === UserRole.SCHOOL_ADMIN;
    const [isNewExamOpen, setIsNewExamOpen] = useState(false);
    const [isMarksEntryOpen, setIsMarksEntryOpen] = useState(false);
    const [isMeritListOpen, setIsMeritListOpen] = useState(false);
    const [selectedExam, setSelectedExam] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const { data: examsData, isLoading } = useQuery({
        queryKey: ["exams-list"],
        queryFn: async () => {
            const res = await api.get("/exams");
            return res.data.data;
        }
    });

    const exams = examsData || [];

    const searchedExams = useMemo(() => {
        if (!Array.isArray(exams)) return [];
        const q = searchQuery.trim().toLowerCase();
        if (!q) return exams;
        return exams.filter((e: any) => {
            const t = String(e.title ?? e.name ?? "").toLowerCase();
            return t.includes(q);
        });
    }, [exams, searchQuery]);

    const upcomingList = useMemo(() => filterExamsByBucket(searchedExams, "upcoming"), [searchedExams]);
    const ongoingList = useMemo(() => filterExamsByBucket(searchedExams, "ongoing"), [searchedExams]);
    const completedList = useMemo(() => filterExamsByBucket(searchedExams, "completed"), [searchedExams]);

    const upcomingCount = useMemo(
        () => (Array.isArray(exams) ? exams.filter((e: any) => getExamScheduleBucket(e) === "upcoming").length : 0),
        [exams]
    );
    const ongoingCount = useMemo(
        () => (Array.isArray(exams) ? exams.filter((e: any) => getExamScheduleBucket(e) === "ongoing").length : 0),
        [exams]
    );
    const completedCount = useMemo(
        () => (Array.isArray(exams) ? exams.filter((e: any) => getExamScheduleBucket(e) === "completed").length : 0),
        [exams]
    );
    const deleteExamMutation = useMutation({
        mutationFn: async (examId: string) => {
            await api.delete(`/exams/${examId}`);
        },
        onSuccess: (_data, examId) => {
            queryClient.invalidateQueries({ queryKey: ["exams-list"] });
            toast.success("Exam removed.");
            setSelectedExam((prev: any) => (prev?._id === examId ? null : prev));
        },
        onError: (e: any) => {
            toast.error(e.response?.data?.message ?? "Could not remove exam.");
        },
    });

    const handleRemoveExam = (exam: any) => {
        const title = exam.name ?? exam.title ?? "this exam";
        if (
            !confirm(
                `Remove "${title}"? All entered marks and results for this exam will be permanently deleted. This cannot be undone.`
            )
        ) {
            return;
        }
        deleteExamMutation.mutate(exam._id);
    };

    const renderExamCards = (list: any[], emptyLabel: string) => (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {list.map((exam: any) => (
                <Card key={exam._id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                    <CardHeader className="p-6">
                        <div className="flex items-start justify-between">
                            <Badge className="bg-indigo-100 text-indigo-700 text-xs">{exam.examType ?? exam.type ?? "Exam"}</Badge>
                            {canDeleteExam ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 rounded-lg text-gray-500 hover:bg-gray-100"
                                            aria-label="Exam actions"
                                        >
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                        <DropdownMenuItem
                                            className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700"
                                            onClick={() => handleRemoveExam(exam)}
                                            disabled={deleteExamMutation.isPending}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Remove exam
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : null}
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
            {list.length === 0 && (
                <p className="col-span-full py-8 text-center text-sm text-gray-500">{emptyLabel}</p>
            )}
        </div>
    );

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
                {!isTeacher && (
                    <Button
                        className="bg-indigo-600 hover:bg-indigo-500 gap-2 h-10 rounded-xl w-full sm:w-auto"
                        onClick={() => setIsNewExamOpen(true)}
                    >
                        <Plus className="h-4 w-4" /> New Examination
                    </Button>
                )}
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm border-l-4 border-l-indigo-500">
                    <div className="flex items-center gap-4">
                        <div className="rounded-xl bg-indigo-100 p-3">
                            <BookOpen className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-xs font-medium uppercase text-gray-500">Upcoming</p>
                            <h3 className="mt-0.5 text-2xl font-bold text-gray-900">{upcomingCount}</h3>
                        </div>
                    </div>
                </Card>
                <Card className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm border-l-4 border-l-emerald-500">
                    <div className="flex items-center gap-4">
                        <div className="rounded-xl bg-emerald-100 p-3">
                            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-xs font-medium uppercase text-gray-500">Ongoing</p>
                            <h3 className="mt-0.5 text-2xl font-bold text-gray-900">{ongoingCount}</h3>
                        </div>
                    </div>
                </Card>
                <Card className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm border-l-4 border-l-amber-500">
                    <div className="flex items-center gap-4">
                        <div className="rounded-xl bg-amber-100 p-3">
                            <Users className="h-6 w-6 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-xs font-medium uppercase text-gray-500">Total exams</p>
                            <h3 className="mt-0.5 text-2xl font-bold text-gray-900">{Array.isArray(exams) ? exams.length : 0}</h3>
                            <p className="mt-1 text-[11px] text-gray-500">{completedCount} after end date</p>
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
                            <Input
                                placeholder="Search exam..."
                                className="h-9 border-gray-200 bg-white pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <TabsContent value="upcoming" className="space-y-6 m-0">
                    {isLoading ? (
                        <div className="flex h-64 w-full items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                        </div>
                    ) : (
                        renderExamCards(
                            upcomingList,
                            Array.isArray(exams) && exams.length === 0
                                ? "No exams found. Create one to get started."
                                : "No upcoming exams. Exams before their start date appear here."
                        )
                    )}
                </TabsContent>

                <TabsContent value="ongoing" className="space-y-6 m-0">
                    {isLoading ? (
                        <div className="flex h-64 w-full items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                        </div>
                    ) : (
                        renderExamCards(
                            ongoingList,
                            "No ongoing exams. Exams running within their start and end dates appear here."
                        )
                    )}
                </TabsContent>

                <TabsContent value="completed" className="space-y-6 m-0">
                    {isLoading ? (
                        <div className="flex h-64 w-full items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                        </div>
                    ) : (
                        renderExamCards(
                            completedList,
                            "No completed exams yet. After the end date passes, exams move here."
                        )
                    )}
                </TabsContent>
            </Tabs>

            {!isTeacher && <NewExamModal open={isNewExamOpen} onOpenChange={setIsNewExamOpen} />}
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
