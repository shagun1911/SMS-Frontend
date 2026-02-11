"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    CalendarDays,
    Search,
    Filter,
    CheckCircle2,
    XCircle,
    Clock,
    UserCheck,
    Loader2,
    Calendar,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import api from "@/lib/api";

export default function AttendancePage() {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedClass, setSelectedClass] = useState("V");

    const { data: attendanceData, isLoading } = useQuery({
        queryKey: ["attendance", selectedDate, selectedClass],
        queryFn: async () => {
            const res = await api.get(`/attendance?date=${selectedDate}&class=${selectedClass}`);
            return res.data.data;
        }
    });

    const students = attendanceData || [];

    return (
        <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-400 to-rose-400 bg-clip-text text-transparent">
                        Daily Attendance
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Monitor student presence and manage daily attendance records.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Input
                            type="date"
                            className="h-8 border-0 bg-transparent text-xs font-bold w-32 focus-visible:ring-0"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                    <Button className="bg-rose-600 hover:bg-rose-500 gap-2 font-bold rounded-xl shadow-lg shadow-rose-500/20">
                        <UserCheck className="h-4 w-4" /> Submit Records
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-4">
                <Card className="border-white/5 bg-neutral-900/50 backdrop-blur-xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                    </div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Present</p>
                    <h3 className="text-3xl font-bold text-emerald-400 mt-2">412</h3>
                    <p className="text-[10px] text-emerald-500/60 font-medium mt-1">94% of total students</p>
                </Card>
                <Card className="border-white/5 bg-neutral-900/50 backdrop-blur-xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <XCircle className="h-12 w-12 text-rose-500" />
                    </div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Absent</p>
                    <h3 className="text-3xl font-bold text-rose-500 mt-2">18</h3>
                    <p className="text-[10px] text-rose-500/60 font-medium mt-1">4% of total students</p>
                </Card>
                <Card className="border-white/5 bg-neutral-900/50 backdrop-blur-xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Clock className="h-12 w-12 text-amber-500" />
                    </div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Late Arrival</p>
                    <h3 className="text-3xl font-bold text-amber-400 mt-2">06</h3>
                    <p className="text-[10px] text-amber-500/60 font-medium mt-1">Delayed check-ins</p>
                </Card>
                <Card className="border-white/5 bg-neutral-900/50 backdrop-blur-xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Calendar className="h-12 w-12 text-blue-500" />
                    </div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Avg. Monthly</p>
                    <h3 className="text-3xl font-bold text-blue-400 mt-2">96.2%</h3>
                    <p className="text-[10px] text-blue-500/60 font-medium mt-1">Academic year avg</p>
                </Card>
            </div>

            <Card className="border-white/5 bg-neutral-900/50 backdrop-blur-xl overflow-hidden rounded-[2rem]">
                <CardHeader className="border-b border-white/5 bg-white/[0.01] p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <CalendarDays className="h-5 w-5 text-rose-400" /> Student List
                            </CardTitle>
                            <Badge variant="outline" className="bg-rose-500/5 text-rose-400 border-rose-500/20 h-6 px-3">
                                Class {selectedClass}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                                <Input
                                    placeholder="Search student..."
                                    className="h-10 pl-9 text-xs bg-white/[0.02] border-white/10 rounded-xl"
                                />
                            </div>
                            <Button variant="outline" className="h-10 border-white/10 rounded-xl bg-white/[0.02] gap-2 text-xs font-bold">
                                <Filter className="h-4 w-4" /> Filters
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-white/[0.02]">
                            <TableRow className="border-white/5 hover:bg-transparent">
                                <TableHead className="text-zinc-500 font-bold uppercase text-[10px] pl-6">Student</TableHead>
                                <TableHead className="text-zinc-500 font-bold uppercase text-[10px]">Roll No</TableHead>
                                <TableHead className="text-zinc-500 font-bold uppercase text-[10px]">Mark Attendance</TableHead>
                                <TableHead className="text-zinc-500 font-bold uppercase text-[10px]">Monthly Avg</TableHead>
                                <TableHead className="text-zinc-500 font-bold uppercase text-[10px] text-right pr-6">Remarks</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-64 text-center">
                                        <Loader2 className="h-8 w-8 animate-spin text-rose-500 mx-auto" />
                                    </TableCell>
                                </TableRow>
                            ) : students.length === 0 ? (
                                [1, 2, 3, 4, 5].map((i) => (
                                    <TableRow key={i} className="border-white/5 hover:bg-white/[0.01]">
                                        <TableCell className="pl-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10 border border-white/10">
                                                    <AvatarFallback className="bg-rose-500/10 text-rose-400 font-bold">S</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-bold text-sm text-white">Student Name {i}</div>
                                                    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">ADM: #2400{i}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs text-white">0{i}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button size="sm" className="h-8 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 border border-emerald-500/20 hover:text-white transition-all text-[10px] font-bold">P</Button>
                                                <Button size="sm" variant="ghost" className="h-8 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 border border-rose-500/20 hover:text-white transition-all text-[10px] font-bold">A</Button>
                                                <Button size="sm" variant="ghost" className="h-8 rounded-lg bg-amber-500/10 text-amber-500 hover:bg-amber-500 border border-amber-500/20 hover:text-white transition-all text-[10px] font-bold">L</Button>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-24 bg-white/5 rounded-full overflow-hidden">
                                                    <div className="h-full bg-rose-500 rounded-full" style={{ width: '92%' }}></div>
                                                </div>
                                                <span className="text-[10px] font-bold text-white">92%</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-white text-[10px] font-bold">Add Note</Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : null}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
