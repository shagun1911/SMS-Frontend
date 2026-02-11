"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { SalaryActionModal } from "@/components/dashboard/salary-action-modal";

export default function StaffPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [salaryModalState, setSalaryModalState] = useState<{
        isOpen: boolean;
        staffId: string;
        staffName: string;
        baseSalary: number;
    }>({
        isOpen: false,
        staffId: "",
        staffName: "",
        baseSalary: 0
    });

    const { data: staffData, isLoading } = useQuery({
        queryKey: ["staff-list"],
        queryFn: async () => {
            const res = await api.get("/users");
            return res.data.data;
        }
    });

    const staff = staffData || [];

    const filteredStaff = staff.filter((member: any) =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                        Staff Directory
                    </h2>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">
                        Personnel management and automated monthly payroll processing.
                    </p>
                </div>
                <Button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-500 gap-2 font-bold shadow-lg shadow-blue-500/20 rounded-xl h-12"
                >
                    <UserPlus className="h-4 w-4" /> Register New Personnel
                </Button>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input
                        placeholder="Search personnel records..."
                        className="pl-10 bg-white/[0.02] border-white/10 h-12 rounded-xl focus:ring-blue-500/20"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button variant="outline" className="gap-2 border-white/10 h-12 rounded-xl bg-white/[0.02]">
                    <Filter className="h-4 w-4" /> Filter Categories
                </Button>
            </div>

            {isLoading ? (
                <div className="flex h-64 w-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
            ) : filteredStaff.length === 0 ? (
                <div className="p-12 text-center text-zinc-500 bg-white/[0.01] border border-white/5 rounded-[2rem]">
                    No staff members found matching your search.
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredStaff.map((member: any) => (
                        <Card key={member._id} className="border-white/5 bg-neutral-900/50 backdrop-blur-xl overflow-hidden group hover:border-blue-500/30 transition-all rounded-[2rem]">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-14 w-14 border border-white/10 ring-4 ring-blue-500/5">
                                            <AvatarImage src={member.photo} />
                                            <AvatarFallback className="bg-blue-500/10 text-blue-400 font-bold">
                                                {member.name.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h3 className="font-bold text-lg text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">{member.name}</h3>
                                            <Badge variant="outline" className="mt-1 text-[9px] font-bold uppercase tracking-[0.15em] border-blue-500/20 text-blue-400 bg-blue-500/5">
                                                {member.role.replace('_', ' ')}
                                            </Badge>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="text-zinc-500 hover:text-white rounded-xl">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="mt-6 grid grid-cols-2 gap-3">
                                    <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                                        <div className="bg-emerald-500/10 p-1.5 rounded-lg">
                                            <IndianRupee className="h-3.5 w-3.5 text-emerald-500" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Baseline</p>
                                            <p className="text-xs font-bold text-white">₹{member.baseSalary || 0}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                                        <div className="bg-purple-500/10 p-1.5 rounded-lg">
                                            <History className="h-3.5 w-3.5 text-purple-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Joined</p>
                                            <p className="text-xs font-bold text-white">
                                                {new Date(member.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 space-y-3">
                                    <div className="flex items-center gap-3 text-xs text-zinc-400 font-medium">
                                        <Mail className="h-3.5 w-3.5 text-zinc-600" />
                                        {member.email}
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-zinc-400 font-medium">
                                        <Phone className="h-3.5 w-3.5 text-zinc-600" />
                                        {member.phone}
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-3">
                                    <Button
                                        onClick={() => setSalaryModalState({
                                            isOpen: true,
                                            staffId: member._id,
                                            staffName: member.name,
                                            baseSalary: member.baseSalary || 0
                                        })}
                                        className="h-10 flex-1 bg-white/5 hover:bg-blue-600 hover:text-white border border-white/10 text-blue-400 font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all"
                                    >
                                        Manage Payroll
                                    </Button>
                                    <Button variant="ghost" className="h-10 px-4 text-[10px] text-zinc-500 font-bold hover:bg-white/5 uppercase tracking-widest rounded-xl">
                                        Docs
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <AddStaffModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
            />

            {salaryModalState.isOpen && (
                <SalaryActionModal
                    isOpen={salaryModalState.isOpen}
                    onClose={() => setSalaryModalState(prev => ({ ...prev, isOpen: false }))}
                    staffId={salaryModalState.staffId}
                    staffName={salaryModalState.staffName}
                    baseSalary={salaryModalState.baseSalary}
                />
            )}
        </div>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
