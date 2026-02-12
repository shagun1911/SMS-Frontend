"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface GenderRatioChartProps {
    male: number;
    female: number;
}

export function GenderRatioChart({ male, female }: GenderRatioChartProps) {
    const data = [
        { name: "Male", value: male, color: "#3b82f6" },
        { name: "Female", value: female, color: "#ec4899" },
    ];

    const total = male + female;

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
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip />
                </PieChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-around">
                <div className="text-center">
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-blue-500" />
                        <span className="text-xs font-medium text-gray-600">Male</span>
                    </div>
                    <p className="mt-1 text-xl font-bold text-gray-900">{male}</p>
                    <p className="text-xs text-gray-500">
                        {total > 0 ? ((male / total) * 100).toFixed(1) : 0}%
                    </p>
                </div>
                <div className="h-12 w-px bg-gray-200" />
                <div className="text-center">
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-pink-500" />
                        <span className="text-xs font-medium text-gray-600">Female</span>
                    </div>
                    <p className="mt-1 text-xl font-bold text-gray-900">{female}</p>
                    <p className="text-xs text-gray-500">
                        {total > 0 ? ((female / total) * 100).toFixed(1) : 0}%
                    </p>
                </div>
            </div>
        </div>
    );
}
