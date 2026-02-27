"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Users, Loader2, ChevronDown, ChevronUp } from "lucide-react";

export default function TeacherClassesPage() {
  const [expandedClass, setExpandedClass] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>("");

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ["all-classes"],
    queryFn: async () => {
      const res = await api.get("/classes");
      return res.data.data ?? [];
    },
  });

  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ["class-students", expandedClass, selectedSection],
    queryFn: async () => {
      if (!expandedClass) return [];
      const cls = classes.find((c: any) => c._id === expandedClass);
      if (!cls) return [];
      const params = new URLSearchParams({ class: cls.className });
      if (selectedSection) params.set("section", selectedSection);
      const res = await api.get(`/students?${params}`);
      return res.data.data ?? [];
    },
    enabled: !!expandedClass,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="w-6 h-6 text-emerald-600" />
          All Classes
        </h1>
        <p className="text-gray-500 text-sm mt-1">Click on a class to view students</p>
      </div>

      <div className="space-y-3">
        {classes.map((cls: any) => {
          const isExpanded = expandedClass === cls._id;
          return (
            <div key={cls._id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <button
                onClick={() => {
                  if (isExpanded) {
                    setExpandedClass(null);
                    setSelectedSection("");
                  } else {
                    setExpandedClass(cls._id);
                    setSelectedSection("");
                  }
                }}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <span className="font-bold text-emerald-700 text-sm">{cls.className}</span>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Class {cls.className}</p>
                    <p className="text-xs text-gray-500">
                      Sections: {cls.sections?.join(", ") || "—"}
                    </p>
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
              </button>

              {isExpanded && (
                <div className="border-t border-gray-100 p-5">
                  {/* Section filter */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-sm text-gray-600">Section:</span>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => setSelectedSection("")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${!selectedSection ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                      >
                        All
                      </button>
                      {cls.sections?.map((s: string) => (
                        <button
                          key={s}
                          onClick={() => setSelectedSection(s)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedSection === s ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Students list */}
                  {studentsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                  ) : students.length === 0 ? (
                    <p className="text-center text-gray-400 py-8 text-sm">No students in this class</p>
                  ) : (
                    <div className="overflow-hidden rounded-xl border border-gray-100">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Name</th>
                            <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Adm. No.</th>
                            <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Section</th>
                            <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Roll</th>
                          </tr>
                        </thead>
                        <tbody>
                          {students.map((s: any) => (
                            <tr key={s._id} className="border-t border-gray-50 hover:bg-slate-50">
                              <td className="px-4 py-2.5 font-medium text-gray-900">
                                {s.firstName} {s.lastName}
                              </td>
                              <td className="px-4 py-2.5 text-gray-500">{s.admissionNumber}</td>
                              <td className="px-4 py-2.5 text-gray-500">{s.section}</td>
                              <td className="px-4 py-2.5 text-gray-500">{s.rollNumber || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="px-4 py-2 bg-slate-50 border-t border-gray-100 text-xs text-gray-500">
                        {students.length} student{students.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
