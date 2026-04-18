"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bus, Plus, Edit2, Trash2, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import api from "@/lib/api";
import { LockedFeatureGate } from "@/components/plan/locked-feature-gate";

export default function TransportDestinationsPage() {
  const queryClient = useQueryClient();
  const [isDestinationModalOpen, setIsDestinationModalOpen] = useState(false);
  const [editingDestination, setEditingDestination] = useState<any>(null);
  const [destinationForm, setDestinationForm] = useState({
    destinationName: "",
    monthlyFee: "",
  });

  const { data: destinations, isLoading } = useQuery({
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

  return (
    <LockedFeatureGate featureKey="transport" featureLabel="Transport">
      <div className="flex-1 space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Transport Destinations</h2>
          <p className="mt-1 text-sm text-gray-500">Manage transport routes and monthly destination fees.</p>
        </div>

        <Card className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <CardHeader className="border-b border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Bus className="h-5 w-5" /> Destinations
                </CardTitle>
                <CardDescription className="text-gray-500 mt-1">Add, edit, and remove fee destinations.</CardDescription>
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
            {isLoading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
              </div>
            ) : destinations && destinations.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {destinations.map((dest: any) => (
                  <div key={dest._id} className="flex items-center justify-between p-6 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                        <Bus className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{dest.destinationName}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Monthly Fee: Rs. {dest.monthlyFee.toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEditDestination(dest)} className="h-8 w-8 p-0 hover:bg-gray-100">
                        <Edit2 className="h-4 w-4 text-gray-600" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteDestination(dest._id)} className="h-8 w-8 p-0 hover:bg-red-50">
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

        <Modal
          isOpen={isDestinationModalOpen}
          onClose={() => setIsDestinationModalOpen(false)}
          title={editingDestination ? "Edit Transport Destination" : "Add Transport Destination"}
          description="Enter destination name and monthly fee"
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
              <Label className="text-xs font-medium text-gray-700">Monthly Fee (Rs.)</Label>
              <Input
                type="number"
                value={destinationForm.monthlyFee}
                onChange={(e) => setDestinationForm((f) => ({ ...f, monthlyFee: e.target.value }))}
                placeholder="e.g., 700"
                className="h-10 border-gray-200 bg-white"
              />
            </div>
            <div className="pt-4 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsDestinationModalOpen(false)} className="rounded-xl h-10 px-4">
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
    </LockedFeatureGate>
  );
}
