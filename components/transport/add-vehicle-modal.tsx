"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { UserRole } from "@/types";
import { TransportStaffSelect } from "@/components/transport/transport-staff-select";

interface AddVehicleModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AddVehicleModal({ open, onOpenChange }: AddVehicleModalProps) {
    const queryClient = useQueryClient();
    const [busNumber, setBusNumber] = useState("");
    const [registrationNumber, setRegistrationNumber] = useState("");
    const [routeName, setRouteName] = useState("");
    const [capacity, setCapacity] = useState("");
    const [driverUserId, setDriverUserId] = useState("");
    const [driverName, setDriverName] = useState("");
    const [driverPhone, setDriverPhone] = useState("");
    const [conductorUserId, setConductorUserId] = useState("");
    const [conductorName, setConductorName] = useState("");
    const [conductorPhone, setConductorPhone] = useState("");

    const { data: staffData = [] } = useQuery({
        queryKey: ["staff-list"],
        queryFn: async () => {
            const res = await api.get("/users");
            return res.data.data ?? [];
        },
        enabled: open,
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

    const addVehicle = useMutation({
        mutationFn: async (data: any) => {
            const res = await api.post("/transport", data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transport-list"] });
            toast.success("Vehicle added successfully");
            resetForm();
            onOpenChange(false);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message ?? "Failed to add vehicle");
        },
    });

    const resetForm = () => {
        setBusNumber("");
        setRegistrationNumber("");
        setRouteName("");
        setCapacity("");
        setDriverUserId("");
        setDriverName("");
        setDriverPhone("");
        setConductorUserId("");
        setConductorName("");
        setConductorPhone("");
    };

    const handleSubmit = () => {
        if (!busNumber || !registrationNumber || !routeName || !capacity) {
            toast.error("Please fill all required fields");
            return;
        }
        const payload = {
            busNumber: busNumber.toUpperCase(),
            registrationNumber: registrationNumber.toUpperCase(),
            routeName,
            capacity: Number(capacity),
            driverName: driverName?.trim() || undefined,
            driverPhone: driverPhone?.trim() || undefined,
            conductorName: conductorName?.trim() || undefined,
            conductorPhone: conductorPhone?.trim() || undefined,
        };
        addVehicle.mutate(payload);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Add New Vehicle</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Bus Number *</Label>
                            <Input
                                placeholder="e.g., BUS-01"
                                value={busNumber}
                                onChange={(e) => setBusNumber(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Registration Number *</Label>
                            <Input
                                placeholder="e.g., DL01AB1234"
                                value={registrationNumber}
                                onChange={(e) => setRegistrationNumber(e.target.value)}
                            />
                        </div>
                        <div className="col-span-2 space-y-2">
                            <Label>Route Name *</Label>
                            <Input
                                placeholder="e.g., Route 1 - North Sector"
                                value={routeName}
                                onChange={(e) => setRouteName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Capacity *</Label>
                            <Input
                                type="number"
                                placeholder="e.g., 40"
                                value={capacity}
                                onChange={(e) => setCapacity(e.target.value)}
                            />
                        </div>
                        <div className="col-span-2 space-y-3 rounded-lg border border-dashed border-muted-foreground/25 bg-muted/20 p-3">
                            <p className="text-xs font-medium text-muted-foreground">
                                Assign crew from <span className="font-semibold text-foreground">Staff</span> (roles: Bus
                                Driver / Conductor). Register them first if the lists are empty.
                            </p>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <TransportStaffSelect
                                    label="Driver"
                                    members={busDrivers.map((u: any) => ({
                                        _id: u._id,
                                        name: u.name,
                                        phone: u.phone,
                                    }))}
                                    valueId={driverUserId}
                                    placeholder="Select bus driver…"
                                    onChange={(m) => {
                                        setDriverUserId(m?._id ?? "");
                                        setDriverName(m?.name ?? "");
                                        setDriverPhone(m?.phone ?? "");
                                    }}
                                />
                                <TransportStaffSelect
                                    label="Conductor"
                                    members={busConductors.map((u: any) => ({
                                        _id: u._id,
                                        name: u.name,
                                        phone: u.phone,
                                    }))}
                                    valueId={conductorUserId}
                                    placeholder="Select conductor…"
                                    onChange={(m) => {
                                        setConductorUserId(m?._id ?? "");
                                        setConductorName(m?.name ?? "");
                                        setConductorPhone(m?.phone ?? "");
                                    }}
                                />
                            </div>
                            {busDrivers.length === 0 && busConductors.length === 0 && (
                                <p className="text-xs text-amber-800">
                                    No drivers or conductors found. Add personnel under Staff → Register New Personnel.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                            resetForm();
                            onOpenChange(false);
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        className="flex-1 bg-indigo-600 hover:bg-indigo-500"
                        onClick={handleSubmit}
                        disabled={addVehicle.isPending}
                    >
                        {addVehicle.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            "Add Vehicle"
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
