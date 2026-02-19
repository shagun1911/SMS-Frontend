"use client";

import { GraduationCap } from "lucide-react";

const STUDENTS = [
  { name: "Rahul K.", class: "IX-A", roll: 12 },
  { name: "Sneha P.", class: "VII-B", roll: 8 },
  { name: "Vikram S.", class: "XI-A", roll: 22 },
];

export function AnimatedStudentsMock() {
  return (
    <div className="flex h-full w-full flex-col gap-3 p-4">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]">
          <GraduationCap className="h-4 w-4" />
        </div>
        <span className="text-sm font-semibold text-[hsl(var(--foreground))]">Students</span>
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-hidden">
        {STUDENTS.map((s, i) => (
          <div
            key={s.name}
            className="animate-row-in flex items-center gap-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 animation-fill-both"
            style={{ animationDelay: `${120 + i * 100}ms` }}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-xs font-medium text-white">
              {s.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-[hsl(var(--foreground))]">{s.name}</p>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                {s.class} · Roll {s.roll}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
