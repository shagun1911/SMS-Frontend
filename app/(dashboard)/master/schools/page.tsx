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
                <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                        Global Institution Registry
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Authoritative control over all registered schools and their operational status.
                    </p>
                </div>
                <Button className="bg-indigo-600 hover:bg-indigo-500 gap-2">
                    <Plus className="h-4 w-4" /> Register New School
                </Button>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                        placeholder="Search institutions..."
                        className="pl-10 border-gray-200 bg-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500">Status:</span>
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-medium text-emerald-600">Normal</span>
                </div>
            </div>

            <div className="grid gap-6">
                {schools.length === 0 ? (
                    <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-gray-500 shadow-sm">
                        No schools registered in the ecosystem yet.
                    </div>
                ) : (
                    schools.map((school: any) => (
                        <Card key={school._id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                            <div className="flex items-center justify-between p-6">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-200 bg-indigo-50">
                                        <Building2 className="h-7 w-7 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            {school.schoolName}
                                        </h3>
                                        <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                                            <span>{school.address?.city}, {school.address?.state}</span>
                                            <span className="rounded bg-gray-100 px-2 py-0.5 font-medium text-gray-600">{school.subscriptionPlan}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-8">
                                    <div className="text-right">
                                        <p className="text-xs font-medium text-gray-500">Limit</p>
                                        <p className="font-mono font-semibold text-gray-900">{school.studentLimit ?? "—"}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            onClick={() => updateSchoolMutation.mutate({ id: school._id, data: { isActive: !school.isActive } })}
                                            size="sm"
                                            className={school.isActive ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-red-100 text-red-700 hover:bg-red-200"}
                                        >
                                            {school.isActive ? <CheckCircle2 className="mr-1.5 h-4 w-4" /> : <XCircle className="mr-1.5 h-4 w-4" />}
                                            {school.isActive ? "Active" : "Suspended"}
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-gray-500 hover:bg-gray-100">
                                            <MoreVertical className="h-5 w-5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            <div className={`h-1 w-full ${school.isActive ? "bg-emerald-100" : "bg-red-100"}`}>
                                <div className={`h-full w-full ${school.isActive ? "bg-emerald-500" : "bg-red-500"}`} />
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
