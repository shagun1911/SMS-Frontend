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
    Shield,
    Users,
    ChevronRight,
    Loader2,
    Gauge,
    AlertTriangle,
    CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import api from "@/lib/api";

export default function TransportPage() {
    const { data: transportData, isLoading } = useQuery({
        queryKey: ["transport-list"],
        queryFn: async () => {
            const res = await api.get("/transport");
            return res.data.data;
        }
    });

    const fleet = transportData || [];

    return (
        <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                        Fleet Management
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Track school buses, maintain routes, and monitor student safety.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="gap-2 border-white/10 hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors h-12 rounded-xl text-xs font-bold uppercase tracking-widest">
                        <Navigation className="h-4 w-4" /> Live Tracking
                    </Button>
                    <Button className="bg-cyan-600 hover:bg-cyan-500 gap-2 font-bold h-12 rounded-xl shadow-lg shadow-cyan-500/20 text-xs uppercase tracking-widest">
                        <Plus className="h-4 w-4" /> Add Vehicle
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-4">
                <Card className="border-white/5 bg-neutral-900/50 backdrop-blur-xl p-6 relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                        <Bus className="h-16 w-16" />
                    </div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total Fleet</p>
                    <h3 className="text-3xl font-bold text-white mt-1">12</h3>
                    <div className="flex items-center gap-1.5 mt-2">
                        <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px]">10 ACTIVE</Badge>
                        <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[9px]">2 MAINT.</Badge>
                    </div>
                </Card>
                <Card className="border-white/5 bg-neutral-900/50 backdrop-blur-xl p-6 relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                        <Users className="h-16 w-16" />
                    </div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Capacity</p>
                    <h3 className="text-3xl font-bold text-white mt-1">84%</h3>
                    <Progress value={84} className="h-1.5 mt-3 bg-white/5" />
                </Card>
                <Card className="border-white/5 bg-neutral-900/50 backdrop-blur-xl p-6 relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                        <Shield className="h-16 w-16" />
                    </div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Safety Incidents</p>
                    <h3 className="text-3xl font-bold text-white mt-1">0</h3>
                    <p className="text-[10px] text-emerald-500 font-bold mt-2 uppercase tracking-widest">Perfect Record</p>
                </Card>
                <Card className="border-white/5 bg-neutral-900/50 backdrop-blur-xl p-6 relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                        <Navigation className="h-16 w-16" />
                    </div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Active Routes</p>
                    <h3 className="text-3xl font-bold text-white mt-1">08</h3>
                    <p className="text-[10px] text-zinc-500 font-bold mt-2 uppercase tracking-widest">Across City Sections</p>
                </Card>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input placeholder="Search vehicles or routes..." className="pl-10 bg-white/[0.02] border-white/10 h-12 rounded-xl focus:ring-cyan-500/20" />
                </div>
                <Button variant="outline" className="gap-2 border-white/10 h-12 rounded-xl bg-white/[0.02] text-xs font-bold uppercase tracking-widest">
                    <Filter className="h-4 w-4" /> Area Filters
                </Button>
            </div>

            {isLoading ? (
                <div className="flex h-64 w-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i} className="border-white/5 bg-neutral-900/50 backdrop-blur-xl overflow-hidden group hover:border-cyan-500/30 transition-all rounded-[2rem]">
                            <CardContent className="p-0">
                                <div className="flex flex-col md:flex-row">
                                    <div className="w-full md:w-48 bg-cyan-600/10 p-8 flex flex-col items-center justify-center border-r border-white/5 group-hover:bg-cyan-600/20 transition-colors">
                                        <Bus className="h-12 w-12 text-cyan-400 mb-2" />
                                        <div className="text-center">
                                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Vehicle ID</p>
                                            <h4 className="text-lg font-bold text-white uppercase tracking-tighter mt-1">BUS-0{i}</h4>
                                        </div>
                                    </div>
                                    <div className="flex-1 p-8">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="text-xl font-bold text-white uppercase tracking-tight">Vidyut Route #{i}</h3>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <MapPin className="h-3 w-3 text-cyan-500" />
                                                    <span className="text-xs font-medium text-zinc-400">Civil Lines ➔ Malviya Nagar</span>
                                                </div>
                                            </div>
                                            <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px] font-bold uppercase tracking-widest">En Route</Badge>
                                        </div>

                                        <div className="mt-8 grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Staff In-charge</p>
                                                <p className="text-xs font-bold text-white">Rajesh Kumar (Driver)</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Passengers</p>
                                                <p className="text-xs font-bold text-white">42 / 50 Students</p>
                                            </div>
                                        </div>

                                        <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-1.5">
                                                    <Gauge className="h-3.5 w-3.5 text-cyan-500" />
                                                    <span className="text-[10px] font-bold text-white">72 km/h</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                                    <span className="text-[10px] font-bold text-white">On Schedule</span>
                                                </div>
                                            </div>
                                            <Button variant="ghost" className="h-9 gap-2 text-[10px] font-bold text-cyan-400 hover:bg-cyan-500/10 uppercase tracking-widest pr-2">
                                                Live Intel <ChevronRight className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
