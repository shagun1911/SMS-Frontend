"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, Download, Printer, Sparkles, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LockedFeatureGate } from "@/components/plan/locked-feature-gate";
import api from "@/lib/api";

type TeacherQuestion = {
    question: string;
    type: "objective" | "subjective";
    difficulty: "easy" | "medium" | "hard";
    options?: string[];
    answer?: string;
};

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

const CLASS_OPTIONS = ["1","2","3","4","5","6","7","8","9","10","11","12"];

function parseCSV(input: string): string[] {
    const seen = new Set<string>();
    return input
        .replace(/,+/g, ',')
        .replace(/^,|,$/g, '')
        .split(',')
        .map((s) => s.trim())
        .filter((s) => {
            if (!s) return false;
            const key = s.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
}

function getErrorMessage(error: unknown, fallback: string): string {
    if (typeof error === "object" && error !== null && "response" in error) {
        const response = (error as { response?: { data?: { message?: string } } }).response;
        const msg = response?.data?.message;
        if (msg) return msg;
    }
    return fallback;
}

export default function TestPaperPage() {
    // ── Core fields ───────────────────────────────────────────────────────────
    const [className, setClassName] = useState("10");
    const [subject, setSubject] = useState("");
    const [targetExam, setTargetExam] = useState("boards");
    const [chaptersInput, setChaptersInput] = useState(""); // comma-separated
    const [topicsInput, setTopicsInput] = useState("");

    // ── Paper config ──────────────────────────────────────────────────────────
    const [questionCount, setQuestionCount] = useState(20);
    const [customQuestionCount, setCustomQuestionCount] = useState(20);
    const [examPattern, setExamPattern] = useState("mixed");
    const [coachingStyles, setCoachingStyles] = useState<string[]>([]);
    const [durationMinutes, setDurationMinutes] = useState(60);
    const [marksPerQuestion, setMarksPerQuestion] = useState(1);
    const [includePreviousYear, setIncludePreviousYear] = useState(true);
    const [prioritizeRepeated, setPrioritizeRepeated] = useState(true);
    const [specialInstructions, setSpecialInstructions] = useState("");

    // ── Strict distribution ───────────────────────────────────────────────────
    const [easyPct, setEasyPct] = useState(30);
    const [mediumPct, setMediumPct] = useState(50);
    const [hardPct, setHardPct] = useState(20);
    const [objectivePct, setObjectivePct] = useState(50);
    const [subjectivePct, setSubjectivePct] = useState(50);

    // ── Teacher custom questions ──────────────────────────────────────────────
    const [teacherQuestions, setTeacherQuestions] = useState<TeacherQuestion[]>([]);
    const [tqText, setTqText] = useState("");
    const [tqType, setTqType] = useState<"objective" | "subjective">("objective");
    const [tqDiff, setTqDiff] = useState<"easy" | "medium" | "hard">("medium");
    const [tqAnswer, setTqAnswer] = useState("");

    // ── Generated paper ───────────────────────────────────────────────────────
    const [paper, setPaper] = useState<GeneratedPaper | null>(null);

    // ── Derived values ────────────────────────────────────────────────────────
    const diffSum = easyPct + mediumPct + hardPct;
    const typeSum = objectivePct + subjectivePct;
    const effectiveQuestionType =
        objectivePct === 100 ? "objective" : subjectivePct === 100 ? "subjective" : "mixed";
    const derivedChapters = parseCSV(chaptersInput);
    const derivedTopics = parseCSV(topicsInput);
    const isSubjectEmpty = subject.trim() === "";
    const canGenerate = !isSubjectEmpty && diffSum === 100 && typeSum === 100;

    const addTeacherQuestion = () => {
        if (!tqText.trim()) return;
        setTeacherQuestions((prev) => [
            ...prev,
            { question: tqText.trim(), type: tqType, difficulty: tqDiff, answer: tqAnswer.trim() || undefined },
        ]);
        setTqText("");
        setTqAnswer("");
    };
    const removeTeacherQuestion = (i: number) =>
        setTeacherQuestions((prev) => prev.filter((_, idx) => idx !== i));

    // ── API: fetch real classes ───────────────────────────────────────────────
    const { data: classesData } = useQuery({
        queryKey: ["classes-list"],
        queryFn: async () => {
            const res = await api.get("/classes");
            const list: any[] = res.data?.data || res.data || [];
            return list.map((c: any) => ({
                label: `${c.className}${c.section ? `-${c.section}` : ""}`,
                value: c.className,
            }));
        },
    });

    // ── Mutations ─────────────────────────────────────────────────────────────
    const generateMutation = useMutation({
        mutationFn: async () => {
            if (!subject.trim()) { toast.error("At least one subject is required"); throw new Error("invalid"); }
            if (derivedChapters.length === 0) { toast.error("Please enter at least one chapter"); throw new Error("invalid"); }
            if (diffSum !== 100) { toast.error(`Difficulty % must sum to 100 (currently ${diffSum})`); throw new Error("invalid"); }
            if (typeSum !== 100) { toast.error(`Question type % must sum to 100 (currently ${typeSum})`); throw new Error("invalid"); }

            const payload = {
                className,
                subject: subject.trim(),
                chapter: derivedChapters[0],
                chapters: derivedChapters,
                includeWholeChapter: derivedChapters.length === 0,
                topics: derivedTopics.join(", "),
                topicsByChapter: {},
                questionType: effectiveQuestionType,
                examPattern,
                coachingStyles,
                questionCount: questionCount === -1 ? customQuestionCount : questionCount,
                difficultyLevel: "mixed",
                difficultyDistribution: { easy: easyPct, medium: mediumPct, hard: hardPct },
                typeDistribution: { objective: objectivePct, subjective: subjectivePct },
                teacherQuestions,
                targetExam: targetExam.trim() || "school",
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
            const res = await api.post("/test-papers/download-pdf", { paper }, { responseType: "blob" });
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
            const res = await api.post("/test-papers/download-pdf", { paper }, { responseType: "blob" });
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
                        Build high-quality papers for Boards, JEE, NEET, and any custom exam.
                    </p>
                </div>

                <Card className="rounded-2xl border border-gray-200">
                    <CardHeader>
                        <CardTitle>Paper Setup</CardTitle>
                        <CardDescription>Choose class, exam, subject, chapters, and distribution.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">

                        {/* ── Row 1: Class / Subject / Target Exam / Question Count ── */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            {/* Class */}
                            <div className="space-y-2">
                                <Label>Class</Label>
                                <select
                                    className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm"
                                    value={className}
                                    onChange={(e) => setClassName(e.target.value)}
                                >
                                    {(classesData?.length
                                        ? classesData
                                        : CLASS_OPTIONS.map((c) => ({ label: `Class ${c}`, value: c }))
                                    ).map((c) => (
                                        <option key={c.value} value={c.value}>{c.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Subject — free text, independent of exam */}
                            <div className="space-y-2">
                                <Label>Subject</Label>
                                <Input
                                    placeholder="e.g. Physics, English, Maths"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className={isSubjectEmpty ? "border-red-400" : ""}
                                />
                                {isSubjectEmpty && (
                                    <p className="text-xs text-red-500">Subject is required</p>
                                )}
                            </div>

                            {/* Target Exam — free text with quick chips */}
                            <div className="space-y-2">
                                <Label>Target Exam</Label>
                                <Input
                                    placeholder="jee / neet / boards / custom"
                                    value={targetExam}
                                    onChange={(e) => setTargetExam(e.target.value)}
                                />
                                <div className="flex flex-wrap gap-1">
                                    {["boards", "jee", "neet", "school"].map((ex) => (
                                        <button
                                            key={ex}
                                            type="button"
                                            onClick={() => setTargetExam(ex)}
                                            className={`rounded px-2 py-0.5 text-xs border ${
                                                targetExam === ex
                                                    ? "bg-indigo-600 text-white border-indigo-600"
                                                    : "bg-gray-100 border-gray-200 hover:bg-indigo-100"
                                            }`}
                                        >
                                            {ex.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Question Count */}
                            <div className="space-y-2">
                                <Label>Question Count</Label>
                                <select
                                    className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm"
                                    value={questionCount}
                                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                                >
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
                                <Input
                                    type="number"
                                    min={1}
                                    max={100}
                                    value={customQuestionCount}
                                    onChange={(e) => setCustomQuestionCount(Number(e.target.value || 20))}
                                />
                            </div>
                        )}

                        {/* ── Chapters (comma-separated) ── */}
                        <div className="space-y-2">
                            <Label>Chapters <span className="text-xs text-gray-400">(comma-separated)</span></Label>
                            <Input
                                placeholder="e.g. Motion, Force and Laws of Motion, Gravitation"
                                value={chaptersInput}
                                onChange={(e) => setChaptersInput(e.target.value)}
                            />
                            {derivedChapters.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {derivedChapters.map((ch) => (
                                        <span key={ch} className="rounded bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-xs text-indigo-700">
                                            {ch}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* ── Topics (optional) ── */}
                        <div className="space-y-2">
                            <Label>Topics <span className="text-xs text-gray-400">(optional — focus areas within chapters)</span></Label>
                            <Input
                                placeholder="e.g. Newton's second law, uniform acceleration"
                                value={topicsInput}
                                onChange={(e) => setTopicsInput(e.target.value)}
                            />
                            {derivedTopics.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {derivedTopics.map((t) => (
                                        <span key={t} className="rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs text-emerald-700">{t}</span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* ── Exam Pattern + Duration + Marks ── */}
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label>Exam Pattern</Label>
                                <select
                                    className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm"
                                    value={examPattern}
                                    onChange={(e) => setExamPattern(e.target.value)}
                                >
                                    <option value="pyq">PYQ-based</option>
                                    <option value="conceptual">Conceptual</option>
                                    <option value="mixed">Mixed</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Duration (minutes)</Label>
                                <Input
                                    type="number"
                                    min={10}
                                    value={durationMinutes}
                                    onChange={(e) => setDurationMinutes(Number(e.target.value || 60))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Marks / Question</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    value={marksPerQuestion}
                                    onChange={(e) => setMarksPerQuestion(Number(e.target.value || 1))}
                                />
                            </div>
                        </div>

                        {/* ── Difficulty Distribution ── */}
                        <div className="space-y-2">
                            <Label>
                                Difficulty Distribution{" "}
                                <span className={diffSum !== 100 ? "text-red-500 text-xs" : "text-green-600 text-xs"}>
                                    ({diffSum}% / 100%)
                                </span>
                            </Label>
                            <div className="grid grid-cols-3 gap-3">
                                {(
                                    [
                                        { label: "Easy %", val: easyPct, set: setEasyPct },
                                        { label: "Medium %", val: mediumPct, set: setMediumPct },
                                        { label: "Hard %", val: hardPct, set: setHardPct },
                                    ] as const
                                ).map(({ label, val, set }: any) => (
                                    <div key={label} className="space-y-1">
                                        <p className="text-xs text-gray-500">{label}</p>
                                        <Input
                                            type="number"
                                            min={0}
                                            max={100}
                                            value={val}
                                            onChange={(e) => set(Number(e.target.value))}
                                            className={diffSum !== 100 ? "border-red-400" : ""}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ── Question Type Distribution ── */}
                        <div className="space-y-2">
                            <Label>
                                Question Type Distribution{" "}
                                <span className={typeSum !== 100 ? "text-red-500 text-xs" : "text-green-600 text-xs"}>
                                    ({typeSum}% / 100%)
                                </span>
                            </Label>
                            <div className="grid grid-cols-2 gap-3">
                                {(
                                    [
                                        { label: "Objective %", val: objectivePct, set: setObjectivePct },
                                        { label: "Subjective %", val: subjectivePct, set: setSubjectivePct },
                                    ] as const
                                ).map(({ label, val, set }: any) => (
                                    <div key={label} className="space-y-1">
                                        <p className="text-xs text-gray-500">{label}</p>
                                        <Input
                                            type="number"
                                            min={0}
                                            max={100}
                                            value={val}
                                            onChange={(e) => set(Number(e.target.value))}
                                            className={typeSum !== 100 ? "border-red-400" : ""}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ── Additional options ── */}
                        <div className="space-y-2">
                            <Label>Options</Label>
                            <div className="flex flex-wrap items-center gap-4 text-sm">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={includePreviousYear}
                                        onChange={(e) => setIncludePreviousYear(e.target.checked)}
                                    />
                                    Include previous-year style
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={prioritizeRepeated}
                                        onChange={(e) => setPrioritizeRepeated(e.target.checked)}
                                    />
                                    Prioritize repeated / hot questions
                                </label>
                            </div>
                        </div>

                        {/* ── Coaching style ── */}
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
                                                    e.target.checked
                                                        ? [...prev, style]
                                                        : prev.filter((s) => s !== style)
                                                );
                                            }}
                                        />
                                        {style.toUpperCase()} style
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* ── Teacher Custom Questions ── */}
                        <div className="space-y-2">
                            <Label>
                                Teacher Custom Questions{" "}
                                <span className="text-xs text-gray-400">(included first; LLM generates the rest)</span>
                            </Label>
                            <div className="rounded-lg border border-gray-200 p-3 space-y-3">
                                <div className="grid gap-2 md:grid-cols-4">
                                    <Input
                                        className="md:col-span-2"
                                        placeholder="Question text…"
                                        value={tqText}
                                        onChange={(e) => setTqText(e.target.value)}
                                    />
                                    <select
                                        className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
                                        value={tqType}
                                        onChange={(e) => setTqType(e.target.value as any)}
                                    >
                                        <option value="objective">Objective</option>
                                        <option value="subjective">Subjective</option>
                                    </select>
                                    <select
                                        className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
                                        value={tqDiff}
                                        onChange={(e) => setTqDiff(e.target.value as any)}
                                    >
                                        <option value="easy">Easy</option>
                                        <option value="medium">Medium</option>
                                        <option value="hard">Hard</option>
                                    </select>
                                </div>
                                <div className="flex gap-2 items-center">
                                    <Input
                                        placeholder="Answer / key points (optional)"
                                        value={tqAnswer}
                                        onChange={(e) => setTqAnswer(e.target.value)}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="gap-1 shrink-0"
                                        onClick={addTeacherQuestion}
                                    >
                                        <Plus className="h-4 w-4" /> Add
                                    </Button>
                                </div>
                                {teacherQuestions.length > 0 && (
                                    <div className="space-y-2">
                                        {teacherQuestions.map((tq, i) => (
                                            <div
                                                key={i}
                                                className="flex items-start justify-between gap-2 rounded-lg bg-gray-50 p-2 text-sm"
                                            >
                                                <div>
                                                    <span className="font-medium">Q{i + 1}.</span> {tq.question}
                                                    <span className="ml-2 rounded bg-indigo-100 px-1.5 py-0.5 text-xs text-indigo-700">
                                                        {tq.type}
                                                    </span>
                                                    <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">
                                                        {tq.difficulty}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => removeTeacherQuestion(i)}
                                                    className="text-gray-400 hover:text-red-500 shrink-0"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── Special Instructions ── */}
                        <div className="space-y-2">
                            <Label>Special Instructions (optional)</Label>
                            <textarea
                                className="min-h-20 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                                placeholder="Example: include one HOTS case study, avoid true/false questions."
                                value={specialInstructions}
                                onChange={(e) => setSpecialInstructions(e.target.value)}
                            />
                        </div>

                        <Button
                            className="bg-indigo-600 hover:bg-indigo-500 gap-2 disabled:opacity-50"
                            onClick={() => generateMutation.mutate()}
                            disabled={generateMutation.isPending || !canGenerate}
                            title={
                                !canGenerate
                                    ? isSubjectEmpty
                                        ? "Subject is required"
                                        : diffSum !== 100
                                        ? `Difficulty % must sum to 100 (currently ${diffSum})`
                                        : `Type % must sum to 100 (currently ${typeSum})`
                                    : undefined
                            }
                        >
                            {generateMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Sparkles className="h-4 w-4" />
                            )}
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
                                    {paper.meta.className} • {paper.meta.subject} • {paper.meta.totalQuestions} questions •{" "}
                                    {paper.meta.totalMarks} marks
                                </CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    className="gap-2"
                                    onClick={() => downloadPdfMutation.mutate()}
                                    disabled={downloadPdfMutation.isPending}
                                >
                                    {downloadPdfMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Download className="h-4 w-4" />
                                    )}
                                    Download PDF
                                </Button>
                                <Button
                                    variant="outline"
                                    className="gap-2"
                                    onClick={() => printPdfMutation.mutate()}
                                    disabled={printPdfMutation.isPending}
                                >
                                    {printPdfMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Printer className="h-4 w-4" />
                                    )}
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
