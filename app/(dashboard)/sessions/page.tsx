"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Calendar, CheckCircle, XCircle } from "lucide-react";
import { LockedFeatureGate } from "@/components/plan/locked-feature-gate";
import api from "@/lib/api";
import { toast } from "sonner";

interface Session {
  _id: string;
  sessionYear: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  promotionCompleted: boolean;
  promotionDate?: string;
  createdAt: string;
}

export default function SessionsPage() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    sessionYear: "",
    startDate: "",
    endDate: "",
    isActive: false,
  });

  const queryClient = useQueryClient();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const response = await api.get("/sessions");
      return response.data.data as Session[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await api.post("/sessions", data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Session created successfully");
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      setShowForm(false);
      setFormData({ sessionYear: "", startDate: "", endDate: "", isActive: false });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create session");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Session> }) => {
      const response = await api.patch(`/sessions/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Session updated successfully");
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update session");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const toggleActive = (session: Session) => {
    updateMutation.mutate({
      id: session._id,
      data: { isActive: !session.isActive },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading sessions...</div>
      </div>
    );
  }

  return (
    <LockedFeatureGate featureKey="sessions" featureLabel="Sessions">
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Academic Sessions</h1>
          <p className="text-gray-600 mt-1">Manage academic years and sessions</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" />
          New Session
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">Create New Session</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Session Year
                </label>
                <input
                  type="text"
                  placeholder="e.g., 2024-2025"
                  value={formData.sessionYear}
                  onChange={(e) => setFormData({ ...formData, sessionYear: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                />
                <label htmlFor="isActive" className="ml-2 text-sm font-medium text-gray-700">
                  Set as Active Session
                </label>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {createMutation.isPending ? "Creating..." : "Create Session"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {sessions.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <Calendar className="w-12 h-12 text-yellow-600 mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No Sessions Found</h3>
            <p className="text-gray-600 mb-4">
              Create your first academic session to start managing students and classes.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Create Session
            </button>
          </div>
        ) : (
          sessions.map((session) => (
            <div
              key={session._id}
              className={`bg-white p-6 rounded-lg border ${
                session.isActive ? "border-green-500 shadow-md" : "border-gray-200"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {session.sessionYear}
                    </h3>
                    {session.isActive && (
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        Active
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Start Date:</span>{" "}
                      {new Date(session.startDate).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-medium">End Date:</span>{" "}
                      {new Date(session.endDate).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-medium">Promotion:</span>{" "}
                      {session.promotionCompleted ? "Completed" : "Pending"}
                    </div>
                    <div>
                      <span className="font-medium">Created:</span>{" "}
                      {new Date(session.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => toggleActive(session)}
                  disabled={updateMutation.isPending}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    session.isActive
                      ? "bg-red-100 text-red-700 hover:bg-red-200"
                      : "bg-green-100 text-green-700 hover:bg-green-200"
                  }`}
                >
                  {session.isActive ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
    </LockedFeatureGate>
  );
}
