"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Download, Printer, Eye } from "lucide-react";
import api from "@/lib/api";

export default function PrintTimetablePage() {
    const [classId, setClassId] = useState("");
    const [section, setSection] = useState("A");
    const [action, setAction] = useState<"preview" | "download" | "print" | null>(null);

    const { data: classes = [] } = useQuery({
        queryKey: ["classes"],
        queryFn: async () => {
            const res = await api.get("/classes");
            return res.data.data ?? res.data ?? [];
        },
    });

    const selectedClass = (classes as any[]).find((c: any) => c._id === classId);
    const sections = selectedClass?.sections?.length ? selectedClass.sections : ["A", "B", "C"];

    const handlePdf = async (a: "preview" | "download" | "print") => {
        if (!classId) return;
        setAction(a);
        try {
            const res = await api.get(
                `/timetable/print/${classId}?section=${section}${a === "preview" ? "&preview=1" : ""}`,
                { responseType: "blob" }
            );
            const blob = res.data as Blob;
            const url = URL.createObjectURL(blob);
            if (a === "preview") {
                window.open(url, "_blank");
                setTimeout(() => URL.revokeObjectURL(url), 30000);
            } else if (a === "download") {
                const el = document.createElement("a");
                el.href = url;
                el.download = `timetable-${selectedClass?.className}-${section}.pdf`;
                el.click();
                URL.revokeObjectURL(url);
            } else {
                const w = window.open(url, "_blank");
                if (w) setTimeout(() => { w.print(); URL.revokeObjectURL(url); }, 800);
                else URL.revokeObjectURL(url);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setAction(null);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-gray-900">Print Timetable</h2>
                <p className="mt-1 text-sm text-gray-500">Select class and section, then preview, download PDF, or print.</p>
            </div>
            <Card className="max-w-md border border-gray-200 bg-white shadow-sm">
                <CardHeader>
                    <CardTitle>Generate PDF</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500">Class</label>
                        <select
                            value={classId}
                            onChange={(e) => { setClassId(e.target.value); setSection(sections[0] || "A"); }}
                            className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                        >
                            <option value="">Select class</option>
                            {(classes as any[]).map((c: any) => (
                                <option key={c._id} value={c._id}>{c.className}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500">Section</label>
                        <select
                            value={section}
                            onChange={(e) => setSection(e.target.value)}
                            className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                        >
                            {sections.map((s: string) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                        <Button variant="outline" onClick={() => handlePdf("preview")} disabled={!classId || !!action}>
                            {action === "preview" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />} Preview
                        </Button>
                        <Button variant="outline" onClick={() => handlePdf("download")} disabled={!classId || !!action}>
                            {action === "download" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Download PDF
                        </Button>
                        <Button variant="outline" onClick={() => handlePdf("print")} disabled={!classId || !!action}>
                            {action === "print" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />} Print
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
