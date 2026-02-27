"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Calendar, Loader2 } from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function TeacherTimetablePage() {
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");

  const { data: classes = [] } = useQuery({
    queryKey: ["all-classes"],
    queryFn: async () => {
      const res = await api.get("/classes");
      return res.data.data ?? [];
    },
  });

  const classData = classes.find((c: any) => c.className === selectedClass);

  const { data: timetable = [], isLoading } = useQuery({
    queryKey: ["timetable", selectedClass, selectedSection],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedClass) params.set("class", selectedClass);
      if (selectedSection) params.set("section", selectedSection);
      const res = await api.get(`/timetable?${params}`);
      return res.data.data ?? [];
    },
    enabled: !!selectedClass && !!selectedSection,
  });

  const getDay = (dayName: string) =>
    timetable.find((t: any) => t.dayOfWeek === dayName);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-emerald-600" />
          Timetable
        </h1>
        <p className="text-gray-500 text-sm mt-1">View class timetables</p>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <select
            value={selectedClass}
            onChange={(e) => { setSelectedClass(e.target.value); setSelectedSection(""); }}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            <option value="">Select Class</option>
            {classes.map((c: any) => (
              <option key={c._id} value={c.className}>Class {c.className}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            disabled={!selectedClass}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none disabled:opacity-50"
          >
            <option value="">Select Section</option>
            {classData?.sections?.map((s: string) => (
              <option key={s} value={s}>Section {s}</option>
            ))}
          </select>
        </div>
      </div>

      {!selectedClass || !selectedSection ? (
        <div className="text-center py-16 text-gray-400">
          <Calendar className="w-16 h-16 mx-auto mb-3 text-gray-200" />
          <p>Select a class and section to view timetable</p>
        </div>
      ) : isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
      ) : timetable.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="font-medium">No timetable set for this class</p>
        </div>
      ) : (
        <div className="space-y-4">
          {DAYS.map((day) => {
            const dayData = getDay(day);
            if (!dayData?.slots?.length) return null;
            return (
              <div key={day} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="bg-emerald-50 px-5 py-3">
                  <h3 className="font-semibold text-emerald-800">{day}</h3>
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
