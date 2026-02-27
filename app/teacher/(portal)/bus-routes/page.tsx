"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Bus, Loader2, MapPin } from "lucide-react";

export default function TeacherBusRoutesPage() {
  const { data: fleet = [], isLoading } = useQuery({
    queryKey: ["transport-fleet"],
    queryFn: async () => {
      const res = await api.get("/transport");
      return res.data.data ?? [];
    },
  });

  const activeBuses = fleet.filter((b: any) => b.isActive !== false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <Bus className="h-6 w-6 text-emerald-600" />
          Bus routes
        </h1>
        <p className="text-gray-500 text-sm mt-1">View bus routes and vehicle details (read-only)</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      ) : activeBuses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-500">
          <Bus className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No bus routes added yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeBuses.map((bus: any) => (
            <div
              key={bus._id}
              className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                  <Bus className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900">Bus {bus.busNumber}</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mt-0.5">{bus.registrationNumber}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="font-medium">{bus.routeName}</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">Capacity: {bus.capacity} students</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
