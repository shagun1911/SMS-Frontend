"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
    Search,
    Filter,
    Loader2,
    Mail,
    Phone,
    Shield,
    MoreVertical,
    UserPlus,
    IndianRupee,
    History
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

import { AddStaffModal } from "@/components/dashboard/add-staff-modal";

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

interface StaffCardProps {
    member: StaffMember;
    onOpenProfile: (member: StaffMember) => void;
}

function StaffCard({ member, onOpenProfile }: StaffCardProps) {
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

    return (
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
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600 rounded-lg">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
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

                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center gap-3">
                    <Button
                        onClick={() => onOpenProfile(member)}
                        className="h-10 flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl"
                    >
                        Manage Payroll
                    </Button>
                    <Button variant="outline" size="sm" className="h-10 px-4 text-xs text-gray-600 rounded-xl border-gray-200">
                        Docs
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

export default function StaffPage() {
    const [searchTerm, setSearchTerm] = useState("");
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

    const filteredStaff = staff.filter((member: any) =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                        Staff Directory
                    </h2>
                    <p className="text-gray-500 mt-1 text-sm">
                        Personnel management and automated monthly payroll processing.
                    </p>
                </div>
                <Button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-500 gap-2 font-semibold shadow-sm rounded-xl h-12"
                >
                    <UserPlus className="h-4 w-4" /> Register New Personnel
                </Button>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                        placeholder="Search personnel records..."
                        className="pl-10 bg-white border-gray-200 h-12 rounded-xl focus:ring-indigo-500/20"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button variant="outline" className="gap-2 border-gray-200 h-12 rounded-xl bg-white">
                    <Filter className="h-4 w-4" /> Filter Categories
                </Button>
            </div>

            {isLoading ? (
                <div className="flex h-64 w-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
            ) : filteredStaff.length === 0 ? (
                <div className="p-12 text-center text-gray-500 bg-white border border-gray-200 rounded-2xl">
                    No staff members found matching your search.
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
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
