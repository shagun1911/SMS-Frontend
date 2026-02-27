"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import {
  FileText,
  Loader2,
  Trophy,
  Calendar,
  BookOpen,
  CheckCircle2,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MarksEntryModal } from "@/components/exams/marks-entry-modal";
import { MeritListModal } from "@/components/exams/merit-list-modal";

export default function TeacherMarksPage() {
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [marksOpen, setMarksOpen] = useState(false);
  const [meritOpen, setMeritOpen] = useState(false);

  const { data: exams = [], isLoading } = useQuery({
    queryKey: ["exams-list"],
    queryFn: async () => {
      const res = await api.get("/exams");
      return res.data.data ?? [];
    },
  });

  const upcoming = exams.filter(
    (e: any) => e.status === "scheduled" || e.status === "upcoming" || !e.status
  );
  const ongoing = exams.filter((e: any) => e.status === "ongoing");
  const completed = exams.filter((e: any) => e.status === "completed");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const ExamCard = ({ exam }: { exam: any }) => (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <Badge className="bg-purple-100 text-purple-700 border-0 text-xs">
          {exam.examType ?? exam.type ?? "Exam"}
        </Badge>
        {exam.status === "completed" && (
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        )}
      </div>
      <h3 className="font-semibold text-gray-900 text-sm mb-1">
        {exam.name ?? exam.title ?? "Examination"}
      </h3>
      {exam.startDate && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
          <Calendar className="w-3.5 h-3.5" />
          {new Date(exam.startDate).toLocaleDateString()}
          {exam.endDate && ` – ${new Date(exam.endDate).toLocaleDateString()}`}
        </div>
      )}
      {exam.classes && exam.classes.length > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
          <Users className="w-3.5 h-3.5" />
          Classes: {exam.classes.join(", ")}
        </div>
      )}
      <div className="flex gap-2 pt-3 border-t border-gray-100">
        <Button
          size="sm"
          className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-xs gap-1.5"
          onClick={() => {
            setSelectedExam(exam);
            setMarksOpen(true);
          }}
        >
          <FileText className="h-3.5 w-3.5" /> Enter Marks
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-xs border-gray-200 gap-1.5"
          title="Merit List"
          onClick={() => {
            setSelectedExam(exam);
            setMeritOpen(true);
          }}
        >
          <Trophy className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );

  const Section = ({
    title,
    icon: Icon,
    color,
    items,
  }: {
    title: string;
    icon: any;
    color: string;
    items: any[];
  }) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-3">
        <h2 className={`text-sm font-semibold flex items-center gap-2 ${color}`}>
          <Icon className="w-4 h-4" /> {title}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((exam: any) => (
            <ExamCard key={exam._id} exam={exam} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="w-6 h-6 text-purple-600" />
          Exams & Marks
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Select an exam to enter marks or view results
        </p>
      </div>

      {exams.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
          <FileText className="w-16 h-16 mx-auto mb-3 text-gray-200" />
          <p className="font-medium text-gray-600">No exams created yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Ask the admin to create an exam first.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          <Section
            title="Upcoming"
            icon={Calendar}
            color="text-indigo-700"
            items={upcoming}
          />
          <Section
            title="Ongoing"
            icon={BookOpen}
            color="text-amber-700"
            items={ongoing}
          />
          <Section
            title="Completed"
            icon={CheckCircle2}
            color="text-emerald-700"
            items={completed}
          />
        </div>
      )}

      {selectedExam && (
        <>
          <MarksEntryModal
            exam={selectedExam}
            open={marksOpen}
            onOpenChange={setMarksOpen}
          />
          <MeritListModal
            exam={selectedExam}
            open={meritOpen}
            onOpenChange={setMeritOpen}
          />
        </>
      )}
    </div>
  );
}
