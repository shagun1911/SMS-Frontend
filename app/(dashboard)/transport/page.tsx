"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Bus,
    Plus,
    Search,
    Filter,
    MapPin,
    Navigation,
    Users,
    ChevronRight,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AddVehicleModal } from "@/components/transport/add-vehicle-modal";
import { LockedFeatureGate } from "@/components/plan/locked-feature-gate";
import api from "@/lib/api";

export default function TransportPage() {
    const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
    const { data: transportData, isLoading } = useQuery({
        queryKey: ["transport-list"],
        queryFn: async () => {
            const res = await api.get("/transport");
            return res.data.data;
        }
    });

    const fleet = transportData || [];

    return (
        <LockedFeatureGate featureKey="transport" featureLabel="Transport">
        <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                        Fleet Management
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Track school buses, maintain routes, and monitor student safety.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="gap-2 h-10 rounded-xl border-gray-200 hover:bg-gray-50">
                        <Navigation className="h-4 w-4" /> Live Tracking
                    </Button>
                    <Button 
                        className="bg-indigo-600 hover:bg-indigo-500 gap-2 h-10 rounded-xl"
                        onClick={() => setIsAddVehicleOpen(true)}
                    >
                        <Plus className="h-4 w-4" /> Add Vehicle
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-4">
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
                        <Card key={item._id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
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
        </div>
        </LockedFeatureGate>
    );
}
