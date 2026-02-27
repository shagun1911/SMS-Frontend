"use client";

import { useQuery } from "@tanstack/react-query";
import studentApi from "@/lib/studentApi";
import { FileText, Loader2, TrendingUp } from "lucide-react";

export default function StudentMarksPage() {
  const { data: results = [], isLoading } = useQuery({
    queryKey: ["student-results"],
    queryFn: async () => {
      const res = await studentApi.get("/exams/student/results");
      return res.data.data ?? [];
    },
  });

  const gradeColor = (grade: string) => {
    if (!grade) return "bg-gray-100 text-gray-600";
    const g = grade.toUpperCase();
    if (g.startsWith("A")) return "bg-green-100 text-green-700";
    if (g.startsWith("B")) return "bg-blue-100 text-blue-700";
    if (g.startsWith("C")) return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="w-6 h-6 text-purple-600" />
          My Results
        </h1>
        <p className="text-gray-500 text-sm mt-1">Exam results and subject-wise performance</p>
      </div>

      {results.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <TrendingUp className="w-16 h-16 mx-auto mb-3 text-gray-200" />
          <p className="font-medium">No results available yet</p>
          <p className="text-sm mt-1">Your results will appear here once exams are graded.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {results.map((result: any) => (
            <div key={result._id} className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {result.examId?.title || "Exam"}
                  </h3>
                  <p className="text-sm text-gray-500">{result.examId?.type || ""}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-indigo-600">{result.percentage?.toFixed(1)}%</p>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${gradeColor(result.grade)}`}>
                    Grade: {result.grade || "—"}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-gray-100 rounded-full mb-4">
                <div
                  className="h-2 bg-indigo-500 rounded-full transition-all"
                  style={{ width: `${Math.min(result.percentage || 0, 100)}%` }}
                />
              </div>

              {/* Subjects table */}
              {Array.isArray(result.subjects) && result.subjects.length > 0 && (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 border-b border-gray-100">
                      <th className="text-left py-2 font-medium">Subject</th>
                      <th className="text-right py-2 font-medium">Obtained</th>
                      <th className="text-right py-2 font-medium">Max</th>
                      <th className="text-right py-2 font-medium">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.subjects.map((s: any, i: number) => (
                      <tr key={i} className="border-b border-gray-50">
                        <td className="py-2 text-gray-700">{s.subject}</td>
                        <td className="py-2 text-right font-medium text-gray-900">{s.obtainedMarks}</td>
                        <td className="py-2 text-right text-gray-500">{s.maxMarks}</td>
                        <td className="py-2 text-right text-gray-600">
                          {s.maxMarks > 0 ? ((s.obtainedMarks / s.maxMarks) * 100).toFixed(0) : 0}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
