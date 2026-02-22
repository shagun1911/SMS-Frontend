"use client";

import { useQuery } from "@tanstack/react-query";
import { BarChart3, Loader2, Users, GraduationCap } from "lucide-react";
import { Card } from "@/components/ui/card";
import api from "@/lib/api";

export default function MasterUsageReportsPage() {
    const { data, isLoading } = useQuery({
        queryKey: ["master-usage-reports"],
        queryFn: async () => {
            const res = await api.get("/master/usage-reports");
            return res.data?.data?.reports ?? [];
        },
    });

    const reports = data ?? [];
    const totalStudents = reports.reduce((s: number, r: any) => s + (r.studentsUsed ?? 0), 0);
    const totalTeachers = reports.reduce((s: number, r: any) => s + (r.teachersUsed ?? 0), 0);

    if (isLoading) {
        return (
            <div className="flex h-[80vh] w-full items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Usage reports</h1>
                <p className="mt-1 text-sm text-muted-foreground">Platform usage analytics.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
                <Card className="rounded-2xl p-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <GraduationCap className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total students</p>
                            <p className="text-2xl font-bold">{totalStudents.toLocaleString()}</p>
                        </div>
                    </div>
                </Card>
                <Card className="rounded-2xl p-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Users className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total teachers</p>
                            <p className="text-2xl font-bold">{totalTeachers.toLocaleString()}</p>
                        </div>
                    </div>
                </Card>
                <Card className="rounded-2xl p-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <BarChart3 className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Organizations</p>
                            <p className="text-2xl font-bold">{reports.length}</p>
                        </div>
                    </div>
                </Card>
            </div>

            <Card className="overflow-hidden rounded-2xl">
                <div className="border-b px-6 py-4">
                    <h2 className="font-semibold">Usage by organization</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/50 text-left font-medium text-muted-foreground">
                                <th className="p-4">Organization</th>
                                <th className="p-4">Plan</th>
                                <th className="p-4">Students (used / limit)</th>
                                <th className="p-4">Teachers (used / limit)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reports.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-muted-foreground">No data.</td>
                                </tr>
                            ) : (
                                reports.map((r: any) => (
                                    <tr key={r.schoolId} className="border-b hover:bg-muted/30">
                                        <td className="p-4">
                                            <div className="font-medium">{r.schoolName}</div>
                                            <div className="text-xs text-muted-foreground">{r.schoolCode}</div>
                                        </td>
                                        <td className="p-4">{r.planName}</td>
                                        <td className="p-4">
                                            <span className={r.studentsLimit > 0 && r.studentsUsed >= r.studentsLimit ? "font-medium text-destructive" : ""}>
                                                {r.studentsUsed} / {r.studentsLimit || "—"}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={r.teachersLimit > 0 && r.teachersUsed >= r.teachersLimit ? "font-medium text-destructive" : ""}>
                                                {r.teachersUsed} / {r.teachersLimit || "—"}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
