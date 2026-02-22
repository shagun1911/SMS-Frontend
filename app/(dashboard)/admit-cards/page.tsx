"use client";

import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IdCard, Loader2, Printer, Download, Eye } from "lucide-react";
import { LockedFeatureGate } from "@/components/plan/locked-feature-gate";
import api from "@/lib/api";

export default function AdmitCardsPage() {
    const [examId, setExamId] = useState("");
    const [classFilter, setClassFilter] = useState("");
    const [sectionFilter, setSectionFilter] = useState("");
    const [pdfAction, setPdfAction] = useState<{ studentId: string; action: "preview" | "download" | "print" } | null>(null);
    const printRef = useRef<HTMLDivElement>(null);

    const { data: school } = useQuery({
        queryKey: ["school-me"],
        queryFn: async () => {
            const res = await api.get("/schools/me");
            return res.data.data;
        },
    });

    const { data: exams } = useQuery({
        queryKey: ["exams-list"],
        queryFn: async () => {
            const res = await api.get("/exams");
            return res.data.data ?? [];
        },
    });

    const { data: cards, isLoading, refetch } = useQuery({
        queryKey: ["admit-cards", examId, classFilter, sectionFilter],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (classFilter) params.set("class", classFilter);
            if (sectionFilter) params.set("section", sectionFilter);
            const res = await api.get(`/exams/${examId}/admit-cards?${params}`);
            return res.data.data ?? [];
        },
        enabled: !!examId,
    });

    const handlePrintAll = () => {
        if (!printRef.current) return;
        const printWindow = window.open("", "_blank");
        if (!printWindow) return;
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head><title>Admit Cards</title>
            <style>
                body { font-family: system-ui, sans-serif; padding: 20px; }
                .card { border: 2px solid #333; padding: 24px; margin-bottom: 24px; page-break-inside: avoid; max-width: 400px; }
                .school { text-align: center; font-weight: bold; font-size: 18px; margin-bottom: 8px; padding-top: 8px; }
                .exam { text-align: center; color: #555; margin-bottom: 16px; }
                .photo { width: 80px; height: 100px; border: 1px solid #ccc; float: right; background: #f0f0f0; }
                .row { margin: 6px 0; }
                .label { font-weight: 600; color: #444; }
            </style>
            </head>
            <body>${printRef.current.innerHTML}</body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
        printWindow.close();
    };

    const handleAdmitCardPdf = async (studentId: string, action: "preview" | "download" | "print") => {
        if (!examId) return;
        setPdfAction({ studentId, action });
        try {
            const res = await api.get(
                `/exams/${examId}/admit-cards/${studentId}/pdf${action === "preview" ? "?preview=1" : ""}`,
                { responseType: "blob" }
            );
            const blob = res.data as Blob;
            const blobUrl = URL.createObjectURL(blob);
            if (action === "preview") {
                window.open(blobUrl, "_blank", "noopener");
                setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
            } else if (action === "download") {
                const a = document.createElement("a");
                a.href = blobUrl;
                a.download = `admit-card-${studentId}.pdf`;
                a.click();
                URL.revokeObjectURL(blobUrl);
            } else {
                const w = window.open(blobUrl, "_blank", "noopener");
                if (w) setTimeout(() => { w.print(); URL.revokeObjectURL(blobUrl); }, 800);
                else URL.revokeObjectURL(blobUrl);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setPdfAction(null);
        }
    };

    return (
        <LockedFeatureGate featureKey="admit_cards" featureLabel="Admit cards">
        <div className="flex-1 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">Admit Cards</h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Generate and print admit cards for exams by class and section.
                    </p>
                </div>
            </div>

            <Card className="border border-gray-200 bg-white p-6 shadow-sm">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500">Exam</label>
                        <select
                            value={examId}
                            onChange={(e) => setExamId(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                        >
                            <option value="">Select exam</option>
                            {(exams ?? []).map((e: any) => (
                                <option key={e._id} value={e._id}>{e.title} ({e.type})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500">Class (optional)</label>
                        <input
                            type="text"
                            placeholder="e.g. 10"
                            value={classFilter}
                            onChange={(e) => setClassFilter(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500">Section (optional)</label>
                        <input
                            type="text"
                            placeholder="e.g. A"
                            value={sectionFilter}
                            onChange={(e) => setSectionFilter(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                        />
                    </div>
                    <div className="flex items-end">
                        <Button
                            className="w-full bg-indigo-600 hover:bg-indigo-500"
                            onClick={() => refetch()}
                            disabled={!examId}
                        >
                            Generate
                        </Button>
                    </div>
                </div>
            </Card>

            {examId && (
                <>
                    {isLoading ? (
                        <div className="flex h-64 items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                        </div>
                    ) : Array.isArray(cards) && cards.length > 0 ? (
                        <>
                            <div className="flex flex-wrap gap-2">
                                <Button className="gap-2 bg-indigo-600 hover:bg-indigo-500" onClick={handlePrintAll}>
                                    <Printer className="h-4 w-4" /> Print All
                                </Button>
                            </div>
                            <div ref={printRef} className="space-y-6">
                                {cards.map((item: any) => (
                                    <div key={item.student._id} className="rounded-xl border-2 border-gray-300 bg-white shadow-sm overflow-hidden">
                                        <div className="pt-6 px-6 pb-4">
                                            <div className="school text-center font-bold text-lg text-gray-900 pt-2">{school?.schoolName ?? "School Name"}</div>
                                            <div className="exam text-center text-gray-500 text-sm mt-2 mb-4">{item.exam?.title} • {item.exam?.startDate ? new Date(item.exam.startDate).toLocaleDateString() : ""}</div>
                                            <div className="flex justify-between gap-4">
                                                <div className="flex-1 space-y-1">
                                                    <div className="row"><span className="label font-semibold text-gray-600">Name:</span> {item.student?.firstName} {item.student?.lastName}</div>
                                                    <div className="row"><span className="label font-semibold text-gray-600">Admission No:</span> {item.student?.admissionNumber}</div>
                                                    <div className="row"><span className="label font-semibold text-gray-600">Class / Section:</span> {item.student?.class} - {item.student?.section}</div>
                                                    <div className="row"><span className="label font-semibold text-gray-600">Roll No:</span> {item.student?.rollNumber ?? "—"}</div>
                                                    <div className="row"><span className="label font-semibold text-gray-600">Father:</span> {item.student?.fatherName}</div>
                                                </div>
                                                <div className="photo rounded border border-gray-300 bg-gray-100 flex items-center justify-center text-xs text-gray-400 w-20 h-24 shrink-0">
                                                    Photo
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2 p-4 border-t border-gray-100 bg-gray-50">
                                            <Button variant="outline" size="sm" className="gap-1" onClick={() => handleAdmitCardPdf(item.student._id, "preview")} disabled={pdfAction?.studentId === item.student._id}>
                                                {pdfAction?.studentId === item.student._id && pdfAction?.action === "preview" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                                                Preview
                                            </Button>
                                            <Button variant="outline" size="sm" className="gap-1" onClick={() => handleAdmitCardPdf(item.student._id, "download")} disabled={pdfAction?.studentId === item.student._id}>
                                                {pdfAction?.studentId === item.student._id && pdfAction?.action === "download" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                                Download
                                            </Button>
                                            <Button variant="outline" size="sm" className="gap-1" onClick={() => handleAdmitCardPdf(item.student._id, "print")} disabled={pdfAction?.studentId === item.student._id}>
                                                {pdfAction?.studentId === item.student._id && pdfAction?.action === "print" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                                                Print
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <Card className="border border-gray-200 bg-white p-12 text-center">
                            <IdCard className="mx-auto h-12 w-12 text-gray-300" />
                            <p className="mt-4 text-sm text-gray-500">No students found for the selected filters.</p>
                        </Card>
                    )}
                </>
            )}
        </div>
        </LockedFeatureGate>
    );
}
