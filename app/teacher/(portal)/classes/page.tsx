"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Users, Loader2, BookOpen, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClassDetailView } from "@/components/classes/class-detail-view";

export default function TeacherClassesPage() {
  const [selectedClass, setSelectedClass] = useState<any>(null);

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ["all-classes"],
    queryFn: async () => {
      const res = await api.get("/classes");
      return res.data.data ?? [];
    },
  });

  if (selectedClass) {
    return (
      <div className="space-y-5">
        <ClassDetailView
          classData={selectedClass}
          onBack={() => setSelectedClass(null)}
        />
      </div>
    );
  }

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
          My Classes
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Click a class to view students and their details (no fee information).
        </p>
      </div>

      {!Array.isArray(classes) || classes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <BookOpen className="w-14 h-14 mx-auto text-gray-300 mb-3" />
          <p className="font-medium text-gray-600">No classes yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Your school admin will add classes and sections.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls: any) => {
            const sec = cls.section ?? cls.sections?.[0] ?? "A";
            return (
              <Card
                key={cls._id}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md hover:border-emerald-200 cursor-pointer group"
                onClick={() => setSelectedClass(cls)}
              >
                <CardHeader className="border-b border-gray-100 bg-gradient-to-br from-emerald-50 to-white p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 group-hover:bg-emerald-200 transition-colors">
                      <BookOpen className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold text-gray-900">
                        Class {cls.className} – {sec}
                      </CardTitle>
                      {cls.roomNumber && (
                        <p className="text-xs text-gray-500">
                          Room {cls.roomNumber}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Users className="h-4 w-4" />
                    View students
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-emerald-600 transition-colors" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
