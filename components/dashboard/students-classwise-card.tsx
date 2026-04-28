"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { Pie, PieChart, ResponsiveContainer, Cell, Tooltip } from "recharts";

interface ClassCount {
  class: string;
  count: number;
}

const COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#f43f5e", // rose
  "#f97316", // orange
  "#eab308", // yellow
  "#84cc16", // lime
  "#22c55e", // green
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#0ea5e9", // sky
  "#3b82f6", // blue
];

export function StudentsClasswiseCard() {
  const [hoveredClass, setHoveredClass] = useState<string | null>(null);

  const { data: classCounts = [], isLoading } = useQuery({
    queryKey: ["students-counts-by-class"],
    queryFn: async () => {
      const res = await api.get("/students/counts-by-class");
      return res.data.data as ClassCount[];
    },
  });

  const totalStudents = classCounts.reduce((sum, item) => sum + item.count, 0);
  const chartData = classCounts.map((item, index) => ({
    name: item.class,
    value: item.count,
    color: COLORS[index % COLORS.length],
  }));

  const selectedClassData = hoveredClass
    ? classCounts.find((c) => c.class === hoveredClass)
    : classCounts[0];

  if (isLoading) {
    return (
      <Card className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-card">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-[hsl(var(--muted-foreground))]">
            <Users className="h-4 w-4 text-primary" />
            Total Students
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-muted rounded-lg w-1/3" />
            <div className="h-48 bg-muted rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-[hsl(var(--muted-foreground))]">
            <Users className="h-4 w-4 text-primary" />
            Total Students
          </CardTitle>
          <span className="text-3xl font-bold text-[hsl(var(--foreground))]">
            {totalStudents}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {chartData.length > 0 ? (
            <>
              <div className="relative h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      onMouseEnter={(entry) => setHoveredClass(entry.name)}
                      onMouseLeave={() => setHoveredClass(null)}
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke={hoveredClass && hoveredClass !== entry.name ? "transparent" : "white"}
                          strokeWidth={3}
                          style={{
                            opacity: hoveredClass && hoveredClass !== entry.name ? 0.3 : 1,
                            transition: "opacity 0.2s ease",
                          }}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                              <p className="font-semibold text-sm">{payload[0].name}</p>
                              <p className="text-sm text-muted-foreground">
                                {payload[0].value} students
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {((payload[0].value / totalStudents) * 100).toFixed(1)}%
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Center overlay showing selected class */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {selectedClassData?.class || 'N/A'}
                    </p>
                    <p className="text-3xl font-bold text-[hsl(var(--foreground))]">
                      {selectedClassData?.count || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Class list */}
              <div className="space-y-2">
                {chartData.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-[hsl(var(--muted))]/50 transition-colors cursor-pointer"
                    onMouseEnter={() => setHoveredClass(item.name)}
                    onMouseLeave={() => setHoveredClass(null)}
                    style={{
                      backgroundColor: hoveredClass === item.name ? "hsl(var(--muted) / 0.5)" : "transparent",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm font-medium text-[hsl(var(--foreground))]">
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-[hsl(var(--foreground))]">
                        {item.value}
                      </span>
                      <span className="text-xs text-muted-foreground w-12 text-right">
                        {((item.value / totalStudents) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No student data available</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
