"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
    Search,
    Loader2,
    Mail,
    Phone,
    MoreVertical,
    UserPlus,
    IndianRupee,
    History,
    Trash2,
    AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { toast } from "sonner";

import { AddStaffModal } from "@/components/dashboard/add-staff-modal";
import { LockedFeatureGate } from "@/components/plan/locked-feature-gate";

interface StaffMember {
    _id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    baseSalary?: number;
    photo?: string;
    createdAt: string;
}

// ── Confirmation Dialog ───────────────────────────────────────────────────────
function ConfirmDeleteDialog({
    member,
    onConfirm,
    onCancel,
    isPending,
}: {
    member: StaffMember;
    onConfirm: () => void;
    onCancel: () => void;
    isPending: boolean;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <h2 className="mb-1 text-lg font-bold text-gray-900">Remove Staff Member?</h2>
                <p className="mb-1 text-sm text-gray-600">
                    You are about to permanently remove <span className="font-semibold">{member.name}</span> from the school.
                </p>
                <p className="mb-6 text-sm text-red-600 font-medium">
                    This will also delete all their salary records, salary structures, and bonus/adjustment entries. This cannot be undone.
                </p>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={onCancel}
                        disabled={isPending}
                        className="flex-1 rounded-xl"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={isPending}
                        className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold"
                    >
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Yes, Remove"}
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ── Three-dot Dropdown ────────────────────────────────────────────────────────
function StaffCardMenu({ onRemove }: { onRemove: () => void }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-gray-600 rounded-lg"
                onClick={() => setOpen((p) => !p)}
            >
                <MoreVertical className="h-4 w-4" />
            </Button>
            {open && (
                <div className="absolute right-0 top-9 z-20 w-52 rounded-xl border border-gray-100 bg-white py-1 shadow-lg">
                    <button
                        type="button"
                        onClick={() => { setOpen(false); onRemove(); }}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                        <Trash2 className="h-4 w-4" />
                        Remove from school
                    </button>
                </div>
            )}
        </div>
    );
}

// ── Staff Card ────────────────────────────────────────────────────────────────
interface StaffCardProps {
    member: StaffMember;
    onOpenProfile: (member: StaffMember) => void;
}

function StaffCard({ member, onOpenProfile }: StaffCardProps) {
    const queryClient = useQueryClient();
    const [confirmOpen, setConfirmOpen] = useState(false);

    const { data: salaryHistory } = useQuery({
        queryKey: ["staff-last-salary", member._id],
        queryFn: async () => {
            const res = await api.get(`/salaries/staff/${member._id}/history`);
            return res.data.data || [];
        },
        staleTime: 1000 * 60 * 5,
    });

    const lastPayment = Array.isArray(salaryHistory) && salaryHistory.length > 0
        ? salaryHistory.find((record: any) => record.status === "paid") || salaryHistory[0]
        : null;

    const lastPaidLabel = lastPayment
        ? `${lastPayment.month} ${lastPayment.year}`
        : "No payments yet";

    const lastPaidAmount = lastPayment ? `₹${lastPayment.netSalary}` : "—";

    const deleteMutation = useMutation({
        mutationFn: () => api.delete(`/users/${member._id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["staff-list"] });
            toast.success(`${member.name} has been removed`, {
                description: "All associated records have been deleted.",
            });
            setConfirmOpen(false);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message ?? "Failed to remove staff member");
        },
    });

    return (
        <>
            <Card className="border border-gray-200 bg-white overflow-hidden rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-14 w-14 border border-gray-200">
                                <AvatarImage src={member.photo} />
                                <AvatarFallback className="bg-indigo-100 text-indigo-600 font-semibold">
                                    {member.name.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h3 className="font-semibold text-lg text-gray-900">{member.name}</h3>
                                <Badge variant="secondary" className="mt-1 text-xs">
                                    {member.role.replace('_', ' ')}
                                </Badge>
                            </div>
                        </div>
                        <StaffCardMenu onRemove={() => setConfirmOpen(true)} />
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
                            <div className="bg-emerald-100 p-1.5 rounded-lg">
                                <IndianRupee className="h-3.5 w-3.5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Baseline</p>
                                <p className="text-sm font-semibold text-gray-900">₹{member.baseSalary || 0}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
                            <div className="bg-indigo-100 p-1.5 rounded-lg">
                                <History className="h-3.5 w-3.5 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Last Payment</p>
                                <p className="text-xs font-semibold text-gray-900">{lastPaidLabel}</p>
                                <p className="text-xs font-medium text-emerald-600">{lastPaidAmount}</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 space-y-2">
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                            <Mail className="h-3.5 w-3.5" />
                            {member.email}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                            <Phone className="h-3.5 w-3.5" />
                            {member.phone}
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-100">
                        <Button
                            onClick={() => onOpenProfile(member)}
                            className="h-10 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl"
                        >
                            Manage Payroll
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {confirmOpen && (
                <ConfirmDeleteDialog
                    member={member}
                    onConfirm={() => deleteMutation.mutate()}
                    onCancel={() => setConfirmOpen(false)}
                    isPending={deleteMutation.isPending}
                />
            )}
        </>
    );
}

// ── Staff Page ────────────────────────────────────────────────────────────────
const ROLE_TABS = [
    { label: "All", value: "all" },
    { label: "Teacher", value: "teacher" },
    { label: "Accountant", value: "accountant" },
    { label: "Transport Manager", value: "transport_manager" },
    { label: "School Admin", value: "schooladmin" },
] as const;

export default function StaffPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedRole, setSelectedRole] = useState<string>("all");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const router = useRouter();

    const { data: staffData, isLoading } = useQuery({
        queryKey: ["staff-list"],
        queryFn: async () => {
            const res = await api.get("/users");
            return res.data.data;
        }
    });

    const staff: StaffMember[] = staffData || [];

    const filteredStaff = staff.filter((member: any) => {
        const matchesRole = selectedRole === "all" || member.role === selectedRole;
        const matchesSearch =
            member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.role.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesRole && matchesSearch;
    });

    const countFor = (role: string) =>
        role === "all" ? staff.length : staff.filter((m) => m.role === role).length;

    return (
        <LockedFeatureGate featureKey="staff" featureLabel="Staff & payroll">
            <div className="flex-1 space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-xl sm:text-3xl font-bold tracking-tight text-gray-900">
                            Staff Directory
                        </h2>
                        <p className="text-gray-500 mt-1 text-sm">
                            Personnel management and automated monthly payroll processing.
                        </p>
                    </div>
                    <Button
                        onClick={() => setIsAddModalOpen(true)}
                        className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 gap-2 font-semibold shadow-sm rounded-xl h-12"
                    >
                        <UserPlus className="h-4 w-4" /> Register New Personnel
                    </Button>
                </div>

                {/* Role filter tabs */}
                <div className="flex flex-wrap gap-2">
                    {ROLE_TABS.map((tab) => {
                        const count = countFor(tab.value);
                        const active = selectedRole === tab.value;
                        return (
                            <button
                                key={tab.value}
                                type="button"
                                onClick={() => setSelectedRole(tab.value)}
                                className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-all ${active
                                        ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                                        : "bg-white border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600"
                                    }`}
                            >
                                {tab.label}
                                <span
                                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                                        }`}
                                >
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                        placeholder="Search personnel records..."
                        className="pl-10 bg-white border-gray-200 h-11 rounded-xl focus:ring-indigo-500/20"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {isLoading ? (
                    <div className="flex h-64 w-full items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    </div>
                ) : filteredStaff.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 bg-white border border-gray-200 rounded-2xl">
                        No {selectedRole === "all" ? "staff members" : ROLE_TABS.find(t => t.value === selectedRole)?.label.toLowerCase() + "s"} found{searchTerm ? " matching your search" : ""}.
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {filteredStaff.map((member: StaffMember) => (
                            <StaffCard
                                key={member._id}
                                member={member}
                                onOpenProfile={(selected) => router.push(`/staff/${selected._id}`)}
                            />
                        ))}
                    </div>
                )}

                <AddStaffModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                />
            </div>
        </LockedFeatureGate>
    );
}
