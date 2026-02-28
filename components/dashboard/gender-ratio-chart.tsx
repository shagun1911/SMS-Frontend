"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Users } from "lucide-react";

interface GenderRatioChartProps {
    data?: Record<string, number>;
}

const COLORS = [
    "hsl(217 91% 60%)", // Male - Blue
    "hsl(330 81% 60%)", // Female - Pink
    "hsl(271 91% 65%)", // Other - Purple
    "hsl(142 71% 45%)", // 4th - Green
    "hsl(31 97% 55%)",  // 5th - Orange
];

export function GenderRatioChart({ data: rawData }: GenderRatioChartProps) {
    const dataArray = rawData
        ? Object.entries(rawData)
            .filter(([_, value]) => value > 0)
            .map(([name, value], index) => ({
                name,
                value,
                color: name === "Male" ? COLORS[0] : name === "Female" ? COLORS[1] : COLORS[index + 2] || COLORS[index % COLORS.length]
            }))
        : [];

    const total = dataArray.reduce((acc, curr) => acc + curr.value, 0);

    if (total === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--muted))]/20 py-12 text-center">
                <Users className="h-10 w-10 text-[hsl(var(--muted-foreground))]/50" />
                <p className="mt-3 text-sm font-medium text-[hsl(var(--muted-foreground))]">No students yet</p>
                <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Enroll students to see gender ratio here.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                    <Pie
                        data={dataArray}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        animationBegin={0}
                        animationDuration={1500}
                    >
                        {dataArray.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                    </Pie>
                    <Tooltip
                        content={({ active, payload }) => {
                            if (active && payload?.[0]) {
                                const p = payload[0].payload;
                                const pct = total > 0 ? ((p.value / total) * 100).toFixed(1) : "0";
                                return (
                                    <div className="rounded-xl border border-[hsl(var(--border))] bg-white p-3 shadow-xl backdrop-blur-sm">
                                        <p className="text-xs font-bold text-[hsl(var(--foreground))] uppercase tracking-wider">{p.name}</p>
                                        <div className="mt-1 flex items-baseline gap-2">
                                            <span className="text-lg font-bold">{p.value}</span>
                                            <span className="text-xs text-[hsl(var(--muted-foreground))]">{pct}%</span>
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                </PieChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-2 gap-3">
                {dataArray.map((item) => (
                    <div key={item.name} className="flex flex-col rounded-xl bg-[hsl(var(--muted))]/30 p-3 transition-colors hover:bg-[hsl(var(--muted))]/50">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">{item.name}</span>
                        </div>
                        <div className="mt-1 flex items-baseline justify-between">
                            <span className="text-lg font-bold text-[hsl(var(--foreground))]">{item.value}</span>
                            <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">{((item.value / total) * 100).toFixed(1)}%</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
