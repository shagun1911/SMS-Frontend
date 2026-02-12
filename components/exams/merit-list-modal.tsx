"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Trophy, Medal, Award } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";

interface MeritListModalProps {
    exam: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function MeritListModal({ exam, open, onOpenChange }: MeritListModalProps) {
    const [classFilter, setClassFilter] = useState("");

    const { data: meritList, isLoading } = useQuery({
        queryKey: ["merit-list", exam?._id, classFilter],
        queryFn: async () => {
            const url = classFilter
                ? `/exams/${exam._id}/merit?classFilter=${classFilter}`
                : `/exams/${exam._id}/merit`;
            const res = await api.get(url);
            return res.data.data ?? [];
        },
        enabled: open && !!exam,
    });

    const getRankIcon = (rank: number) => {
        if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
        if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
        if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />;
        return null;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Merit List - {exam?.title}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="flex items-center gap-4">
                        <select
                            className="flex h-10 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                            value={classFilter}
                            onChange={(e) => setClassFilter(e.target.value)}
                        >
                            <option value="">All Classes</option>
                            {exam?.classes?.map((cls: string) => (
                                <option key={cls} value={cls}>
                                    Class {cls}
                                </option>
                            ))}
                        </select>
                    </div>

                    {isLoading ? (
                        <div className="flex h-64 items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {Array.isArray(meritList) && meritList.length > 0 ? (
                                meritList.map((result: any, idx: number) => (
                                    <div
                                        key={result._id}
                                        className={`flex items-center gap-4 rounded-lg border p-4 ${
                                            idx < 3
                                                ? "border-indigo-200 bg-indigo-50"
                                                : "border-gray-200 bg-white"
                                        }`}
                                    >
                                        <div className="flex w-12 items-center justify-center">
                                            {getRankIcon(result.rank) || (
                                                <span className="text-lg font-bold text-gray-700">
                                                    {result.rank}
                                                </span>
                                            )}
                                        </div>
                                        <Avatar className="h-12 w-12">
                                            <AvatarImage src={result.studentId?.photo} />
                                            <AvatarFallback className="bg-indigo-100 text-indigo-600">
                                                {result.studentId?.firstName?.charAt(0)}
                                                {result.studentId?.lastName?.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-900">
                                                {result.studentId?.firstName} {result.studentId?.lastName}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {result.studentId?.admissionNumber} • Class {result.class}{" "}
                                                {result.section}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-indigo-600">
                                                {result.percentage.toFixed(2)}%
                                            </p>
                                            <Badge className="mt-1 bg-emerald-100 text-emerald-700">
                                                {result.grade}
                                            </Badge>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
                                    <Trophy className="mx-auto h-12 w-12 text-gray-300" />
                                    <p className="mt-4 text-sm text-gray-600">No results available yet</p>
                                    <p className="mt-1 text-xs text-gray-500">
                                        Enter marks first to generate merit list
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
