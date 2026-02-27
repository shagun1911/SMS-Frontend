"use client";

import { useQuery } from "@tanstack/react-query";
import { useStudentAuthStore } from "@/store/studentAuthStore";
import studentApi from "@/lib/studentApi";
import { Calendar, Loader2 } from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function StudentTimetablePage() {
  const { student } = useStudentAuthStore();

  const { data: timetable = [], isLoading } = useQuery({
    queryKey: ["student-timetable", student?.class, student?.section],
    queryFn: async () => {
      const res = await studentApi.get(`/timetable?class=${student?.class}&section=${student?.section}`);
      return res.data.data ?? [];
    },
    enabled: !!student,
  });

  const getDay = (dayName: string) =>
    timetable.find((t: any) => t.dayOfWeek === dayName);

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
          <Calendar className="w-6 h-6 text-indigo-600" />
          Timetable
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Class {student?.class} — Section {student?.section}
        </p>
      </div>

      {timetable.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Calendar className="w-16 h-16 mx-auto mb-3 text-gray-200" />
          <p className="font-medium">Timetable not set yet</p>
          <p className="text-sm mt-1">Your school hasn't published a timetable for your class.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {DAYS.map((day) => {
            const dayData = getDay(day);
            if (!dayData || !dayData.slots?.length) return null;
            return (
              <div key={day} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="bg-indigo-50 px-5 py-3">
                  <h3 className="font-semibold text-indigo-800">{day}</h3>
                </div>
                <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {dayData.slots.map((slot: any, i: number) => (
                    <div
                      key={i}
                      className={`rounded-xl p-3 ${slot.type === "lunch" ? "bg-amber-50 border border-amber-100" : "bg-slate-50 border border-slate-100"}`}
                    >
                      <p className="text-xs text-gray-500">{slot.startTime} – {slot.endTime}</p>
                      <p className={`font-semibold text-sm mt-0.5 ${slot.type === "lunch" ? "text-amber-700" : "text-gray-900"}`}>
                        {slot.type === "lunch" ? "Lunch Break" : slot.subject}
                      </p>
                      {slot.teacherId?.name && (
                        <p className="text-xs text-gray-400 mt-0.5">{slot.teacherId.name}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
