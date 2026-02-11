"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Plus,
    Search,
    Filter,
    MoreHorizontal,
    FileEdit,
    Trash2,
    Loader2
} from "lucide-react";
import api from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { AddStudentModal } from "@/components/dashboard/add-student-modal";

export default function StudentsPage() {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Fetch students
    const { data, isLoading } = useQuery({
        queryKey: ["students", page, search],
        queryFn: async () => {
            const res = await api.get(`/students?page=${page}&limit=10&search=${search}`);
            return res.data;
        },
    });

    const students = data?.data || [];

    return (
        <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Student Directory
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Manage enrollments, academic records and student profiles.
                    </p>
                </div>
                <Button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-purple-600 hover:bg-purple-500 gap-2 font-bold shadow-lg shadow-purple-500/20"
                >
                    <Plus className="h-4 w-4" /> Add Student
                </Button>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input
                        placeholder="Search by name or admission no..."
                        className="pl-10 bg-white/[0.02] border-white/10 h-12 rounded-xl focus:ring-purple-500/20"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Button variant="outline" className="gap-2 border-white/10 h-12 rounded-xl">
                    <Filter className="h-4 w-4" /> Filter
                </Button>
            </div>

            <Card className="border-white/5 bg-neutral-900/50 backdrop-blur-xl rounded-[2rem] overflow-hidden">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-white/[0.02]">
                            <TableRow className="border-white/5 hover:bg-transparent">
                                <TableHead className="py-6 pl-8 font-bold text-zinc-400 uppercase tracking-widest text-[10px]">Admission No</TableHead>
                                <TableHead className="py-6 font-bold text-zinc-400 uppercase tracking-widest text-[10px]">Student Details</TableHead>
                                <TableHead className="py-6 font-bold text-zinc-400 uppercase tracking-widest text-[10px]">Class & Section</TableHead>
                                <TableHead className="py-6 font-bold text-zinc-400 uppercase tracking-widest text-[10px]">Academic Status</TableHead>
                                <TableHead className="py-6 pr-8 text-right font-bold text-zinc-400 uppercase tracking-widest text-[10px]">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-64 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                                            <span className="text-sm text-zinc-500">Retrieving student records...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : students.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-64 text-center text-zinc-500">
                                        No students found matching your criteria.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                students.map((student: any) => (
                                    <TableRow key={student._id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                                        <TableCell className="pl-8 font-mono text-zinc-400 text-xs">
                                            {student.admissionNumber}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-4 py-2">
                                                <Avatar className="h-10 w-10 border border-white/10 group-hover:border-purple-500/50 transition-colors">
                                                    <AvatarImage src={student.photo} />
                                                    <AvatarFallback className="bg-purple-500/10 text-purple-400">
                                                        {student.firstName.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-white group-hover:text-purple-400 transition-colors">
                                                        {student.firstName} {student.lastName}
                                                    </span>
                                                    <span className="text-xs text-zinc-500">{student.phone}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="border-white/10 bg-white/5 text-zinc-300">
                                                    Class {student.class}
                                                </Badge>
                                                <Badge variant="outline" className="border-purple-500/20 bg-purple-500/5 text-purple-400">
                                                    Sec {student.section}
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                className={cn(
                                                    "capitalize px-3 py-1 rounded-full text-[10px] font-bold tracking-wider",
                                                    student.status === "active"
                                                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                                        : student.status === "pending_fees"
                                                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                                                )}
                                            >
                                                {student.status.replace("_", " ")}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="pr-8 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white">
                                                    <FileEdit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-red-500/10 text-zinc-400 hover:text-red-400">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Pagination */}
            <div className="flex items-center justify-between px-2 text-zinc-500">
                <p className="text-xs">Showing {students.length} of {data?.pagination?.total || 0} students</p>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl border-white/10 bg-white/5"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl border-white/10 bg-white/5"
                        onClick={() => setPage((p) => p + 1)}
                        disabled={!data?.pagination || page >= data.pagination.pages}
                    >
                        Next
                    </Button>
                </div>
            </div>

            <AddStudentModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
            />
        </div>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
