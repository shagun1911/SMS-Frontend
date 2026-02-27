"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useStudentAuthStore } from "@/store/studentAuthStore";
import studentApi from "@/lib/studentApi";
import { User, Lock, Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function StudentProfilePage() {
  const searchParams = useSearchParams();
  const forceChange = searchParams.get("changePassword") === "1";
  const { student, clearMustChange } = useStudentAuthStore();

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
    queryKey: ["student-profile"],
    queryFn: async () => {
      const res = await studentApi.get("/auth/student/me");
      return res.data.data;
    },
  });

  const changePwMutation = useMutation({
    mutationFn: async () => {
      const res = await studentApi.post("/auth/student/change-password", {
        currentPassword,
        newPassword,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Password changed successfully!");
      clearMustChange();
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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const data = profile || student;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <User className="w-6 h-6 text-indigo-600" />
          My Profile
        </h1>
      </div>

      {forceChange && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800">Change your password</p>
            <p className="text-sm text-amber-600 mt-0.5">
              You are using the default password. Please change it for security.
            </p>
          </div>
        </div>
      )}

      {/* Personal info */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Personal Information</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          {[
            ["Full Name", `${data?.firstName} ${data?.lastName}`],
            ["Admission Number", data?.admissionNumber],
            ["Class", `${data?.class} — Section ${data?.section}`],
            ["Roll Number", data?.rollNumber || "—"],
            ["Father's Name", data?.fatherName || "—"],
            ["Mother's Name", data?.motherName || "—"],
            ["Date of Birth", data?.dateOfBirth ? new Date(data.dateOfBirth).toLocaleDateString() : "—"],
            ["Gender", data?.gender || "—"],
            ["Phone", data?.phone || "—"],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">{label}</p>
              <p className="font-medium text-gray-900">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Lock className="w-5 h-5 text-gray-400" />
            Change Password
          </h2>
          {!showChangePassword && (
            <button
              onClick={() => setShowChangePassword(true)}
              className="text-sm text-indigo-600 hover:underline"
            >
              Change
            </button>
          )}
        </div>

        {showChangePassword ? (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none pr-10"
                  required
                />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none pr-10"
                  required
                />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                required
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={changePwMutation.isPending}
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 flex items-center gap-2"
              >
                {changePwMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Save Password
              </button>
              {!forceChange && (
                <button type="button" onClick={() => setShowChangePassword(false)} className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200">
                  Cancel
                </button>
              )}
            </div>
          </form>
        ) : (
          <p className="text-sm text-gray-500">Your password is set. Click "Change" to update it.</p>
        )}
      </div>
    </div>
  );
}
