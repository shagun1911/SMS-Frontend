"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { BookOpen, Plus, Users, Loader2, Edit2, Trash2, ChevronRight, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { UserRole } from "@/types";
import { LockedFeatureGate } from "@/components/plan/locked-feature-gate";
import { ClassDetailView } from "@/components/classes/class-detail-view";

const SECTIONS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function ClassesPage() {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const isTeacher = user?.role === UserRole.TEACHER;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClass, setEditingClass] = useState<any>(null);
    const [className, setClassName] = useState("");
    const [section, setSection] = useState("A");
    const [roomNumber, setRoomNumber] = useState("");
    const [selectedClass, setSelectedClass] = useState<any>(null);

    const { data: classes, isLoading } = useQuery({
        queryKey: ["classes-list"],
        queryFn: async () => {
            const res = await api.get("/classes");
            return res.data.data ?? [];
        },
    });

    const createClass = useMutation({
        mutationFn: async (data: any) => (await api.post("/classes", data)).data,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["classes-list"] });
            toast.success("Class created successfully");
            resetForm();
            setIsModalOpen(false);
        },
        onError: (err: any) => toast.error(err.response?.data?.message ?? "Failed to create class"),
    });

    const updateClass = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => (await api.patch(`/classes/${id}`, data)).data,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["classes-list"] });
            toast.success("Class updated successfully");
            resetForm();
            setIsModalOpen(false);
        },
        onError: (err: any) => toast.error(err.response?.data?.message ?? "Failed to update class"),
    });

    const deleteClass = useMutation({
        mutationFn: async (id: string) => { await api.delete(`/classes/${id}`); },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["classes-list"] });
            toast.success("Class deleted successfully");
        },
        onError: (err: any) => toast.error(err.response?.data?.message ?? "Failed to delete class"),
    });

    const resetForm = () => { setClassName(""); setSection("A"); setRoomNumber(""); setEditingClass(null); };

    const handleOpenModal = (cls?: any) => {
        if (cls) {
            setEditingClass(cls);
            setClassName(cls.className ?? "");
            setSection(cls.section ?? "A");
            setRoomNumber(cls.roomNumber ?? "");
        } else { resetForm(); }
        setIsModalOpen(true);
    };

    const handleSubmit = () => {
        const payload = {
            className, section,
            roomNumber: roomNumber || undefined,
        };
        if (editingClass) updateClass.mutate({ id: editingClass._id, data: payload });
        else createClass.mutate(payload);
    };

    if (selectedClass) {
        return (
            <LockedFeatureGate featureKey="classes" featureLabel="Classes & sections">
                <ClassDetailView
                    classData={selectedClass}
                    onBack={() => setSelectedClass(null)}
                />
            </LockedFeatureGate>
        );
    }

    return (
        <LockedFeatureGate featureKey="classes" featureLabel="Classes & sections">
            <div className="flex-1 space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">Classes & Sections</h2>
                        <p className="mt-1 text-sm text-gray-500">Manage classes, sections, and view student rosters.</p>
                    </div>
                    {!isTeacher && (
                        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                            <DialogTrigger asChild>
                                <Button className="gap-2 bg-indigo-600 hover:bg-indigo-500 w-full sm:w-auto" onClick={() => handleOpenModal()}>
                                    <Plus className="h-4 w-4" /> Add Class & Section
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg">
                                <DialogHeader>
                                    <DialogTitle>{editingClass ? "Edit Class" : "Add New Class & Section"}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Class Name</Label>
                                        <Input placeholder="e.g. 4, V, X" value={className} onChange={(e) => setClassName(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Section</Label>
                                        <select value={section} onChange={(e) => setSection(e.target.value)}
                                            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                            {SECTIONS.map((s) => (<option key={s} value={s}>Section {s}</option>))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Room Number (Optional)</Label>
                                        <Input placeholder="e.g. 101" value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                                    <Button className="flex-1 bg-indigo-600 hover:bg-indigo-500" onClick={handleSubmit}
                                        disabled={!className.trim() || createClass.isPending || updateClass.isPending}>
                                        {createClass.isPending || updateClass.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : editingClass ? "Update" : "Create"}
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>

                {isLoading ? (
                    <div className="flex h-64 items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {Array.isArray(classes) && classes.length > 0 ? (
                            classes.map((cls: any) => {
                                const sec = cls.section ?? cls.sections?.[0] ?? "A";
                                return (
                                    <Card
                                        key={cls._id}
                                        className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md hover:border-indigo-200 cursor-pointer group"
                                        onClick={() => setSelectedClass(cls)}
                                    >
                                        <CardHeader className="border-b border-gray-100 bg-gradient-to-br from-indigo-50 to-white p-5">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 group-hover:bg-indigo-200 transition-colors">
                                                        <BookOpen className="h-5 w-5 text-indigo-600" />
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-lg font-bold text-gray-900">
                                                            Class {cls.className} – {sec}
                                                        </CardTitle>
                                                        {cls.roomNumber && <p className="text-xs text-gray-500">Room {cls.roomNumber}</p>}
                                                    </div>
                                                </div>
                                                {!isTeacher && (
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-indigo-600" onClick={() => handleOpenModal(cls)}>
                                                            <Edit2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600"
                                                            onClick={() => { if (confirm(`Delete Class ${cls.className} Section ${sec}?`)) deleteClass.mutate(cls._id); }}>
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Users className="h-4 w-4" />
                                                View students
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                                        </CardContent>
                                    </Card>
                                );
                            })
                        ) : (
                            <div className="col-span-full rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
                                <BookOpen className="mx-auto h-12 w-12 text-gray-300" />
                                <p className="mt-4 text-sm font-medium text-gray-600">No classes configured yet</p>
                                <p className="mt-1 text-xs text-gray-500">Add Class & Section to get started</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </LockedFeatureGate>
    );
}

