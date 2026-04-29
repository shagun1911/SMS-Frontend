"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, Download, Printer, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LockedFeatureGate } from "@/components/plan/locked-feature-gate";
import api from "@/lib/api";

type GeneratedQuestion = {
    questionNumber: number;
    question: string;
    type: "objective" | "subjective";
    difficulty: "easy" | "medium" | "hard";
    marks: number;
    options?: string[];
    answerKey?: string;
    solution?: string;
};

type GeneratedPaper = {
    title: string;
    meta: {
        className: string;
        subject: string;
        chapter: string;
        targetExam: string;
        questionType: string;
        difficultyLevel: string;
        totalQuestions: number;
        totalMarks: number;
        durationMinutes: number;
    };
    instructions: string[];
    questions: GeneratedQuestion[];
};

const CLASS_OPTIONS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

function defaultSubjectsByClass(className: string): string[] {
    const classNum = Number(className);
    if (Number.isFinite(classNum) && classNum <= 5) return ["English", "Hindi", "Maths", "Science", "EVS"];
    if (Number.isFinite(classNum) && classNum <= 10) return ["Physics", "Chemistry", "Biology", "Maths", "Science"];
    return ["Physics", "Chemistry", "Maths", "Biology"];
}
type MetaResponse = {
    subjects: string[];
    targetExamOptions: string[];
    chapters: string[];
    topicsByChapter: Record<string, string[]>;
};

function getErrorMessage(error: unknown, fallback: string): string {
    if (typeof error === "object" && error !== null && "response" in error) {
        const response = (error as { response?: { data?: { message?: string } } }).response;
        const msg = response?.data?.message;
        if (msg) return msg;
    }
    return fallback;
}

