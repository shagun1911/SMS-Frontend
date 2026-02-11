"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Building2,
    Plus,
    Search,
    MoreVertical,
    CheckCircle2,
    XCircle,
    TrendingUp,
    ShieldAlert,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import api from "@/lib/api";

export default function ManageSchoolsPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const queryClient = useQueryClient();

    const { data: schoolsResponse, isLoading } = useQuery({
        queryKey: ["master-schools"],
        queryFn: async () => {
            const res = await api.get("/master/schools");
            return res.data;
        }
    });

    const updateSchoolMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const res = await api.patch(`/master/schools/${id}`, data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["master-schools"] });
            toast.success("School status updated successfully.");
        },
        onError: () => {
            toast.error("Failed to update school status.");
        }
    });

    const schools = schoolsResponse?.data || [];

    if (isLoading) {
        return (
            <div className="flex h-[80vh] w-full items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                        Global Institution Registry
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Authoritative control over all registered schools and their operational status.
                    </p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-500 gap-2">
                    <Plus className="h-4 w-4" /> Register New School
                </Button>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input
                        placeholder="Search institutions..."
                        className="pl-10 bg-white/[0.02] border-white/10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Global Status:</span>
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Normal Operations</span>
                </div>
            </div>

            <div className="grid gap-6">
                {schools.length === 0 ? (
                    <div className="p-12 text-center text-zinc-500 bg-white/[0.01] border border-white/5 rounded-3xl">
                        No schools registered in the ecosystem yet.
                    </div>
                ) : (
                    schools.map((school: any) => (
                        <Card key={school._id} className="border-white/5 bg-neutral-900/50 backdrop-blur-xl overflow-hidden group hover:border-blue-500/50 transition-all">
                            <div className="p-6 flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div className="h-14 w-14 rounded-2xl bg-blue-600/10 flex items-center justify-center border border-blue-500/20">
                                        <Building2 className="h-7 w-7 text-blue-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                                            {school.schoolName}
                                        </h3>
                                        <div className="flex items-center gap-4 mt-1">
                                            <span className="text-xs text-zinc-500 flex items-center gap-1">
                                                🌍 {school.address.city}, {school.address.state}
                                            </span>
                                            <span className="text-xs font-bold bg-zinc-800 px-2 py-0.5 rounded text-zinc-400 uppercase tracking-wider">
                                                {school.subscriptionPlan} Plan
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-12">
                                    <div className="text-right">
                                        <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Students</p>
                                        <p className="text-lg font-mono font-bold text-white">{school.studentLimit}</p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Button
                                            onClick={() => updateSchoolMutation.mutate({ id: school._id, data: { isActive: !school.isActive } })}
                                            className={school.isActive ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20" : "bg-red-500/10 text-red-400 hover:bg-red-500/20"}
                                        >
                                            {school.isActive ? <CheckCircle2 className="h-4 w-4 mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
                                            {school.isActive ? "Active" : "Suspended"}
                                        </Button>

                                        <Button variant="ghost" size="icon" className="text-zinc-500 hover:text-white">
                                            <MoreVertical className="h-5 w-5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            <div className={`h-1 w-full ${school.isActive ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                                <div className={`h-full ${school.isActive ? 'bg-emerald-500' : 'bg-red-500'} w-[100%] transition-all duration-1000`} />
                            </div>
                        </Card>
                    ))
                )}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-yellow-500/20 bg-yellow-500/5 p-6 flex items-start gap-4">
                    <ShieldAlert className="h-6 w-6 text-yellow-500 shrink-0" />
                    <div>
                        <h4 className="font-bold text-yellow-500">Security Notice</h4>
                        <p className="text-sm text-yellow-500/70 mt-1">
                            Disabling or deleting a school registry is an irreversible action. All tenant data, including students, staff, and financial records, will be archived immediately.
                        </p>
                    </div>
                </Card>

                <Card className="border-blue-500/20 bg-blue-500/5 p-6 flex items-start gap-4">
                    <TrendingUp className="h-6 w-6 text-blue-500 shrink-0" />
                    <div>
                        <h4 className="font-bold text-blue-500">Global Insights</h4>
                        <p className="text-sm text-blue-500/70 mt-1">
                            System-wide registration is monitored live. The SSMS ecosystem is designed for high-availability multi-tenant isolation.
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
}
