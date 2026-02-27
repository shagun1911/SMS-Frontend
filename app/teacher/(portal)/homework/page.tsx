"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { BookOpen, Plus, Trash2, Loader2, X } from "lucide-react";
import { toast } from "sonner";

export default function TeacherHomeworkPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    className: "",
    section: "",
    subject: "",
    title: "",
    description: "",
    dueDate: "",
    attachmentUrl: "",
  });

  const { data: classes = [] } = useQuery({
    queryKey: ["all-classes"],
    queryFn: async () => {
      const res = await api.get("/classes");
      return res.data.data ?? [];
    },
  });

  const { data: homework = [], isLoading } = useQuery({
    queryKey: ["teacher-homework"],
    queryFn: async () => {
      const res = await api.get("/homework");
      return res.data.data ?? [];
    },
  });

  const selectedClassData = classes.find((c: any) => c.className === form.className);

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/homework", form);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Homework assigned successfully!");
      queryClient.invalidateQueries({ queryKey: ["teacher-homework"] });
      setShowForm(false);
      setForm({ className: "", section: "", subject: "", title: "", description: "", dueDate: "", attachmentUrl: "" });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to assign homework"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/homework/${id}`);
    },
    onSuccess: () => {
      toast.success("Homework removed");
      queryClient.invalidateQueries({ queryKey: ["teacher-homework"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            Homework Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">Assign and manage homework for your classes</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 text-sm font-semibold"
        >
          <Plus className="w-4 h-4" /> Assign Homework
        </button>
      </div>

      {/* Assignment Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-emerald-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">New Homework Assignment</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
              <select
                value={form.className}
                onChange={(e) => setForm({ ...form, className: e.target.value, section: "" })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                required
              >
                <option value="">Select Class</option>
                {classes.map((c: any) => (
                  <option key={c._id} value={c.className}>Class {c.className}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
              <select
                value={form.section}
                onChange={(e) => setForm({ ...form, section: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                required
                disabled={!form.className}
              >
                <option value="">Select Section</option>
                {(selectedClassData?.sections || []).map((s: string) => (
                  <option key={s} value={s}>Section {s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="e.g. Mathematics"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Homework title"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe the assignment in detail..."
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Attachment URL (optional)</label>
              <input
                type="url"
                value={form.attachmentUrl}
                onChange={(e) => setForm({ ...form, attachmentUrl: e.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 flex items-center gap-2"
              >
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Assign
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm hover:bg-gray-200">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Homework list */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
      ) : homework.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <BookOpen className="w-16 h-16 mx-auto mb-3 text-gray-200" />
          <p className="font-medium">No homework assigned yet</p>
          <button onClick={() => setShowForm(true)} className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm hover:bg-emerald-700">
            Assign First Homework
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {homework.map((hw: any) => (
            <div key={hw._id} className="bg-white rounded-2xl border border-gray-200 p-5 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg">
                    Class {hw.className}-{hw.section}
                  </span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-lg">{hw.subject}</span>
                </div>
                <h3 className="font-semibold text-gray-900">{hw.title}</h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{hw.description}</p>
                <p className="text-xs text-gray-400 mt-2">Due: {new Date(hw.dueDate).toLocaleDateString()}</p>
              </div>
              <button
                onClick={() => deleteMutation.mutate(hw._id)}
                disabled={deleteMutation.isPending}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
