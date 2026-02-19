"use client";

import { useEffect, useState } from "react";
import {
  GraduationCap,
  Users,
  IndianRupee,
  Wallet,
  PlusCircle,
  Banknote,
  CalendarDays,
  TrendingUp,
} from "lucide-react";

const STATS = [
  { label: "Students", value: 1248, suffix: "", icon: GraduationCap },
  { label: "Staff", value: 86, suffix: "", icon: Users },
  { label: "Collected", value: 12.4, suffix: "L", icon: IndianRupee },
  { label: "Pending", value: 2.1, suffix: "L", icon: Wallet },
];

const QUICK_ACTIONS = [
  { label: "Add Student", icon: PlusCircle },
  { label: "Collect Fee", icon: Banknote },
  { label: "Schedule Exam", icon: CalendarDays },
];

const BARS = [72, 88, 65, 94, 78, 82];
const MONTHS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep"];
const ACTIVITY = [
  { text: "Fee collected — Class V-A", amount: "₹45,000" },
  { text: "New student enrolled", amount: "Rahul K." },
  { text: "Exam result published", amount: "Unit Test" },
];

function AnimatedNumber({ value, suffix = "", delay = 0 }: { value: number; suffix?: string; delay?: number }) {
  const [count, setCount] = useState(0);
  const duration = 1200;
  const steps = 24;
  const increment = value / steps;
  const stepMs = duration / steps;

  useEffect(() => {
    let step = 0;
    const t = setInterval(() => {
      step++;
      setCount(Math.min(Math.round(increment * step), value));
      if (step >= steps) clearInterval(t);
    }, stepMs + delay / steps);
    return () => clearInterval(t);
  }, [value, increment, stepMs, delay]);

  return (
    <span className="tabular-nums">
      {count}
      {suffix}
    </span>
  );
}

export function AnimatedDashboardMock() {
  return (
    <div className="flex h-full w-full flex-col gap-3 p-4 text-left">
      {/* Quick actions */}
      <div className="flex flex-wrap items-center gap-1.5">
        {QUICK_ACTIONS.map((a, i) => (
          <span
            key={a.label}
            className={`animate-row-in inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium animation-fill-both ${
              i === 0 ? "bg-[hsl(var(--primary))]/15 text-[hsl(var(--primary))]" : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
            }`}
            style={{ animationDelay: `${60 + i * 80}ms` }}
          >
            <a.icon className="h-3 w-3" />
            {a.label}
          </span>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        {STATS.map((s, i) => (
          <div
            key={s.label}
            className="animate-fade-in-up rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2.5 animation-fill-both"
            style={{ animationDelay: `${120 + i * 60}ms` }}
          >
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-md ${
                i === 0 ? "bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]" : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
              }`}
            >
              <s.icon className="h-3.5 w-3.5" />
            </div>
            <p className="mt-2 text-sm font-semibold text-[hsl(var(--foreground))]">
              {s.suffix === "L" ? (
                <span className="tabular-nums">{s.value}{s.suffix}</span>
              ) : (
                <AnimatedNumber value={s.value} suffix={s.suffix} delay={i * 50} />
              )}
            </p>
            <p className="mt-0.5 text-[10px] text-[hsl(var(--muted-foreground))]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Chart + Activity */}
      <div className="flex min-h-0 flex-1 gap-2">
        <div className="animate-fade-in-up flex flex-1 flex-col rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2.5 animation-fill-both animation-delay-300">
          <p className="flex items-center gap-1.5 text-[10px] font-medium text-[hsl(var(--muted-foreground))]">
            <TrendingUp className="h-3 w-3 text-[hsl(var(--primary))]" />
            Fee collection trend
          </p>
          <div className="mt-2 flex flex-1 items-end justify-between gap-1 min-h-[48px]">
            {BARS.map((h, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-0.5">
                <div
                  className="w-full rounded-t bg-[hsl(var(--primary))] animate-bar-fill origin-bottom"
                  style={{
                    height: `${h}%`,
                    minHeight: 6,
                    animationDelay: `${400 + i * 60}ms`,
                    animationFillMode: "both",
                  }}
                />
              </div>
            ))}
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-[hsl(var(--muted-foreground))]">
            {MONTHS.map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between rounded-md bg-[hsl(var(--primary))]/10 px-2 py-1.5">
            <span className="text-[10px] font-medium text-[hsl(var(--muted-foreground))]">Collection rate</span>
            <span className="text-xs font-semibold text-[hsl(var(--primary))]">87%</span>
          </div>
        </div>

        <div className="animate-fade-in-up flex w-36 shrink-0 flex-col rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] animation-fill-both animation-delay-400">
          <p className="flex items-center gap-1.5 border-b border-[hsl(var(--border))] px-2.5 py-2 text-[10px] font-medium text-[hsl(var(--muted-foreground))]">
            <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--primary))] animate-live-dot" />
            Recent activity
          </p>
          <ul className="flex-1 min-h-0 overflow-hidden px-2 py-1">
            {ACTIVITY.map((a, i) => (
              <li
                key={i}
                className="animate-row-in flex items-start justify-between gap-1 border-b border-[hsl(var(--border))]/50 py-2 last:border-0 text-[10px] animation-fill-both"
                style={{ animationDelay: `${500 + i * 100}ms` }}
              >
                <span className="min-w-0 flex-1 truncate text-[hsl(var(--muted-foreground))]">{a.text}</span>
                <span className="shrink-0 font-medium text-[hsl(var(--foreground))]">{a.amount}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
