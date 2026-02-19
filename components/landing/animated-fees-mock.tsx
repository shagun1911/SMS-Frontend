"use client";

import { Banknote, CheckCircle, Wallet } from "lucide-react";

const ROWS = [
  { name: "Priya S.", class: "V-A", amount: "₹12,500", status: "paid" },
  { name: "Arjun M.", class: "VII-B", amount: "₹14,200", status: "paid" },
  { name: "Ananya K.", class: "III-A", amount: "₹8,400", status: "pending" },
];

export function AnimatedFeesMock() {
  return (
    <div className="flex h-full w-full flex-col gap-3 p-4">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]">
          <Banknote className="h-4 w-4" />
        </div>
        <span className="text-sm font-semibold text-[hsl(var(--foreground))]">Fee collection</span>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
        {ROWS.map((r, i) => (
          <div
            key={r.name}
            className="animate-row-in flex items-center justify-between border-b border-[hsl(var(--border))] px-3 py-2.5 last:border-0 animation-fill-both"
            style={{ animationDelay: `${150 + i * 100}ms` }}
          >
            <div>
              <p className="text-xs font-medium text-[hsl(var(--foreground))]">{r.name}</p>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{r.class}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-[hsl(var(--foreground))]">{r.amount}</span>
              {r.status === "paid" && (
                <CheckCircle className="h-3.5 w-3.5 shrink-0 text-[hsl(var(--primary))]" aria-hidden />
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/50 px-3 py-2">
        <span className="flex items-center gap-1.5 text-xs font-medium text-[hsl(var(--muted-foreground))]">
          <Wallet className="h-3.5 w-3.5" />
          Today&apos;s collection
        </span>
        <span className="text-sm font-semibold text-[hsl(var(--foreground))]">₹35,100</span>
      </div>
    </div>
  );
}
