"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    BookOpen,
    Plus,
    Users,
    Loader2,
    Edit2,
    Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import api from "@/lib/api";
import { LockedFeatureGate } from "@/components/plan/locked-feature-gate";

const SECTIONS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function ClassesPage() {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClass, setEditingClass] = useState<any>(null);
    const [className, setClassName] = useState("");
    const [section, setSection] = useState("A");
    const [roomNumber, setRoomNumber] = useState("");
    const [capacity, setCapacity] = useState("");
    const [studentsModalClass, setStudentsModalClass] = useState<any>(null);

    const { data: classes, isLoading } = useQuery({
        queryKey: ["classes-list"],
        queryFn: async () => {
            const res = await api.get("/classes");
            return res.data.data ?? [];
        },
    });

    const createClass = useMutation({
        mutationFn: async (data: any) => {
            const res = await api.post("/classes", data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["classes-list"] });
            toast.success("Class created successfully");
            resetForm();
            setIsModalOpen(false);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message ?? "Failed to create class");
        },
    });

    const updateClass = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const res = await api.patch(`/classes/${id}`, data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["classes-list"] });
            toast.success("Class updated successfully");
            resetForm();
            setIsModalOpen(false);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message ?? "Failed to update class");
        },
    });

    const deleteClass = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/classes/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["classes-list"] });
            toast.success("Class deleted successfully");
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message ?? "Failed to delete class");
        },
    });

    const resetForm = () => {
        setClassName("");
        setSection("A");
        setRoomNumber("");
        setCapacity("");
        setEditingClass(null);
    };

    const handleOpenModal = (cls?: any) => {
        if (cls) {
            setEditingClass(cls);
            setClassName(cls.className ?? "");
            setSection(cls.section ?? "A");
            setRoomNumber(cls.roomNumber ?? "");
            setCapacity(cls.capacity?.toString() ?? "");
        } else {
            resetForm();
        }
        setIsModalOpen(true);
    };

    const handleSubmit = () => {
        const payload = {
            className,
            section,
            roomNumber: roomNumber || undefined,
            capacity: capacity ? Number(capacity) : undefined,
        };
        if (editingClass) {
            updateClass.mutate({ id: editingClass._id, data: payload });
        } else {
            createClass.mutate(payload);
        }
    };

    return (
        <LockedFeatureGate featureKey="classes" featureLabel="Classes & sections">
        <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                        Classes & Sections
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Each class + section is a separate card (e.g. Class 4 A, Class 4 B).
                    </p>
                </div>
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogTrigger asChild>
                        <Button
                            className="gap-2 bg-indigo-600 hover:bg-indigo-500"
                            onClick={() => handleOpenModal()}
                        >
                            <Plus className="h-4 w-4" /> Add Class & Section
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>
                                {editingClass ? "Edit Class" : "Add New Class & Section"}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Class Name</Label>
                                <Input
                                    placeholder="e.g. 4, V, X"
                                    value={className}
                                    onChange={(e) => setClassName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Section</Label>
                                <select
                                    value={section}
                                    onChange={(e) => setSection(e.target.value)}
                                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                >
                                    {SECTIONS.map((s) => (
                                        <option key={s} value={s}>Section {s}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-muted-foreground">
                                    Class 4 + Section A and Class 4 + Section B are separate entries.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Room Number (Optional)</Label>
                                    <Input
                                        placeholder="e.g. 101"
                                        value={roomNumber}
                                        onChange={(e) => setRoomNumber(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Capacity (Optional)</Label>
                                    <Input
                                        type="number"
                                        placeholder="e.g. 40"
                                        value={capacity}
                                        onChange={(e) => setCapacity(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => setIsModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="flex-1 bg-indigo-600 hover:bg-indigo-500"
                                onClick={handleSubmit}
                                disabled={!className.trim() || createClass.isPending || updateClass.isPending}
                            >
                                {createClass.isPending || updateClass.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : editingClass ? (
                                    "Update"
                                ) : (
                                    "Create"
                                )}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {isLoading ? (
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {Array.isArray(classes) && classes.length > 0 ? (
                        classes.map((cls: any) => (
                            <Card
                                key={cls._id}
                                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                            >
                                <CardHeader className="border-b border-gray-100 bg-gradient-to-br from-indigo-50 to-white p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100">
                                                <BookOpen className="h-6 w-6 text-indigo-600" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-xl font-bold text-gray-900">
                                                    Class {cls.className} – Section {(cls.section ?? cls.sections?.[0] ?? "A")}
                                                </CardTitle>
                                                {cls.roomNumber && (
                                                    <p className="mt-0.5 text-xs text-gray-500">
                                                        Room {cls.roomNumber}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-gray-500 hover:bg-white hover:text-indigo-600"
                                                onClick={() => handleOpenModal(cls)}
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-gray-500 hover:text-red-600"
                                                onClick={() => {
                                                    if (confirm(`Delete Class ${cls.className} Section ${cls.section ?? cls.sections?.[0] ?? "A"}?`)) {
                                                        deleteClass.mutate(cls._id);
                                                    }
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="space-y-4">
                                        {cls.capacity && (
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Users className="h-4 w-4 text-gray-400" />
                                                <span>Capacity: {cls.capacity} students</span>
                                            </div>
                                        )}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="mt-3 w-full rounded-xl border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                                            onClick={() => setStudentsModalClass(cls)}
                                        >
                                            <Users className="mr-2 h-3.5 w-3.5" /> View Students
                                        </Button>
                                        {cls.classTeacherId && (
                                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs">
                                                <span className="text-gray-500">Class Teacher:</span>{" "}
                                                <span className="font-medium text-gray-900">
                                                    {(cls.classTeacherId as any)?.name ?? "—"}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="col-span-full rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
                            <BookOpen className="mx-auto h-12 w-12 text-gray-300" />
                            <p className="mt-4 text-sm font-medium text-gray-600">
                                No classes configured yet
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                                Add Class & Section (e.g. Class 4 A, then Class 4 B) to get started
                            </p>
                        </div>
                    )}
                </div>
            )}

            {studentsModalClass && (
                <ClassStudentsModal
                    classId={studentsModalClass._id}
                    className={studentsModalClass.className}
                    section={studentsModalClass.section ?? studentsModalClass.sections?.[0] ?? "A"}
                    onClose={() => setStudentsModalClass(null)}
                />
            )}
        </div>
        </LockedFeatureGate>
    );
}

function ClassStudentsModal({ classId, className, section, onClose }: { classId: string; className: string; section: string; onClose: () => void }) {
    const { data: students, isLoading } = useQuery({
        queryKey: ["class-students", classId],
        queryFn: async () => {
            const res = await api.get(`/classes/${classId}/students`);
            return res.data.data ?? [];
        },
    });
    return (
        <Dialog open={!!classId} onOpenChange={() => onClose()}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Class {className} – Section {section} – Students</DialogTitle>
                </DialogHeader>
                <div className="overflow-y-auto flex-1 min-h-0">
                    {isLoading ? (
                        <div className="flex h-32 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-indigo-500" /></div>
                    ) : (
                        <ul className="space-y-2">
                            {(students ?? []).map((s: any) => (
                                <li key={s._id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/50 px-4 py-2 text-sm">
                                    <span className="font-medium text-gray-900">{s.firstName} {s.lastName}</span>
                                    <span className="text-gray-500">Adm: {s.admissionNumber}</span>
                                </li>
                            ))}
                            {(students ?? []).length === 0 && (
                                <p className="py-8 text-center text-gray-500">No students in this class yet.</p>
                            )}
                        </ul>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
