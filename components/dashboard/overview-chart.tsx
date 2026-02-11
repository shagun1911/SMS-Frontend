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
            <div className="flex h-[350px] items-center justify-center text-zinc-500 text-sm">
                No data available for the current period.
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data}>
                <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `₹${value / 1000}k`}
                />
                <Tooltip
                    cursor={{ fill: 'white', opacity: 0.05 }}
                    content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                            return (
                                <div className="rounded-xl border border-white/10 bg-black/80 backdrop-blur-md p-3 shadow-2xl">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">
                                            Collection
                                        </span>
                                        <span className="text-sm font-bold text-white">
                                            {formatCurrency(payload[0].value as number)}
                                        </span>
                                    </div>
                                </div>
                            )
                        }
                        return null
                    }}
                />
                <Bar
                    dataKey="total"
                    fill="url(#barGradient)"
                    radius={[10, 10, 0, 0]}
                    className="fill-purple-500"
                />
                <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#A855F7" />
                        <stop offset="100%" stopColor="#7C3AED" />
                    </linearGradient>
                </defs>
            </BarChart>
        </ResponsiveContainer>
    );
}