export default function TestPaperPage() {
    const [className, setClassName] = useState("10");
    const [subject, setSubject] = useState(defaultSubjectsByClass("10")[0]);
    const [targetExam, setTargetExam] = useState("boards");
    const [seniorTrack, setSeniorTrack] = useState("boards");
    const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
    const [activeChapterForTopic, setActiveChapterForTopic] = useState("");
    const [includeWholeChapter, setIncludeWholeChapter] = useState(false);
    const [topicsByChapterSelection, setTopicsByChapterSelection] = useState<Record<string, string[]>>({});
    const [customTopic, setCustomTopic] = useState("");
    const [questionType, setQuestionType] = useState("mixed");
    const [examPattern, setExamPattern] = useState("mixed");
    const [coachingStyles, setCoachingStyles] = useState<string[]>([]);
    const [questionCount, setQuestionCount] = useState(20);
    const [customQuestionCount, setCustomQuestionCount] = useState(20);
    const [difficultyLevel, setDifficultyLevel] = useState("medium");
    const [durationMinutes, setDurationMinutes] = useState(60);
    const [marksPerQuestion, setMarksPerQuestion] = useState(1);
    const [includePreviousYear, setIncludePreviousYear] = useState(true);
    const [prioritizeRepeated, setPrioritizeRepeated] = useState(true);
    const [specialInstructions, setSpecialInstructions] = useState("");
    const [paper, setPaper] = useState<GeneratedPaper | null>(null);
    const { data: metaData } = useQuery({
        queryKey: ["test-paper-meta", targetExam, className, subject],
        queryFn: async () => {
            const res = await api.get("/test-papers/meta", { params: { examType: targetExam, className, subject } });
            return (res.data?.data || { subjects: [], targetExamOptions: ["boards"], chapters: [], topicsByChapter: {} }) as MetaResponse;
        },
        enabled: Boolean(className),
    });

    const availableSubjects = useMemo(() => {
        const fromApi = metaData?.subjects || [];
        return fromApi.length ? fromApi : defaultSubjectsByClass(className);
    }, [metaData?.subjects, className]);
    const targetExamOptions = useMemo(() => metaData?.targetExamOptions || ["boards"], [metaData?.targetExamOptions]);
    const availableChapters = useMemo(() => metaData?.chapters || [], [metaData?.chapters]);
    const effectiveSubject = availableSubjects.includes(subject) ? subject : (availableSubjects[0] || subject);
    const effectiveTargetExam = targetExamOptions.includes(targetExam) ? targetExam : (targetExamOptions[0] || targetExam);
    const effectiveChapters = useMemo(() => {
        const selected = selectedChapters.filter((c) => availableChapters.includes(c));
        if (selected.length) return selected;
        if (availableChapters.length) return [availableChapters[0]];
        return [];
    }, [selectedChapters, availableChapters]);
    const effectiveChapter = effectiveChapters[0] || "";
    const activeChapter = effectiveChapters.includes(activeChapterForTopic)
        ? activeChapterForTopic
        : (effectiveChapters[0] || "");
    const availableTopics = useMemo(
        () => (activeChapter ? metaData?.topicsByChapter?.[activeChapter] || [] : []),
        [activeChapter, metaData]
    );
    const isSeniorClass = useMemo(() => Number(className) >= 11, [className]);
    const selectedTopicsForActiveChapter = topicsByChapterSelection[activeChapter] || [];
    const resolvedTopicsByChapter = includeWholeChapter ? {} : topicsByChapterSelection;
    const resolvedTopicForGeneration = includeWholeChapter
        ? ""
        : Object.values(resolvedTopicsByChapter).flat().join(", ") || customTopic;

    const generateMutation = useMutation({
        mutationFn: async () => {
            const payload = {
                className,
                subject: effectiveSubject,
                chapter: effectiveChapter,
                chapters: effectiveChapters,
                includeWholeChapter,
                topics: resolvedTopicForGeneration,
                topicsByChapter: resolvedTopicsByChapter,
                questionType,
                examPattern,
                coachingStyles,
                questionCount: questionCount === -1 ? customQuestionCount : questionCount,
                difficultyLevel,
                targetExam: effectiveTargetExam,
                seniorTrack: isSeniorClass ? seniorTrack : undefined,
                includePreviousYear,
                prioritizeRepeated,
                durationMinutes,
                marksPerQuestion,
                specialInstructions,
            };
            const res = await api.post("/test-papers/generate", payload);
            return res.data?.data as GeneratedPaper;
        },
        onSuccess: (data) => {
            setPaper(data);
            toast.success("Test paper generated");
        },
        onError: (err: unknown) => {
            toast.error(getErrorMessage(err, "Failed to generate test paper"));
        },
    });

    const downloadPdfMutation = useMutation({
        mutationFn: async () => {
            if (!paper) return;
            const res = await api.post(
                "/test-papers/download-pdf",
                { paper },
                { responseType: "blob" }
            );
            const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
            const a = document.createElement("a");
            a.href = url;
            a.download = "test-paper.pdf";
            a.click();
            URL.revokeObjectURL(url);
        },
        onError: () => toast.error("Could not download PDF"),
    });

    const printPdfMutation = useMutation({
        mutationFn: async () => {
            if (!paper) return;
            const res = await api.post(
                "/test-papers/download-pdf",
                { paper },
                { responseType: "blob" }
            );
            const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
            const w = window.open(url, "_blank");
            if (!w) throw new Error("Popup blocked");
        },
        onError: () => toast.error("Could not open printable PDF"),
    });

    return (
        <LockedFeatureGate featureKey="exams" featureLabel="Test paper generator">
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">Create Test Paper</h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Build high-quality objective/subjective papers for Boards, JEE, and NEET.
                    </p>
                </div>

                <Card className="rounded-2xl border border-gray-200">
                    <CardHeader>
                        <CardTitle>Paper Setup</CardTitle>
                        <CardDescription>Choose class, exam style, chapter focus, and paper difficulty.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <div className="space-y-2">
                                <Label>Class</Label>
                                <select
                                    className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm"
                                    value={className}
                                    onChange={(e) => {
                                        const nextClass = e.target.value;
                                        setClassName(nextClass);
                                        const nextDefaultSubject = defaultSubjectsByClass(nextClass)[0] || "";
                                        setSubject(nextDefaultSubject);
                                        setSelectedChapters([]);
                                        setActiveChapterForTopic("");
                                        setTopicsByChapterSelection({});
                                        setCustomTopic("");
                                    }}
                                >
                                    {CLASS_OPTIONS.map((c) => (
                                        <option key={c} value={c}>
                                            Class {c}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Subject</Label>
                                <select className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm" value={effectiveSubject} onChange={(e) => setSubject(e.target.value)}>
                                    {availableSubjects.map((s) => (
                                        <option key={s} value={s}>
                                            {s}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Target Exam</Label>
                                <select className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm" value={effectiveTargetExam} onChange={(e) => setTargetExam(e.target.value)}>
                                    {targetExamOptions.map((examOption) => (
                                        <option key={examOption} value={examOption}>
                                            {examOption.toUpperCase()}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Question Count</Label>
                                <select className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm" value={questionCount} onChange={(e) => setQuestionCount(Number(e.target.value))}>
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={30}>30</option>
                                    <option value={40}>40</option>
                                    <option value={-1}>Custom</option>
                                </select>
                            </div>
                        </div>
                        {questionCount === -1 && (
                            <div className="space-y-2 md:w-64">
                                <Label>Custom Question Count</Label>
                                <Input type="number" min={1} max={100} value={customQuestionCount} onChange={(e) => setCustomQuestionCount(Number(e.target.value || 20))} />
                            </div>
                        )}

                        {isSeniorClass && (
                            <div className="space-y-2">
                                <Label>Class 11/12 Track</Label>
                                <select className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm md:w-80" value={seniorTrack} onChange={(e) => setSeniorTrack(e.target.value)}>
                                    <option value="boards">Normal 11-12 Boards</option>
                                    <option value="competitive">JEE/NEET Competitive</option>
                                </select>
                            </div>
                        )}

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Chapters (Select one or more)</Label>
                                <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 p-3 space-y-2">
                                    {availableChapters.map((c) => (
                                        <label key={c} className="flex items-center gap-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={effectiveChapters.includes(c)}
                                                onChange={(e) => {
                                                    setSelectedChapters((prev) =>
                                                        e.target.checked ? [...new Set([...prev, c])] : prev.filter((x) => x !== c)
                                                    );
                                                    setActiveChapterForTopic(c);
                                                }}
                                            />
                                            {c}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Difficulty Level</Label>
                                <select className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm" value={difficultyLevel} onChange={(e) => setDifficultyLevel(e.target.value)}>
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                    <option value="mixed">Mixed</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label>Question Style</Label>
                                <select className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm" value={questionType} onChange={(e) => setQuestionType(e.target.value)}>
                                    <option value="objective">Objective</option>
                                    <option value="subjective">Subjective</option>
                                    <option value="mixed">Mixed</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Exam Pattern</Label>
                                <select className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm" value={examPattern} onChange={(e) => setExamPattern(e.target.value)}>
                                    <option value="pyq">PYQ-based</option>
                                    <option value="conceptual">Conceptual</option>
                                    <option value="mixed">Mixed</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Duration (minutes)</Label>
                                <Input type="number" min={10} value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value || 60))} />
                            </div>
                            <div className="space-y-2">
                                <Label>Marks / Question</Label>
                                <Input type="number" min={1} value={marksPerQuestion} onChange={(e) => setMarksPerQuestion(Number(e.target.value || 1))} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Chapter Coverage</Label>
                            <div className="flex flex-wrap items-center gap-4 text-sm">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={includeWholeChapter}
                                        onChange={(e) => {
                                            const next = e.target.checked;
                                            setIncludeWholeChapter(next);
                                            if (next) {
                                                setTopicsByChapterSelection({});
                                                setCustomTopic("");
                                            }
                                        }}
                                    />
                                    Complete chapter
                                </label>
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" checked={includePreviousYear} onChange={(e) => setIncludePreviousYear(e.target.checked)} />
                                    Include previous-year style
                                </label>
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" checked={prioritizeRepeated} onChange={(e) => setPrioritizeRepeated(e.target.checked)} />
                                    Prioritize repeated/hot questions
                                </label>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Coaching-Level Style</Label>
                            <div className="flex flex-wrap items-center gap-4 text-sm">
                                {["allen", "fiitjee", "aakash"].map((style) => (
                                    <label key={style} className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={coachingStyles.includes(style)}
                                            onChange={(e) => {
                                                setCoachingStyles((prev) =>
                                                    e.target.checked ? [...prev, style] : prev.filter((s) => s !== style)
                                                );
                                            }}
                                        />
                                        {style.toUpperCase()} style
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Topic</Label>
                            <div className="grid gap-2 md:grid-cols-2">
                                <select
                                    className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm"
                                    value={activeChapter}
                                    onChange={(e) => setActiveChapterForTopic(e.target.value)}
                                    disabled={effectiveChapters.length === 0}
                                >
                                    <option value="">Select chapter for topic</option>
                                    {effectiveChapters.map((c) => (
                                        <option key={c} value={c}>
                                            {c}
                                        </option>
                                    ))}
                                </select>
                                {availableTopics.length > 0 ? (
                                    <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-200 p-2 space-y-1">
                                        {availableTopics.map((topic) => (
                                            <label key={topic} className="flex items-center gap-2 text-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedTopicsForActiveChapter.includes(topic)}
                                                    disabled={includeWholeChapter}
                                                    onChange={(e) => {
                                                        setTopicsByChapterSelection((prev) => {
                                                            const existing = prev[activeChapter] || [];
                                                            const updated = e.target.checked
                                                                ? [...new Set([...existing, topic])]
                                                                : existing.filter((x) => x !== topic);
                                                            return { ...prev, [activeChapter]: updated };
                                                        });
                                                    }}
                                                />
                                                {topic}
                                            </label>
                                        ))}
                                    </div>
                                ) : (
                                    <Input placeholder="No predefined topic list" value="" disabled onChange={() => undefined} />
                                )}
                            </div>
                            {!includeWholeChapter && (
                                <Input
                                    placeholder="Optional custom topic (if not listed)"
                                    value={customTopic}
                                    onChange={(e) => setCustomTopic(e.target.value)}
                                />
                            )}
                            <p className="text-xs text-gray-500">
                                {includeWholeChapter
                                    ? "Complete chapter is enabled. Turn it off to select topic-specific paper."
                                    : availableTopics.length > 0
                                        ? "Select one or more topics from selected chapter(s)."
                                        : "No topics in this chapter yet. Type a custom topic manually."}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label>Special Instructions (optional)</Label>
                            <textarea
                                className="min-h-20 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                                placeholder="Example: keep 30% assertion-reason questions and include one HOTS case study."
                                value={specialInstructions}
                                onChange={(e) => setSpecialInstructions(e.target.value)}
                            />
                        </div>

                        <Button
                            className="bg-indigo-600 hover:bg-indigo-500 gap-2"
                            onClick={() => {
                                if (!effectiveSubject.trim() || !effectiveChapters.length) {
                                    toast.error("Please add subject and at least one chapter");
                                    return;
                                }
                                generateMutation.mutate();
                            }}
                            disabled={generateMutation.isPending}
                        >
                            {generateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                            Generate Test Paper
                        </Button>
                    </CardContent>
                </Card>

                {paper && (
                    <Card className="rounded-2xl border border-gray-200">
                        <CardHeader className="flex flex-row items-start justify-between gap-3">
                            <div>
                                <CardTitle>{paper.title}</CardTitle>
                                <CardDescription>
                                    {paper.meta.className} • {paper.meta.subject} • {paper.meta.totalQuestions} questions • {paper.meta.totalMarks} marks
                                </CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" className="gap-2" onClick={() => downloadPdfMutation.mutate()} disabled={downloadPdfMutation.isPending}>
                                    {downloadPdfMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                    Download PDF
                                </Button>
                                <Button variant="outline" className="gap-2" onClick={() => printPdfMutation.mutate()} disabled={printPdfMutation.isPending}>
                                    {printPdfMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                                    Print
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            {paper.instructions?.length > 0 && (
                                <div>
                                    <p className="mb-2 text-sm font-semibold text-gray-900">Instructions</p>
                                    <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
                                        {paper.instructions.map((instruction, idx) => (
                                            <li key={idx}>{instruction}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            <div className="space-y-4">
                                {paper.questions?.map((q) => (
                                    <div key={q.questionNumber} className="rounded-lg border border-gray-200 p-4">
                                        <p className="text-sm font-semibold text-gray-900">
                                            Q{q.questionNumber}. {q.question}
                                        </p>
                                        {q.options?.length ? (
                                            <div className="mt-2 space-y-1 text-sm text-gray-700">
                                                {q.options.map((opt, idx) => (
                                                    <p key={idx}>
                                                        {String.fromCharCode(65 + idx)}. {opt}
                                                    </p>
                                                ))}
                                            </div>
                                        ) : null}
                                        <p className="mt-2 text-xs text-gray-500">
                                            {q.type} • {q.difficulty} • {q.marks} marks
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </LockedFeatureGate>
    );
}
