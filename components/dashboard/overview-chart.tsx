"use client";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface ChartData {
    name: string;
    total: number;
}

export function OverviewChart({ data }: { data?: ChartData[] }) {
    if (!data || data.length === 0) {
        return (
            <div className="flex h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--muted))]/20 text-center">
                <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">No collection data yet</p>
                <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Fee collections will appear here.</p>
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data}>
                <XAxis
                    dataKey="name"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `₹${value / 1000}k`}
                />
                <Tooltip
                    cursor={{ fill: "hsl(var(--muted) / 0.5)" }}
                    content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                            return (
                                <div className="flex flex-col gap-1 rounded-xl border border-[hsl(var(--border))] bg-white p-3 shadow-lg">
                                    <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Collection</span>
                                    <span className="text-sm font-bold text-[hsl(var(--foreground))]">{formatCurrency(payload[0].value as number)}</span>
                                </div>
                            )
                        }
                        return null
                    }}
                />
                <Bar
                    dataKey="total"
                    fill="url(#overviewBarGradient)"
                    radius={[8, 8, 0, 0]}
                />
                <defs>
                    <linearGradient id="overviewBarGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" />
                        <stop offset="100%" stopColor="hsl(172 66% 38%)" />
                    </linearGradient>
                </defs>
            </BarChart>
        </ResponsiveContainer>
    );
}
