"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
