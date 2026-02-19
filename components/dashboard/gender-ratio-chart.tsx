"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Users } from "lucide-react";

interface GenderRatioChartProps {
    male: number;
    female: number;
}

export function GenderRatioChart({ male, female }: GenderRatioChartProps) {
    const total = male + female;

    if (total === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--muted))]/20 py-12 text-center">
                <Users className="h-10 w-10 text-[hsl(var(--muted-foreground))]/50" />
                <p className="mt-3 text-sm font-medium text-[hsl(var(--muted-foreground))]">No students yet</p>
                <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Enroll students to see gender ratio here.</p>
            </div>
        );
    }

    const data = [
        { name: "Male", value: male, color: "hsl(217 91% 60%)" },
        { name: "Female", value: female, color: "hsl(330 81% 60%)" },
    ].filter((d) => d.value > 0);

    if (data.length === 0) return null;

    return (
        <div className="space-y-4">
            <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip
                        content={({ active, payload }) => {
                            if (active && payload?.[0]) {
                                const p = payload[0].payload;
                                const pct = total > 0 ? ((p.value / total) * 100).toFixed(1) : "0";
                                return (
                                    <div className="rounded-lg border border-[hsl(var(--border))] bg-white px-3 py-2 shadow-md">
                                        <p className="text-xs font-medium text-[hsl(var(--foreground))]">{p.name}: {p.value}</p>
                                        <p className="text-xs text-[hsl(var(--muted-foreground))]">{pct}%</p>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                </PieChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-around rounded-lg bg-[hsl(var(--muted))]/30 py-3">
                <div className="text-center">
                    <div className="flex items-center justify-center gap-1.5">
                        <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                        <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Male</span>
                    </div>
                    <p className="mt-1 text-lg font-bold text-[hsl(var(--foreground))]">{male}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{total > 0 ? ((male / total) * 100).toFixed(1) : 0}%</p>
                </div>
                <div className="h-10 w-px bg-[hsl(var(--border))]" />
                <div className="text-center">
                    <div className="flex items-center justify-center gap-1.5">
                        <div className="h-2.5 w-2.5 rounded-full bg-pink-500" />
                        <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Female</span>
                    </div>
                    <p className="mt-1 text-lg font-bold text-[hsl(var(--foreground))]">{female}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{total > 0 ? ((female / total) * 100).toFixed(1) : 0}%</p>
                </div>
            </div>
        </div>
    );
}
