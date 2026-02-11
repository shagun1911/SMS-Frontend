"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    FileText,
    Plus,
    Calendar,
    Clock,
    Search,
    Filter,
    Loader2,
    Trophy,
    BookOpen,
    Users,
    MoreVertical,
    CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/lib/api";

export default function ExamsPage() {
    const { data: examsData, isLoading } = useQuery({
        queryKey: ["exams-list"],
        queryFn: async () => {
            const res = await api.get("/exams");
            return res.data.data;
        }
    });

    const exams = examsData || [];

    return (
        <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                        Academic Examinations
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Schedule assessments, manage date-sheets, and publish results.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="gap-2 border-white/10 hover:bg-white/5 h-12 rounded-xl">
                        <Trophy className="h-4 w-4 text-amber-400" /> Merit List
                    </Button>
                    <Button className="bg-purple-600 hover:bg-purple-500 gap-2 font-bold h-12 rounded-xl shadow-lg shadow-purple-500/20">
                        <Plus className="h-4 w-4" /> New Examination
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="border-white/5 bg-neutral-900/50 backdrop-blur-xl p-6 border-l-4 border-l-purple-500">
                    <div className="flex items-center gap-4">
                        <div className="bg-purple-500/10 p-3 rounded-2xl">
                            <BookOpen className="h-6 w-6 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Active Assessments</p>
                            <h3 className="text-2xl font-bold text-white mt-0.5">04</h3>
                        </div>
                    </div>
                </Card>
                <Card className="border-white/5 bg-neutral-900/50 backdrop-blur-xl p-6 border-l-4 border-l-emerald-500">
                    <div className="flex items-center gap-4">
                        <div className="bg-emerald-500/10 p-3 rounded-2xl">
                            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Results Published</p>
                            <h3 className="text-2xl font-bold text-white mt-0.5">12</h3>
                        </div>
                    </div>
                </Card>
                <Card className="border-white/5 bg-neutral-900/50 backdrop-blur-xl p-6 border-l-4 border-l-amber-500">
                    <div className="flex items-center gap-4">
                        <div className="bg-amber-500/10 p-3 rounded-2xl">
                            <Users className="h-6 w-6 text-amber-400" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Average Score</p>
                            <h3 className="text-2xl font-bold text-white mt-0.5">78.4%</h3>
                        </div>
                    </div>
                </Card>
            </div>

            <Tabs defaultValue="upcoming" className="space-y-6">
                <div className="flex items-center justify-between bg-white/[0.02] p-1.5 rounded-2xl border border-white/5">
                    <TabsList className="bg-transparent border-0 gap-2">
                        <TabsTrigger value="upcoming" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-xl px-6 h-10 font-bold text-[10px] uppercase tracking-widest">Upcoming</TabsTrigger>
                        <TabsTrigger value="ongoing" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-xl px-6 h-10 font-bold text-[10px] uppercase tracking-widest">Ongoing</TabsTrigger>
                        <TabsTrigger value="completed" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-xl px-6 h-10 font-bold text-[10px] uppercase tracking-widest">Completed</TabsTrigger>
                    </TabsList>
                    <div className="flex items-center gap-3 px-2">
                        <div className="relative w-48">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-500" />
                            <Input placeholder="Search exam..." className="h-9 pl-8 text-xs bg-white/5 border-0 rounded-xl" />
                        </div>
                    </div>
                </div>

                <TabsContent value="upcoming" className="space-y-6 m-0">
                    {isLoading ? (
                        <div className="flex h-64 w-full items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            <Card className="border-white/5 bg-neutral-900/50 backdrop-blur-xl overflow-hidden group hover:border-purple-500/30 transition-all rounded-[2rem]">
                                <CardHeader className="p-6">
                                    <div className="flex items-start justify-between">
                                        <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[9px] font-bold uppercase tracking-widest">Half Yearly</Badge>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white rounded-lg">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <CardTitle className="mt-4 text-xl font-bold group-hover:text-purple-400 transition-colors uppercase tracking-tight">Term-I Examination</CardTitle>
                                    <CardDescription className="text-zinc-500 font-medium text-xs mt-1">Main subjective assessments for middle school.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-6 pt-0">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 text-xs font-bold text-zinc-300">
                                            <Calendar className="h-4 w-4 text-purple-500/60" /> 15th March - 25th March
                                        </div>
                                        <div className="flex items-center gap-3 text-xs font-bold text-zinc-300">
                                            <Clock className="h-4 w-4 text-purple-500/60" /> 09:00 AM - 12:00 PM
                                        </div>
                                        <div className="pt-4 border-t border-white/5 flex gap-2">
                                            <Button className="flex-1 bg-white/5 hover:bg-purple-600 text-purple-400 hover:text-white border border-white/10 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all h-10">
                                                View Schedule
                                            </Button>
                                            <Button variant="ghost" className="h-10 text-[10px] font-bold text-zinc-500 hover:text-white uppercase tracking-widest px-4">
                                                Edit
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Mock card for empty display */}
                            <Card className="border-white/5 bg-neutral-900/50 backdrop-blur-xl overflow-hidden group hover:border-purple-500/30 transition-all rounded-[2rem]">
                                <CardHeader className="p-6">
                                    <div className="flex items-start justify-between">
                                        <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[9px] font-bold uppercase tracking-widest">Unit Test</Badge>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white rounded-lg">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <CardTitle className="mt-4 text-xl font-bold group-hover:text-blue-400 transition-colors uppercase tracking-tight">UT-3 Assessment</CardTitle>
                                    <CardDescription className="text-zinc-500 font-medium text-xs mt-1">Internal class assessments for primary section.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-6 pt-0">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 text-xs font-bold text-zinc-300">
                                            <Calendar className="h-4 w-4 text-blue-500/60" /> 02nd April - 05th April
                                        </div>
                                        <div className="flex items-center gap-3 text-xs font-bold text-zinc-300">
                                            <Clock className="h-4 w-4 text-blue-500/60" /> 08:30 AM - 10:00 AM
                                        </div>
                                        <div className="pt-4 border-t border-white/5 flex gap-2">
                                            <Button className="flex-1 bg-white/5 hover:bg-blue-600 text-blue-400 hover:text-white border border-white/10 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all h-10">
                                                View Schedule
                                            </Button>
                                            <Button variant="ghost" className="h-10 text-[10px] font-bold text-zinc-500 hover:text-white uppercase tracking-widest px-4">
                                                Edit
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
