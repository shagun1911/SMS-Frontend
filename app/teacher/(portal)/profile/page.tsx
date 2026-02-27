"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import { User, Lock, Eye, EyeOff, Loader2, CheckCircle, Mail } from "lucide-react";
import { toast } from "sonner";

export default function TeacherProfilePage() {
  const searchParams = useSearchParams();
  const forceChange = searchParams.get("changePassword") === "1";
  const { user, clearMustChangePassword } = useAuthStore();

  const [showChangePassword, setShowChangePassword] = useState(forceChange);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    if (forceChange) setShowChangePassword(true);
  }, [forceChange]);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["teacher-profile"],
    queryFn: async () => {
      const res = await api.get("/auth/me");
      return res.data.data;
    },
  });

  const changePwMutation = useMutation({
    mutationFn: async () => {
      await api.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });
    },
    onSuccess: () => {
      toast.success("Password changed successfully!");
      clearMustChangePassword();
      setShowChangePassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to change password");
    },
  });

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    changePwMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const data = profile || user;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <User className="h-6 w-6 text-emerald-600" />
          My Profile
        </h1>
      </div>

      {forceChange && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold text-amber-800">Change your password</p>
            <p className="mt-0.5 text-sm text-amber-600">
              Your password was set by the admin. Please change it for security.
            </p>
          </div>
        </div>
      )}

      {/* Personal info */}
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-slate-900">Personal Information</h2>
        <div className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <p className="mb-0.5 text-xs uppercase tracking-wide text-slate-500">Name</p>
            <p className="font-medium text-slate-900">{data?.name ?? "—"}</p>
          </div>
          <div>
            <p className="mb-0.5 text-xs uppercase tracking-wide text-slate-500">Email</p>
            <p className="flex items-center gap-2 font-medium text-slate-900">
              <Mail className="h-4 w-4 text-slate-400" />
              {data?.email ?? "—"}
            </p>
          </div>
          <div>
            <p className="mb-0.5 text-xs uppercase tracking-wide text-slate-500">Role</p>
            <p className="font-medium text-slate-900 capitalize">{(data?.role ?? "").replace("_", " ")}</p>
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold text-slate-900">
            <Lock className="h-5 w-5 text-slate-400" />
            Change Password
          </h2>
          {!showChangePassword && (
            <button
              type="button"
              onClick={() => setShowChangePassword(true)}
              className="text-sm text-emerald-600 hover:underline"
            >
              Change
            </button>
          )}
        </div>

        {showChangePassword ? (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">New Password</label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={changePwMutation.isPending}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-70"
              >
                {changePwMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Save Password
              </button>
              {!forceChange && (
                <button
                  type="button"
                  onClick={() => setShowChangePassword(false)}
                  className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        ) : (
          <p className="text-sm text-slate-500">Your password is set. Click "Change" to update it.</p>
        )}
      </div>
    </div>
  );
}
