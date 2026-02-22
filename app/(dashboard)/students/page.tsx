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
    Loader2,
    Upload,
    Download
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { AddStudentModal } from "@/components/dashboard/add-student-modal";
import { LockedFeatureGate } from "@/components/plan/locked-feature-gate";

function parseCSV(text: string): Record<string, string>[] {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
    return lines.slice(1).map((line) => {
        const values = line.split(",").map((v) => v.trim());
        const row: Record<string, string> = {};
        headers.forEach((h, i) => { row[h] = values[i] ?? ""; });
        return row;
    });
}

export default function StudentsPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const importMutation = useMutation({
        mutationFn: async (rows: Record<string, string>[]) => {
            const mapped = rows.map((r) => {
                // Capitalize gender value to match backend enum (Male, Female, Other)
                const gender = r.gender || "Male";
                const capitalizedGender = gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
                
                return {
                    firstName: r.firstname || r.first_name,
                    lastName: r.lastname || r.last_name,
                    fatherName: r.fathername || r.father_name,
                    motherName: r.mothername || r.mother_name,
                    class: r.class || "I",
                    section: r.section || "A",
                    phone: r.phone || r.fatherphone,
                    gender: capitalizedGender,
                    address: {
                        street: r.address || r.street || "",
                        city: r.city || "",
                        state: r.state || "",
                        pincode: r.pincode || "",
                    },
                    dateOfBirth: r.dob || r.dateofbirth || new Date().toISOString().slice(0, 10),
                };
            });
            const res = await api.post("/students/import", mapped);
            return res.data;
        },
        onSuccess: (data: any) => {
            queryClient.invalidateQueries({ queryKey: ["students"] });
            toast.success(data?.message ?? `Imported ${data?.data?.created ?? 0} students`);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message ?? "Import failed");
        },
    });

    const handleExportCSV = () => {
        const headers = ["admissionNumber", "firstName", "lastName", "class", "section", "phone", "fatherName", "motherName"];
        const list = data?.data ?? [];
        const rows = list.map((s: any) =>
            headers.map((h) => (s[h] ?? "").toString().replace(/,/g, ";")).join(",")
        );
        const csv = [headers.join(","), ...rows].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `students-export-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Export downloaded");
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            const text = String(reader.result);
            const rows = parseCSV(text);
            if (rows.length === 0) {
                toast.error("No valid rows in CSV. Use headers: firstname, lastname, class, section, phone, etc.");
                return;
            }
            importMutation.mutate(rows);
        };
        reader.readAsText(file);
        e.target.value = "";
    };

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
        <LockedFeatureGate featureKey="students" featureLabel="Students">
        <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                        Student Directory
                    </h2>
                    <p className="text-gray-500 mt-1">
                        Manage enrollments, academic records and student profiles.
                    </p>
                </div>
                <div className="flex gap-2">
                    <input
                        type="file"
                        accept=".csv"
                        className="hidden"
                        id="csv-import"
                        onChange={handleFileChange}
                    />
                    <Button
                        variant="outline"
                        className="gap-2 border-gray-200"
                        onClick={handleExportCSV}
                    >
                        <Download className="h-4 w-4" /> Export CSV
                    </Button>
                    <Button
                        variant="outline"
                        className="gap-2 border-gray-200"
                        onClick={() => document.getElementById("csv-import")?.click()}
                        disabled={importMutation.isPending}
                    >
                        {importMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        Import CSV
                    </Button>
                    <Button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-indigo-600 hover:bg-indigo-500 gap-2 font-bold shadow-sm"
                    >
                        <Plus className="h-4 w-4" /> Add Student
                    </Button>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input
                        placeholder="Search by name or admission no..."
                        className="pl-10 bg-white border-gray-200 h-12 rounded-xl focus:ring-indigo-500/20"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Button variant="outline" className="gap-2 border-gray-200 h-12 rounded-xl bg-white">
                    <Filter className="h-4 w-4" /> Filter
                </Button>
            </div>

            <Card className="border border-gray-200 bg-white rounded-2xl overflow-hidden shadow-sm">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-gray-50">
                            <TableRow className="border-gray-100 hover:bg-transparent">
                                <TableHead className="py-4 pl-6 font-semibold text-gray-500 text-xs">Admission No</TableHead>
                                <TableHead className="py-4 font-semibold text-gray-500 text-xs">Student Details</TableHead>
                                <TableHead className="py-4 font-semibold text-gray-500 text-xs">Class & Section</TableHead>
                                <TableHead className="py-4 font-semibold text-gray-500 text-xs">Academic Status</TableHead>
                                <TableHead className="py-4 pr-6 text-right font-semibold text-gray-500 text-xs">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-64 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                                            <span className="text-sm text-gray-500">Retrieving student records...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : students.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-64 text-center text-gray-500">
                                        No students found matching your criteria.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                students.map((student: any) => (
                                    <TableRow key={student._id} className="border-gray-100 hover:bg-gray-50/50 transition-colors group">
                                        <TableCell className="pl-6 font-mono text-gray-500 text-xs">
                                            {student.admissionNumber}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-4 py-2">
                                                <Avatar className="h-10 w-10 border border-gray-200">
                                                    <AvatarImage src={student.photo} />
                                                    <AvatarFallback className="bg-indigo-100 text-indigo-600">
                                                        {student.firstName.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-white group-hover:text-purple-400 transition-colors">
                                                        {student.firstName} {student.lastName}
                                                    </span>
                                                    <span className="text-xs text-gray-500">{student.phone}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="border-gray-200 bg-gray-50 text-gray-600">
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
                                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900">
                                                    <FileEdit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600">
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
            <div className="flex items-center justify-between px-2 text-gray-500">
                <p className="text-sm">Showing {students.length} of {data?.pagination?.total || 0} students</p>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg border-gray-200 bg-white"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg border-gray-200 bg-white"
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
        </LockedFeatureGate>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
