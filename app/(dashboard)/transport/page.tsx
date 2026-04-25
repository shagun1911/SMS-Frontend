"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    Bus,
    Plus,
    Search,
    Filter,
    MapPin,
    Users,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AddVehicleModal } from "@/components/transport/add-vehicle-modal";
import { LockedFeatureGate } from "@/components/plan/locked-feature-gate";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import api from "@/lib/api";
import { toast } from "sonner";
import { UserRole } from "@/types";
import { TransportStaffSelect } from "@/components/transport/transport-staff-select";
import { matchStaffMemberId } from "@/lib/transportStaff";

export default function TransportPage() {
    const router = useRouter();
    const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedBusId, setSelectedBusId] = useState<string | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [driverStaffId, setDriverStaffId] = useState("");
    const [conductorStaffId, setConductorStaffId] = useState("");
    const [driverName, setDriverName] = useState("");
    const [busNumber, setBusNumber] = useState("");
    const [registrationNumber, setRegistrationNumber] = useState("");
    const [routeName, setRouteName] = useState("");
    const [capacity, setCapacity] = useState("");
    const [driverPhone, setDriverPhone] = useState("");
    const [conductorName, setConductorName] = useState("");
    const [conductorPhone, setConductorPhone] = useState("");
    const [assignSearch, setAssignSearch] = useState("");
    const [selectedStudentIds, setSelectedStudentIds] = useState<Record<string, boolean>>({});

    const queryClient = useQueryClient();

    const { data: staffData = [] } = useQuery({
        queryKey: ["staff-list"],
        queryFn: async () => {
            const res = await api.get("/users");
            return res.data.data ?? [];
        },
    });

    const busDrivers = useMemo(
        () =>
            (staffData as any[]).filter(
                (u) => u.role === UserRole.BUS_DRIVER && u.isActive !== false
            ),
        [staffData]
    );

    const busConductors = useMemo(
        () =>
            (staffData as any[]).filter(
                (u) => u.role === UserRole.CONDUCTOR && u.isActive !== false
            ),
        [staffData]
    );

    const { data: transportData, isLoading } = useQuery({
        queryKey: ["transport-list"],
        queryFn: async () => {
            const res = await api.get("/transport");
            return res.data.data;
        }
    });

    const fleet = transportData || [];

    const { data: busDetails, isLoading: isDetailsLoading } = useQuery({
        queryKey: ["transport-bus-details", selectedBusId],
        enabled: !!selectedBusId && detailsOpen,
        queryFn: async () => {
            const res = await api.get(`/transport/${selectedBusId}/details`);
            return res.data.data;
        },
    });

    const bus = busDetails?.bus;
    const students: any[] = Array.isArray(busDetails?.students) ? busDetails.students : [];

    const { data: allStudents, isLoading: isAllStudentsLoading } = useQuery({
        queryKey: ["students-list-transport"],
        enabled: detailsOpen,
        queryFn: async () => {
            const res = await api.get("/students", { params: { limit: 200 } });
            const list = res.data.data ?? [];
            return Array.isArray(list) ? list : [];
        },
    });

    const filteredAssignStudents = useMemo(() => {
        const list: any[] = Array.isArray(allStudents) ? allStudents : [];
        const q = assignSearch.trim().toLowerCase();
        if (!q) return list;
        return list.filter((s: any) => {
            const full = `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim().toLowerCase();
            return (
                full.includes(q) ||
                String(s.admissionNumber ?? "").toLowerCase().includes(q) ||
                String(s.phone ?? "").toLowerCase().includes(q) ||
                String(s.username ?? "").toLowerCase().includes(q)
            );
        });
    }, [allStudents, assignSearch]);

    const updateBus = useMutation({
        mutationFn: async (payload: any) => {
            if (!selectedBusId) throw new Error("Missing bus id");
            const res = await api.put(`/transport/${selectedBusId}`, payload);
            return res.data?.data ?? res.data;
        },
        onSuccess: () => {
            toast.success("Bus updated");
            queryClient.invalidateQueries({ queryKey: ["transport-list"] });
            queryClient.invalidateQueries({ queryKey: ["transport-bus-details", selectedBusId] });
            setEditMode(false);
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message ?? "Unable to update bus");
        },
    });

    const assignStudents = useMutation({
        mutationFn: async (studentIds: string[]) => {
            if (!selectedBusId) throw new Error("Missing bus id");
            const res = await api.post(`/transport/${selectedBusId}/students`, { studentIds });
            return res.data?.data ?? res.data;
        },
        onSuccess: () => {
            toast.success("Students assigned");
            queryClient.invalidateQueries({ queryKey: ["transport-bus-details", selectedBusId] });
            setSelectedStudentIds({});
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message ?? "Unable to assign students");
        },
    });

    const unassignStudents = useMutation({
        mutationFn: async (studentIds: string[]) => {
            if (!selectedBusId) throw new Error("Missing bus id");
            const res = await api.delete(`/transport/${selectedBusId}/students`, { data: { studentIds } });
            return res.data?.data ?? res.data;
        },
        onSuccess: () => {
            toast.success("Student removed");
            queryClient.invalidateQueries({ queryKey: ["transport-bus-details", selectedBusId] });
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message ?? "Unable to remove student");
        },
    });

    return (
        <LockedFeatureGate featureKey="transport" featureLabel="Transport">
        <div className="flex-1 space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
                        Fleet Management
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Track school buses, maintain routes, and monitor student safety.
                    </p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <Button
                        variant="outline"
                        className="w-full sm:w-auto gap-2 h-10 rounded-xl border-gray-200 hover:bg-gray-50"
                        onClick={() => router.push("/transport/destinations")}
                    >
                        <Bus className="h-4 w-4" /> Transport
                    </Button>
                    <Button 
                        className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 gap-2 h-10 rounded-xl"
                        onClick={() => setIsAddVehicleOpen(true)}
                    >
                        <Plus className="h-4 w-4" /> Add Vehicle
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                <Card className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Total Fleet</p>
                    <h3 className="mt-1 text-2xl font-bold text-gray-900">{Array.isArray(fleet) ? fleet.length : 0}</h3>
                    <div className="mt-2 flex items-center gap-1.5">
                        <Badge className="bg-emerald-100 text-emerald-700 text-xs">Active</Badge>
                    </div>
                </Card>
                <Card className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Capacity</p>
                    <h3 className="mt-1 text-2xl font-bold text-gray-900">—</h3>
                    <Progress value={0} className="mt-3 h-2 bg-gray-100" />
                </Card>
                <Card className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Safety Incidents</p>
                    <h3 className="mt-1 text-2xl font-bold text-gray-900">0</h3>
                    <p className="mt-1 text-xs font-medium text-emerald-600">No incidents</p>
                </Card>
                <Card className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Active Routes</p>
                    <h3 className="mt-1 text-2xl font-bold text-gray-900">—</h3>
                    <p className="mt-1 text-xs text-gray-500">From fleet data</p>
                </Card>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative max-w-sm flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input placeholder="Search vehicles or routes..." className="h-10 border-gray-200 bg-white pl-10" />
                </div>
                <Button variant="outline" className="gap-2 h-10 border-gray-200 bg-white">
                    <Filter className="h-4 w-4" /> Filters
                </Button>
            </div>

            {isLoading ? (
                <div className="flex h-64 w-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2">
                    {Array.isArray(fleet) && fleet.length > 0 ? fleet.map((item: any) => (
                        <Card
                            key={item._id}
                            className="cursor-pointer overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                            onClick={() => {
                                setSelectedBusId(item._id);
                                setDetailsOpen(true);
                            }}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    setSelectedBusId(item._id);
                                    setDetailsOpen(true);
                                }
                            }}
                        >
                            <CardContent className="p-0">
                                <div className="flex flex-col md:flex-row">
                                    <div className="flex w-full flex-col items-center justify-center border-b border-gray-100 bg-indigo-50/50 p-6 md:w-44 md:border-b-0 md:border-r">
                                        <Bus className="mb-2 h-10 w-10 text-indigo-600" />
                                        <p className="text-[10px] font-medium uppercase text-gray-500">Vehicle</p>
                                        <h4 className="mt-1 font-semibold text-gray-900">{item.busNumber ?? item.vehicleNumber}</h4>
                                    </div>
                                    <div className="flex-1 p-6">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{item.routeName}</h3>
                                                <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                                                    <MapPin className="h-3.5 w-3.5" />
                                                    Reg: {item.registrationNumber ?? "—"}
                                                </div>
                                            </div>
                                            <Badge className={item.isActive !== false ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}>
                                                {item.isActive !== false ? "Active" : "Inactive"}
                                            </Badge>
                                        </div>
                                        <div className="mt-6 flex items-center gap-4 border-t border-gray-100 pt-4">
                                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                                <Users className="h-3.5 w-3.5" />
                                                {item.capacity ?? "—"} capacity
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )) : (
                        <div className="col-span-full rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
                            <Bus className="mx-auto h-12 w-12 text-gray-300" />
                            <p className="mt-4 text-sm font-medium text-gray-600">No vehicles in fleet</p>
                            <p className="mt-1 text-xs text-gray-500">Click &quot;Add Vehicle&quot; to add your first bus.</p>
                            <Button className="mt-4 bg-indigo-600 hover:bg-indigo-500" onClick={() => setIsAddVehicleOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" /> Add Vehicle
                            </Button>
                        </div>
                    )}
                </div>
            )}

            <AddVehicleModal 
                open={isAddVehicleOpen}
                onOpenChange={setIsAddVehicleOpen}
            />

            <Dialog
                open={detailsOpen}
                onOpenChange={(open) => {
                    setDetailsOpen(open);
                    if (!open) {
                        setSelectedBusId(null);
                        setEditMode(false);
                        setAssignSearch("");
                        setSelectedStudentIds({});
                        setDriverStaffId("");
                        setConductorStaffId("");
                    }
                }}
            >
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="flex items-center justify-between gap-3">
                            <DialogTitle>Bus Details</DialogTitle>
                            {!!bus && (
                                <div className="flex items-center gap-2">
                                    {editMode ? (
                                        <>
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    setEditMode(false);
                                                    setBusNumber(bus.busNumber ?? "");
                                                    setRegistrationNumber(bus.registrationNumber ?? "");
                                                    setRouteName(bus.routeName ?? "");
                                                    setCapacity(bus.capacity != null ? String(bus.capacity) : "");
                                                    setDriverName(bus.driverName ?? "");
                                                    setDriverPhone(bus.driverPhone ?? "");
                                                    setConductorName(bus.conductorName ?? "");
                                                    setConductorPhone(bus.conductorPhone ?? "");
                                                    setDriverStaffId(
                                                        bus.driverUserId
                                                            ? String(bus.driverUserId)
                                                            : matchStaffMemberId(
                                                                  busDrivers,
                                                                  bus.driverName,
                                                                  bus.driverPhone
                                                              )
                                                    );
                                                    setConductorStaffId(
                                                        bus.conductorUserId
                                                            ? String(bus.conductorUserId)
                                                            : matchStaffMemberId(
                                                                  busConductors,
                                                                  bus.conductorName,
                                                                  bus.conductorPhone
                                                              )
                                                    );
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                className="bg-indigo-600 hover:bg-indigo-500"
                                                disabled={updateBus.isPending}
                                                onClick={() => {
                                                    updateBus.mutate({
                                                        busNumber: busNumber?.trim() || bus.busNumber,
                                                        registrationNumber: registrationNumber?.trim() || bus.registrationNumber,
                                                        routeName: routeName?.trim() || bus.routeName,
                                                        capacity: capacity ? Number(capacity) : bus.capacity,
                                                        driverName: driverName?.trim() || "",
                                                        driverPhone: driverPhone?.trim() || "",
                                                        conductorName: conductorName?.trim() || "",
                                                        conductorPhone: conductorPhone?.trim() || "",
                                                        driverUserId: driverStaffId || "",
                                                        conductorUserId: conductorStaffId || "",
                                                    });
                                                }}
                                            >
                                                {updateBus.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                                            </Button>
                                        </>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setEditMode(true);
                                                setBusNumber(bus.busNumber ?? "");
                                                setRegistrationNumber(bus.registrationNumber ?? "");
                                                setRouteName(bus.routeName ?? "");
                                                setCapacity(bus.capacity != null ? String(bus.capacity) : "");
                                                setDriverName(bus.driverName ?? "");
                                                setDriverPhone(bus.driverPhone ?? "");
                                                setConductorName(bus.conductorName ?? "");
                                                setConductorPhone(bus.conductorPhone ?? "");
                                                setDriverStaffId(
                                                    bus.driverUserId
                                                        ? String(bus.driverUserId)
                                                        : matchStaffMemberId(
                                                              busDrivers,
                                                              bus.driverName,
                                                              bus.driverPhone
                                                          )
                                                );
                                                setConductorStaffId(
                                                    bus.conductorUserId
                                                        ? String(bus.conductorUserId)
                                                        : matchStaffMemberId(
                                                              busConductors,
                                                              bus.conductorName,
                                                              bus.conductorPhone
                                                          )
                                                );
                                            }}
                                        >
                                            Edit
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    </DialogHeader>

                    {isDetailsLoading ? (
                        <div className="flex h-48 items-center justify-center">
                            <Loader2 className="h-7 w-7 animate-spin text-indigo-500" />
                        </div>
                    ) : !bus ? (
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                            Unable to load bus details.
                        </div>
                    ) : (
                        <div className="space-y-5">
                            <div className="grid gap-3 md:grid-cols-3">
                                <Card className="rounded-2xl border border-gray-200 shadow-sm">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm">Bus</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2 text-sm text-gray-700">
                                        {editMode ? (
                                            <>
                                                <Input
                                                    placeholder="Bus number"
                                                    value={busNumber}
                                                    onChange={(e) => setBusNumber(e.target.value)}
                                                />
                                                <Input
                                                    placeholder="Registration number"
                                                    value={registrationNumber}
                                                    onChange={(e) => setRegistrationNumber(e.target.value)}
                                                />
                                                <Input
                                                    placeholder="Route name"
                                                    value={routeName}
                                                    onChange={(e) => setRouteName(e.target.value)}
                                                />
                                                <Input
                                                    type="number"
                                                    placeholder="Capacity"
                                                    value={capacity}
                                                    onChange={(e) => setCapacity(e.target.value)}
                                                />
                                            </>
                                        ) : (
                                            <>
                                                <div className="font-semibold text-gray-900">{bus.busNumber ?? "—"}</div>
                                                <div className="text-xs text-gray-500">Reg: {bus.registrationNumber ?? "—"}</div>
                                                <div className="mt-2 text-xs text-gray-500">Route</div>
                                                <div className="font-medium text-gray-900">{bus.routeName ?? "—"}</div>
                                            </>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card className="rounded-2xl border border-gray-200 shadow-sm">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm">Driver</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2 text-sm text-gray-700">
                                        {editMode ? (
                                            <div className="space-y-2">
                                                <TransportStaffSelect
                                                    label="Bus driver (staff)"
                                                    members={busDrivers.map((u: any) => ({
                                                        _id: u._id,
                                                        name: u.name,
                                                        phone: u.phone,
                                                    }))}
                                                    valueId={driverStaffId}
                                                    placeholder="Select driver…"
                                                    onChange={(m) => {
                                                        setDriverStaffId(m?._id ?? "");
                                                        setDriverName(m?.name ?? "");
                                                        setDriverPhone(m?.phone ?? "");
                                                    }}
                                                />
                                                {!driverStaffId && (driverName || driverPhone) ? (
                                                    <>
                                                        <p className="text-xs text-amber-800">
                                                            This driver is not in your staff list. Update manually or
                                                            choose from the list.
                                                        </p>
                                                        <Input
                                                            placeholder="Driver name"
                                                            value={driverName}
                                                            onChange={(e) => setDriverName(e.target.value)}
                                                        />
                                                        <Input
                                                            placeholder="Driver phone"
                                                            value={driverPhone}
                                                            onChange={(e) => setDriverPhone(e.target.value)}
                                                        />
                                                    </>
                                                ) : null}
                                                {driverStaffId && (driverName || driverPhone) ? (
                                                    <p className="text-xs text-muted-foreground">
                                                        {driverPhone ? `Phone: ${driverPhone}` : "No phone on file"}
                                                    </p>
                                                ) : null}
                                            </div>
                                        ) : (
                                            <>
                                                <div className="font-semibold text-gray-900">{bus.driverName ?? "—"}</div>
                                                <div className="text-xs text-gray-500">{bus.driverPhone ?? "—"}</div>
                                            </>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card className="rounded-2xl border border-gray-200 shadow-sm">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm">Conductor</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2 text-sm text-gray-700">
                                        {editMode ? (
                                            <div className="space-y-2">
                                                <TransportStaffSelect
                                                    label="Conductor (staff)"
                                                    members={busConductors.map((u: any) => ({
                                                        _id: u._id,
                                                        name: u.name,
                                                        phone: u.phone,
                                                    }))}
                                                    valueId={conductorStaffId}
                                                    placeholder="Select conductor…"
                                                    onChange={(m) => {
                                                        setConductorStaffId(m?._id ?? "");
                                                        setConductorName(m?.name ?? "");
                                                        setConductorPhone(m?.phone ?? "");
                                                    }}
                                                />
                                                {!conductorStaffId && (conductorName || conductorPhone) ? (
                                                    <>
                                                        <p className="text-xs text-amber-800">
                                                            This conductor is not in your staff list. Update manually or
                                                            choose from the list.
                                                        </p>
                                                        <Input
                                                            placeholder="Conductor name"
                                                            value={conductorName}
                                                            onChange={(e) => setConductorName(e.target.value)}
                                                        />
                                                        <Input
                                                            placeholder="Conductor phone"
                                                            value={conductorPhone}
                                                            onChange={(e) => setConductorPhone(e.target.value)}
                                                        />
                                                    </>
                                                ) : null}
                                                {conductorStaffId && (conductorName || conductorPhone) ? (
                                                    <p className="text-xs text-muted-foreground">
                                                        {conductorPhone ? `Phone: ${conductorPhone}` : "No phone on file"}
                                                    </p>
                                                ) : null}
                                            </div>
                                        ) : (
                                            <>
                                                <div className="font-semibold text-gray-900">{bus.conductorName ?? "—"}</div>
                                                <div className="text-xs text-gray-500">{bus.conductorPhone ?? "—"}</div>
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            {!editMode && busDetails?.location?.latitude && busDetails?.location?.longitude && (
                                <Card className="rounded-2xl border border-indigo-200 bg-indigo-50/50 shadow-sm">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm text-indigo-900">Live Location</CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex items-center justify-between">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {busDetails.location.latitude.toFixed(6)}, {busDetails.location.longitude.toFixed(6)}
                                            </div>
                                            <div className={`text-xs mt-1 font-medium ${busDetails.location.isOnline ? "text-emerald-600" : "text-gray-500"}`}>
                                                {busDetails.location.isOnline ? "Live tracking active" : "Last known location"}
                                            </div>
                                        </div>
                                        <a 
                                            href={`https://www.google.com/maps?q=${busDetails.location.latitude},${busDetails.location.longitude}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                        >
                                            <Button className="bg-indigo-600 hover:bg-indigo-500 h-9 px-4 text-xs shadow-sm">
                                                <MapPin className="mr-2 h-3.5 w-3.5" />
                                                Open in Maps
                                            </Button>
                                        </a>
                                    </CardContent>
                                </Card>
                            )}

                            <Card className="rounded-2xl border border-gray-200 shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm">
                                        Students on this bus{" "}
                                        <span className="text-xs font-normal text-gray-500">
                                            ({students.length})
                                        </span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {students.length === 0 ? (
                                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                                            No students are assigned to this bus.
                                        </div>
                                    ) : (
                                        <div className="rounded-xl border border-gray-200">
                                            <table className="w-full text-sm">
                                                <thead className="sticky top-0 bg-white">
                                                    <tr className="border-b text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                                                        <th className="px-3 py-2">Student</th>
                                                        <th className="px-3 py-2">Class</th>
                                                        <th className="px-3 py-2">Adm No.</th>
                                                        <th className="px-3 py-2">Phone</th>
                                                        <th className="px-3 py-2 text-right">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {students.map((s: any) => (
                                                        <tr key={s._id} className="border-b last:border-b-0">
                                                            <td className="px-3 py-2 font-medium text-gray-900">
                                                                {`${s.firstName ?? ""} ${s.lastName ?? ""}`.trim() || "—"}
                                                            </td>
                                                            <td className="px-3 py-2 text-gray-700">
                                                                {s.class ? `Class ${s.class}` : "—"}{s.section ? ` · ${s.section}` : ""}
                                                            </td>
                                                            <td className="px-3 py-2 text-gray-700">{s.admissionNumber ?? "—"}</td>
                                                            <td className="px-3 py-2 text-gray-700">{s.phone ?? "—"}</td>
                                                            <td className="px-3 py-2 text-right">
                                                                <Button
                                                                    variant="outline"
                                                                    className="h-8"
                                                                    disabled={unassignStudents.isPending}
                                                                    onClick={() => unassignStudents.mutate([s._id])}
                                                                >
                                                                    Remove
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="rounded-2xl border border-gray-200 shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm">Assign students to this route</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex flex-col gap-2 md:flex-row md:items-center">
                                        <Input
                                            placeholder="Search by name / admission / phone / username..."
                                            value={assignSearch}
                                            onChange={(e) => setAssignSearch(e.target.value)}
                                        />
                                        <Button
                                            className="bg-indigo-600 hover:bg-indigo-500"
                                            disabled={assignStudents.isPending}
                                            onClick={() => {
                                                const ids = Object.entries(selectedStudentIds)
                                                    .filter(([, v]) => v)
                                                    .map(([k]) => k);
                                                assignStudents.mutate(ids);
                                            }}
                                        >
                                            {assignStudents.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Assign Selected"}
                                        </Button>
                                    </div>

                                    {isAllStudentsLoading ? (
                                        <div className="flex h-24 items-center justify-center">
                                            <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                                        </div>
                                    ) : (
                                        <div className="rounded-xl border border-gray-200">
                                            <table className="w-full text-sm">
                                                <thead className="sticky top-0 bg-white">
                                                    <tr className="border-b text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                                                        <th className="px-3 py-2">Select</th>
                                                        <th className="px-3 py-2">Student</th>
                                                        <th className="px-3 py-2">Class</th>
                                                        <th className="px-3 py-2">Adm No.</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredAssignStudents.slice(0, 200).map((s: any) => {
                                                        const already = students.some((x) => x._id === s._id);
                                                        return (
                                                            <tr key={s._id} className="border-b last:border-b-0">
                                                                <td className="px-3 py-2">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={!!selectedStudentIds[s._id]}
                                                                        disabled={already}
                                                                        onChange={(e) =>
                                                                            setSelectedStudentIds((prev) => ({
                                                                                ...prev,
                                                                                [s._id]: e.target.checked,
                                                                            }))
                                                                        }
                                                                    />
                                                                </td>
                                                                <td className="px-3 py-2 font-medium text-gray-900">
                                                                    {`${s.firstName ?? ""} ${s.lastName ?? ""}`.trim() || "—"}
                                                                    {already ? (
                                                                        <span className="ml-2 text-xs font-medium text-emerald-700">
                                                                            (Already on this bus)
                                                                        </span>
                                                                    ) : null}
                                                                </td>
                                                                <td className="px-3 py-2 text-gray-700">
                                                                    {s.class ? `Class ${s.class}` : "—"}{s.section ? ` · ${s.section}` : ""}
                                                                </td>
                                                                <td className="px-3 py-2 text-gray-700">{s.admissionNumber ?? "—"}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                    <p className="text-xs text-gray-500">
                                        Selecting students will assign them to this bus/route.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
        </LockedFeatureGate>
    );
}
