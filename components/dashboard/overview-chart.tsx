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
                    stroke="#6b7280"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    stroke="#6b7280"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `₹${value / 1000}k`}
                />
                <Tooltip
                    cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }}
                    content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                            return (
                                <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-lg">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs font-medium text-gray-500">
                                            Collection
                                        </span>
                                        <span className="text-sm font-bold text-gray-900">
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
                    radius={[8, 8, 0, 0]}
                />
                <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#4f46e5" />
                    </linearGradient>
                </defs>
            </BarChart>
        </ResponsiveContainer>
    );
}
