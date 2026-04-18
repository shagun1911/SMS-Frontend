"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Building2,
    Bell,
    Globe,
    Mail,
    Save,
    Image as ImageIcon,
    Camera,
    Loader2,
    Smartphone,
    Stamp,
    PenLine,
    Bus,
    Plus,
    Trash2,
    Edit2
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Modal } from "@/components/ui/modal";
import api from "@/lib/api";

function formatAddress(addr: { street?: string; city?: string; state?: string; pincode?: string; country?: string } | undefined) {
    if (!addr) return "";
    const parts = [addr.street, addr.city, addr.state, addr.pincode, addr.country].filter(Boolean);
    return parts.join(", ");
}

function parseAddress(full: string) {
    const parts = full.split(",").map((p) => p.trim());
    return {
        street: parts[0] ?? "",
        city: parts[1] ?? "",
        state: parts[2] ?? "",
        pincode: parts[3] ?? "",
        country: parts[4] ?? "",
    };
}

export default function SettingsPage() {
    const queryClient = useQueryClient();
    const [identityForm, setIdentityForm] = useState({
        schoolName: "",
        schoolCode: "",
        email: "",
        phone: "",
        addressFull: "",
    });
    const [isDestinationModalOpen, setIsDestinationModalOpen] = useState(false);
    const [editingDestination, setEditingDestination] = useState<any>(null);
    const [destinationForm, setDestinationForm] = useState({
        destinationName: "",
        monthlyFee: "",
    });

    const { data: school, isLoading } = useQuery({
        queryKey: ["school-me"],
        queryFn: async () => {
            const res = await api.get("/schools/me");
            return res.data.data;
        },
    });

    const { data: destinations, isLoading: destinationsLoading } = useQuery({
        queryKey: ["transport-destinations"],
        queryFn: async () => {
            const res = await api.get("/transport/destinations");
            return res.data.data;
        },
    });

    const createDestination = useMutation({
        mutationFn: async (data: { destinationName: string; monthlyFee: number }) => {
            const res = await api.post("/transport/destinations", data);
            return res.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transport-destinations"] });
            toast.success("Transport destination added");
            setIsDestinationModalOpen(false);
            setDestinationForm({ destinationName: "", monthlyFee: "" });
            setEditingDestination(null);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || "Failed to add destination");
        },
    });

    const updateDestination = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: { destinationName: string; monthlyFee: number } }) => {
            const res = await api.put(`/transport/destinations/${id}`, data);
            return res.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transport-destinations"] });
            toast.success("Transport destination updated");
            setIsDestinationModalOpen(false);
            setDestinationForm({ destinationName: "", monthlyFee: "" });
            setEditingDestination(null);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || "Failed to update destination");
        },
    });

    const deleteDestination = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/transport/destinations/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transport-destinations"] });
            toast.success("Transport destination deleted");
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || "Failed to delete destination");
        },
    });

    const handleSaveDestination = () => {
        if (!destinationForm.destinationName || !destinationForm.monthlyFee) {
            toast.error("Please fill all fields");
            return;
        }
        if (editingDestination) {
            updateDestination.mutate({
                id: editingDestination._id,
                data: {
                    destinationName: destinationForm.destinationName,
                    monthlyFee: Number(destinationForm.monthlyFee),
                },
            });
        } else {
            createDestination.mutate({
                destinationName: destinationForm.destinationName,
                monthlyFee: Number(destinationForm.monthlyFee),
            });
        }
    };

    const handleEditDestination = (dest: any) => {
        setEditingDestination(dest);
        setDestinationForm({
            destinationName: dest.destinationName,
            monthlyFee: dest.monthlyFee.toString(),
        });
        setIsDestinationModalOpen(true);
    };

    const handleDeleteDestination = (id: string) => {
        if (confirm("Are you sure you want to delete this destination?")) {
            deleteDestination.mutate(id);
        }
    };

    const handleOpenDestinationModal = () => {
        setEditingDestination(null);
        setDestinationForm({ destinationName: "", monthlyFee: "" });
        setIsDestinationModalOpen(true);
    };

    useEffect(() => {
        if (school) {
            setIdentityForm({
                schoolName: school.schoolName ?? "",
                schoolCode: school.schoolCode ?? "",
                email: school.email ?? "",
                phone: school.phone ?? "",
                addressFull: formatAddress(school.address),
            });
        }
    }, [school]);

    const updateSchool = useMutation({
        mutationFn: async (payload: Record<string, unknown>) => {
            const res = await api.patch("/schools/me", payload);
            return res.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["school-me"] });
            toast.success("School identity updated.");
        },
        onError: (err: { response?: { data?: { message?: string } } }) => {
            toast.error(err.response?.data?.message ?? "Failed to update.");
        },
    });

    const handleSaveIdentity = () => {
        const address = parseAddress(identityForm.addressFull);
        updateSchool.mutate({
            schoolName: identityForm.schoolName,
            schoolCode: identityForm.schoolCode,
            email: identityForm.email,
            phone: identityForm.phone,
            address,
        });
    };

    const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const formData = new FormData();
        formData.append("image", file);
        try {
            const { data } = await api.post("/upload/image", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            const url = data?.data?.url ?? data?.url;
            if (url) {
                await api.patch("/schools/me", { logo: url });
                queryClient.invalidateQueries({ queryKey: ["school-me"] });
                toast.success("Logo updated.");
            }
        } catch {
            toast.error("Logo upload failed.");
        }
        e.target.value = "";
    };

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                    System Configuration
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                    Manage school identity, regional settings, and security preferences.
                </p>
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="h-11 rounded-xl border border-gray-200 bg-white p-1 gap-1 shadow-sm">
                    <TabsTrigger
                        value="profile"
                        className="data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-700 rounded-lg px-5 text-xs font-medium"
                    >
                        School Profile
                    </TabsTrigger>
                    <TabsTrigger
                        value="transport"
                        className="data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-700 rounded-lg px-5 text-xs font-medium"
                    >
                        Transport
                    </TabsTrigger>
                    <TabsTrigger
                        value="notifications"
                        className="data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-700 rounded-lg px-5 text-xs font-medium"
                    >
                        Alerts
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="m-0 space-y-6">
                    <div className="grid gap-6 md:grid-cols-3">
                        <Card className="md:col-span-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                            <CardHeader className="border-b border-gray-100 bg-gray-50/50 p-6">
                                <CardTitle className="text-lg font-semibold text-gray-900">General Identity</CardTitle>
                                <CardDescription className="text-gray-500">Basic information visible on reports and invoices.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium text-gray-700">School Name</Label>
                                        <Input
                                            value={identityForm.schoolName}
                                            onChange={(e) => setIdentityForm((f) => ({ ...f, schoolName: e.target.value }))}
                                            className="h-10 border-gray-200 bg-white"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium text-gray-700">School Code / UDISE</Label>
                                        <Input
                                            value={identityForm.schoolCode}
                                            onChange={(e) => setIdentityForm((f) => ({ ...f, schoolCode: e.target.value }))}
                                            className="h-10 border-gray-200 bg-white"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium text-gray-700">Official Email</Label>
                                        <Input
                                            type="email"
                                            value={identityForm.email}
                                            onChange={(e) => setIdentityForm((f) => ({ ...f, email: e.target.value }))}
                                            className="h-10 border-gray-200 bg-white"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium text-gray-700">Phone Number</Label>
                                        <Input
                                            value={identityForm.phone}
                                            onChange={(e) => setIdentityForm((f) => ({ ...f, phone: e.target.value }))}
                                            className="h-10 border-gray-200 bg-white"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium text-gray-700">Full Address (Street, City, State, Pincode, Country)</Label>
                                    <Input
                                        value={identityForm.addressFull}
                                        onChange={(e) => setIdentityForm((f) => ({ ...f, addressFull: e.target.value }))}
                                        placeholder="e.g. Sec-14, Jaipur, Rajasthan, 302021, India"
                                        className="h-10 border-gray-200 bg-white"
                                    />
                                </div>
                                <div className="pt-2 flex justify-end">
                                    <Button
                                        onClick={handleSaveIdentity}
                                        disabled={updateSchool.isPending}
                                        className="bg-indigo-600 hover:bg-indigo-500 gap-2 rounded-xl h-10 px-6"
                                    >
                                        {updateSchool.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                        Save Identity
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="space-y-6">
                            <Card className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                                <CardHeader className="border-b border-gray-100 p-6">
                                    <CardTitle className="text-base font-semibold text-gray-900">Branding</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 flex flex-col items-center">
                                    <label className="relative group cursor-pointer">
                                        <Avatar className="h-28 w-28 border-2 border-gray-200 ring-2 ring-gray-100">
                                            <AvatarImage src={school?.logo} alt="School logo" />
                                            <AvatarFallback className="bg-indigo-100 text-indigo-600">
                                                <Building2 className="h-10 w-10" />
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Camera className="h-6 w-6 text-white" />
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="sr-only"
                                            onChange={handleLogoChange}
                                        />
                                    </label>
                                    <p className="mt-4 text-xs text-gray-500 text-center">
                                        Max size: 2MB. Recommended: 512×512 PNG
                                    </p>
                                    <Label htmlFor="logo-upload" className="mt-4">
                                        <span className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
                                            <ImageIcon className="h-3.5 w-3.5" /> Replace Logo
                                        </span>
                                        <input
                                            id="logo-upload"
                                            type="file"
                                            accept="image/*"
                                            className="sr-only"
                                            onChange={handleLogoChange}
                                        />
                                    </Label>
                                </CardContent>
                            </Card>

                            <Card className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                                <CardHeader className="border-b border-gray-100 p-6">
                                    <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                        <Stamp className="h-4 w-4" /> School Stamp
                                    </CardTitle>
                                    <CardDescription className="text-xs text-gray-500">Used on fee structure, receipts and admit cards</CardDescription>
                                </CardHeader>
                                <CardContent className="p-6 flex flex-col items-center">
                                    {school?.stamp ? (
                                        <img src={school.stamp} alt="School stamp" className="h-20 w-auto object-contain border border-gray-200 rounded-lg" />
                                    ) : (
                                        <div className="h-20 w-32 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-xs text-gray-400">No stamp</div>
                                    )}
                                    <Label className="mt-4">
                                        <span className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
                                            <ImageIcon className="h-3.5 w-3.5" /> {school?.stamp ? "Replace Stamp" : "Upload Stamp"}
                                        </span>
                                        <input type="file" accept="image/*" className="sr-only" onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            const formData = new FormData();
                                            formData.append("image", file);
                                            try {
                                                const { data } = await api.post("/upload/image", formData, { headers: { "Content-Type": "multipart/form-data" } });
                                                const url = data?.data?.url ?? data?.url;
                                                if (url) {
                                                    await api.patch("/schools/me", { stamp: url });
                                                    queryClient.invalidateQueries({ queryKey: ["school-me"] });
                                                    toast.success("Stamp updated.");
                                                }
                                            } catch { toast.error("Upload failed."); }
                                            e.target.value = "";
                                        }} />
                                    </Label>
                                </CardContent>
                            </Card>

                            <Card className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                                <CardHeader className="border-b border-gray-100 p-6">
                                    <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                        <PenLine className="h-4 w-4" /> Principal Signature
                                    </CardTitle>
                                    <CardDescription className="text-xs text-gray-500">Used on fee structure, receipts and admit cards</CardDescription>
                                </CardHeader>
                                <CardContent className="p-6 flex flex-col items-center">
                                    {school?.principalSignature ? (
                                        <img src={school.principalSignature} alt="Principal signature" className="h-14 w-auto object-contain border border-gray-200 rounded-lg max-w-[200px]" />
                                    ) : (
                                        <div className="h-14 w-40 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-xs text-gray-400">No signature</div>
                                    )}
                                    <Label className="mt-4">
                                        <span className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
                                            <ImageIcon className="h-3.5 w-3.5" /> {school?.principalSignature ? "Replace Signature" : "Upload Signature"}
                                        </span>
                                        <input type="file" accept="image/*" className="sr-only" onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            const formData = new FormData();
                                            formData.append("image", file);
                                            try {
                                                const { data } = await api.post("/upload/image", formData, { headers: { "Content-Type": "multipart/form-data" } });
                                                const url = data?.data?.url ?? data?.url;
                                                if (url) {
                                                    await api.patch("/schools/me", { principalSignature: url });
                                                    queryClient.invalidateQueries({ queryKey: ["school-me"] });
                                                    toast.success("Signature updated.");
                                                }
                                            } catch { toast.error("Upload failed."); }
                                            e.target.value = "";
                                        }} />
                                    </Label>
                                </CardContent>
                            </Card>

                            <Card className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                                <div className="p-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-xs font-semibold text-gray-900">Auto-Tax Invoice</Label>
                                            <p className="text-xs text-gray-500">Generate GST bills automatically</p>
                                        </div>
                                        <Switch />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-xs font-semibold text-gray-900">Public Profile</Label>
                                            <p className="text-xs text-gray-500">Visible on school directory</p>
                                        </div>
                                        <Switch defaultChecked />
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="transport" className="m-0">
                    <Card className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <CardHeader className="border-b border-gray-100 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                        <Bus className="h-5 w-5" /> Transport Destinations
                                    </CardTitle>
                                    <CardDescription className="text-gray-500 mt-1">Manage transport routes and their monthly fees</CardDescription>
                                </div>
                                <Button
                                    onClick={handleOpenDestinationModal}
                                    className="bg-indigo-600 hover:bg-indigo-500 gap-2 rounded-xl h-10 px-4"
                                >
                                    <Plus className="h-4 w-4" /> Add Destination
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {destinationsLoading ? (
                                <div className="flex h-40 items-center justify-center">
                                    <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                                </div>
                            ) : destinations && destinations.length > 0 ? (
                                <div className="divide-y divide-gray-100">
                                    {destinations.map((dest: any) => (
                                        <div
                                            key={dest._id}
                                            className="flex items-center justify-between p-6 hover:bg-gray-50/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                                                    <Bus className="h-5 w-5 text-gray-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{dest.destinationName}</p>
                                                    <p className="text-xs text-gray-500 mt-0.5">Monthly Fee: ₹{dest.monthlyFee.toLocaleString("en-IN")}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEditDestination(dest)}
                                                    className="h-8 w-8 p-0 hover:bg-gray-100"
                                                >
                                                    <Edit2 className="h-4 w-4 text-gray-600" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteDestination(dest._id)}
                                                    className="h-8 w-8 p-0 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-600" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex h-40 items-center justify-center text-sm text-gray-500">
                                    No transport destinations added yet
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="notifications" className="m-0">
                    <Card className="max-w-2xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <CardHeader className="border-b border-gray-100 p-6">
                            <CardTitle className="text-lg font-semibold text-gray-900">Notification Channels</CardTitle>
                            <CardDescription className="text-gray-500">Configure how you receive alerts.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            {[
                                { title: "SMS Alerts", desc: "Send fee reminders via SMS gateway", icon: Smartphone, enabled: true },
                                { title: "Email Broadcasts", desc: "Weekly academic performance reports", icon: Mail, enabled: true },
                                { title: "System Push", desc: "Internal dashboard notification alerts", icon: Bell, enabled: false },
                                { title: "Webhook Integration", desc: "Export data to external ERP systems", icon: Globe, enabled: false },
                            ].map((item, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between border-b border-gray-100 p-6 last:border-0 hover:bg-gray-50/50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                                            <item.icon className="h-5 w-5 text-gray-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{item.title}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                                        </div>
                                    </div>
                                    <Switch defaultChecked={item.enabled} />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <Modal
                isOpen={isDestinationModalOpen}
                onClose={() => setIsDestinationModalOpen(false)}
                title={editingDestination ? "Edit Transport Destination" : "Add Transport Destination"}
                description="Enter the destination name and monthly fee"
                className="max-w-md"
            >
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-xs font-medium text-gray-700">Destination Name</Label>
                        <Input
                            value={destinationForm.destinationName}
                            onChange={(e) => setDestinationForm((f) => ({ ...f, destinationName: e.target.value }))}
                            placeholder="e.g., Ganga Shehar"
                            className="h-10 border-gray-200 bg-white"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-medium text-gray-700">Monthly Fee (₹)</Label>
                        <Input
                            type="number"
                            value={destinationForm.monthlyFee}
                            onChange={(e) => setDestinationForm((f) => ({ ...f, monthlyFee: e.target.value }))}
                            placeholder="e.g., 700"
                            className="h-10 border-gray-200 bg-white"
                        />
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setIsDestinationModalOpen(false)}
                            className="rounded-xl h-10 px-4"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveDestination}
                            disabled={createDestination.isPending || updateDestination.isPending}
                            className="bg-indigo-600 hover:bg-indigo-500 rounded-xl h-10 px-4"
                        >
                            {createDestination.isPending || updateDestination.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            {editingDestination ? "Update" : "Add"}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
