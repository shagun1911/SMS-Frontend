"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import api from "@/lib/api";
import {
    Building2,
    MapPin,
    Phone,
    Mail,
    User,
    ShieldCheck,
    Eye,
    EyeOff,
    Loader2,
    CalendarDays,
    GraduationCap,
    BookOpen,
    KeyRound,
} from "lucide-react";

interface SchoolDetailModalProps {
    schoolId: string;
    schoolName: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SchoolDetailModal({
    schoolId,
    schoolName,
    open,
    onOpenChange,
}: SchoolDetailModalProps) {
    const queryClient = useQueryClient();
    const [showPassword, setShowPassword] = useState(false);
    const [creds, setCreds] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
    });
    const [credsPrefilled, setCredsPrefilled] = useState(false);

    const { data, isLoading } = useQuery({
        queryKey: ["school-detail", schoolId],
        queryFn: async () => {
            const res = await api.get(`/master/schools/${schoolId}`);
            return res.data?.data;
        },
        enabled: open && !!schoolId,
        onSuccess: (d: any) => {
            if (!credsPrefilled && d?.admin) {
                setCreds({
                    name: d.admin.name ?? "",
                    email: d.admin.email ?? "",
                    phone: d.admin.phone ?? "",
                    password: d.admin.plainPassword ?? "",
                });
                setCredsPrefilled(true);
            }
        },
    } as any);

    const credsMutation = useMutation({
        mutationFn: async (body: any) => {
            const res = await api.patch(`/master/schools/${schoolId}/credentials`, body);
            return res.data;
        },
        onSuccess: () => {
            toast.success("Admin credentials updated successfully.");
            queryClient.invalidateQueries({ queryKey: ["school-detail", schoolId] });
            setCredsPrefilled(false);
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message ?? "Failed to update credentials.");
        },
    });

    const handleSaveCreds = () => {
        const body: any = {};
        if (creds.name.trim()) body.name = creds.name.trim();
        if (creds.email.trim()) body.email = creds.email.trim();
        if (creds.phone.trim()) body.phone = creds.phone.trim();
        if (creds.password.trim()) body.password = creds.password.trim();
        credsMutation.mutate(body);
    };

    const school = (data as any)?.school;
    const subscription = (data as any)?.subscription;
    const admin = (data as any)?.admin;

    const handleClose = (val: boolean) => {
        if (!val) setCredsPrefilled(false);
        onOpenChange(val);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
                <DialogHeader className="px-6 pt-6 pb-4 border-b sticky top-0 bg-white z-10">
                    <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                        <Building2 className="h-5 w-5 text-indigo-600" />
                        {schoolName}
                    </DialogTitle>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex h-64 items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                    </div>
                ) : !school ? (
                    <div className="p-8 text-center text-sm text-muted-foreground">
                        Failed to load school details.
                    </div>
                ) : (
                    <div className="divide-y">
                        {/* ── School Info ── */}
                        <section className="px-6 py-5 space-y-4">
                            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                School Information
                            </h3>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <InfoRow icon={<Building2 className="h-4 w-4 text-indigo-400" />} label="School Code" value={school.schoolCode} />
                                <InfoRow icon={<GraduationCap className="h-4 w-4 text-indigo-400" />} label="Board" value={school.board} />
                                <InfoRow icon={<Mail className="h-4 w-4 text-indigo-400" />} label="Official Email" value={school.email} />
                                <InfoRow icon={<Phone className="h-4 w-4 text-indigo-400" />} label="Phone" value={school.phone} />
                                <InfoRow icon={<User className="h-4 w-4 text-indigo-400" />} label="Principal" value={school.principalName} />
                                <InfoRow icon={<BookOpen className="h-4 w-4 text-indigo-400" />} label="Classes" value={`${school.classRange?.from} – ${school.classRange?.to}`} />
                                <InfoRow
                                    icon={<MapPin className="h-4 w-4 text-indigo-400" />}
                                    label="Address"
                                    value={[school.address?.street, school.address?.city, school.address?.state, school.address?.pincode].filter(Boolean).join(", ")}
                                    className="sm:col-span-2"
                                />
                            </div>
                        </section>

                        {/* ── Subscription ── */}
                        {subscription && (
                            <section className="px-6 py-5 space-y-4">
                                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Subscription
                                </h3>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <InfoRow icon={<ShieldCheck className="h-4 w-4 text-emerald-500" />} label="Plan" value={(subscription.planId as any)?.name ?? "—"} />
                                    <InfoRow icon={<CalendarDays className="h-4 w-4 text-emerald-500" />} label="Status" value={subscription.status} />
                                    <InfoRow
                                        icon={<CalendarDays className="h-4 w-4 text-emerald-500" />}
                                        label="Expires"
                                        value={subscription.subscriptionEnd ? new Date(subscription.subscriptionEnd).toLocaleDateString(undefined, { dateStyle: "medium" }) : "—"}
                                    />
                                    <InfoRow
                                        icon={<CalendarDays className="h-4 w-4 text-emerald-500" />}
                                        label="Started"
                                        value={subscription.subscriptionStart ? new Date(subscription.subscriptionStart).toLocaleDateString(undefined, { dateStyle: "medium" }) : "—"}
                                    />
                                </div>
                            </section>
                        )}

                        {/* ── Admin Login Credentials ── */}
                        <section className="px-6 py-5 space-y-4">
                            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                                <KeyRound className="h-3.5 w-3.5" />
                                Admin Login Credentials
                            </h3>

                            {admin ? (
                                <div className="space-y-3">
                                    <p className="text-xs text-muted-foreground">
                                        Edit the school admin's login details. Leave Password blank to keep existing.
                                    </p>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-muted-foreground">Full Name</label>
                                            <Input
                                                value={creds.name}
                                                onChange={(e) => setCreds((c) => ({ ...c, name: e.target.value }))}
                                                placeholder="Admin name"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-muted-foreground">Phone</label>
                                            <Input
                                                value={creds.phone}
                                                onChange={(e) => setCreds((c) => ({ ...c, phone: e.target.value }))}
                                                placeholder="Phone number"
                                            />
                                        </div>
                                        <div className="space-y-1 sm:col-span-2">
                                            <label className="text-xs font-medium text-muted-foreground">Login Email</label>
                                            <Input
                                                type="email"
                                                value={creds.email}
                                                onChange={(e) => setCreds((c) => ({ ...c, email: e.target.value }))}
                                                placeholder="admin@school.com"
                                            />
                                        </div>
                                        <div className="space-y-1 sm:col-span-2">
                                            <label className="text-xs font-medium text-muted-foreground">New Password</label>
                                            <div className="relative">
                                                <Input
                                                    type={showPassword ? "text" : "password"}
                                                    value={creds.password}
                                                    onChange={(e) => setCreds((c) => ({ ...c, password: e.target.value }))}
                                                    placeholder="Leave blank to keep current password"
                                                    className="pr-10"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword((s) => !s)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                >
                                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-1">
                                        <Button
                                            onClick={handleSaveCreds}
                                            disabled={credsMutation.isPending}
                                            className="gap-2 bg-indigo-600 hover:bg-indigo-500"
                                        >
                                            {credsMutation.isPending ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <KeyRound className="h-4 w-4" />
                                            )}
                                            Save Credentials
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No admin user linked to this school.</p>
                            )}
                        </section>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

function InfoRow({
    icon,
    label,
    value,
    className = "",
}: {
    icon: React.ReactNode;
    label: string;
    value?: string | null;
    className?: string;
}) {
    return (
        <div className={`flex items-start gap-2 ${className}`}>
            <span className="mt-0.5 shrink-0">{icon}</span>
            <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-medium truncate">{value || "—"}</p>
            </div>
        </div>
    );
}
