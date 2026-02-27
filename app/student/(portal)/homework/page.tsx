"use client";

import { useQuery } from "@tanstack/react-query";
import studentApi from "@/lib/studentApi";
import { BookOpen, Loader2, CheckCircle, Clock } from "lucide-react";

export default function StudentHomeworkPage() {
  const { data: homework = [], isLoading } = useQuery({
    queryKey: ["student-homework"],
    queryFn: async () => {
      const res = await studentApi.get("/homework/student");
      return res.data.data ?? [];
    },
  });

  const now = new Date();
  const pending = homework.filter((h: any) => new Date(h.dueDate) >= now);
  const past = homework.filter((h: any) => new Date(h.dueDate) < now);

  const HwCard = ({ hw }: { hw: any }) => {
    const due = new Date(hw.dueDate);
    const isOverdue = due < now;
    return (
      <div className={`bg-white rounded-2xl border p-5 ${isOverdue ? "border-gray-200 opacity-60" : "border-indigo-100"}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">
                {hw.subject}
              </span>
            </div>
            <h3 className="font-semibold text-gray-900">{hw.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{hw.description}</p>
            <p className="text-xs text-gray-400 mt-2">
              Assigned by {hw.createdBy?.name || "Teacher"}
            </p>
          </div>
          <div className={`text-right shrink-0 ${isOverdue ? "text-gray-400" : "text-red-600"}`}>
            <div className="flex items-center gap-1 justify-end">
              {isOverdue ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
              <span className="text-xs font-medium">{isOverdue ? "Past" : "Due"}</span>
            </div>
            <p className="text-sm font-semibold">{due.toLocaleDateString()}</p>
          </div>
        </div>
        {hw.attachmentUrl && (
          <a
            href={hw.attachmentUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-block mt-3 text-xs text-indigo-600 hover:underline"
          >
            View Attachment →
          </a>
        )}
      </div>
    );
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
          <BookOpen className="w-6 h-6 text-indigo-600" />
          Homework
        </h1>
        <p className="text-gray-500 text-sm mt-1">All assignments for your class</p>
      </div>

      {pending.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Pending ({pending.length})
          </h2>
          <div className="space-y-3">
            {pending.map((hw: any) => <HwCard key={hw._id} hw={hw} />)}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Past Assignments ({past.length})
          </h2>
          <div className="space-y-3">
            {past.map((hw: any) => <HwCard key={hw._id} hw={hw} />)}
          </div>
        </div>
      )}

      {homework.length === 0 && (
        <div className="text-center py-16">
          <CheckCircle className="w-16 h-16 mx-auto text-green-300 mb-3" />
          <p className="text-gray-500 font-medium">No homework assigned yet</p>
        </div>
      )}
    </div>
  );
}
