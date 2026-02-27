"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Mail, Phone, Calendar, Save, KeyRound, X, Copy, CalendarDays, Megaphone, Bus, Shield } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

function SetCredentialsModal({ staff, onClose }: { staff: { _id: string; name: string; email: string; role?: string }; onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      await api.post(`/users/${staff._id}/set-password`, { password });
    },
    onSuccess: () => {
      setDone(true);
      toast.success("Password set successfully");
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? "Failed to set password"),
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success("Copied!"));
  };

  const isTeacher = (staff.role || "").toLowerCase() === "teacher";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-bold text-gray-900">
            <KeyRound className="h-5 w-5 text-emerald-600" />
            Teacher / Staff Login Credentials
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-5 rounded-xl bg-emerald-50 p-4 space-y-2">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-800">Portal login</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-600">Email</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-emerald-900">{staff.email}</span>
              <button type="button" onClick={() => handleCopy(staff.email)} className="text-emerald-500 hover:text-emerald-700">
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <p className="mt-2 text-xs text-emerald-600">
            {isTeacher ? "Teacher logs in at: " : "Staff logs in at: "}
            <span className="font-medium">/teacher/login</span> or School Login with this email
          </p>
        </div>

        {!done ? (
          <div className="space-y-3">
            <Label className="text-gray-700">Set password for this {isTeacher ? "teacher" : "staff member"}</Label>
            <Input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              className="rounded-xl border-gray-200"
            />
            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending || password.length < 6}
                className="rounded-xl bg-emerald-600 font-semibold hover:bg-emerald-700"
              >
                {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Set Password
              </Button>
              <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <p className="text-sm font-medium text-emerald-700">Password has been set. Share with {staff.name} securely:</p>
            <div className="rounded-xl border border-emerald-200 bg-white p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Email</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold">{staff.email}</span>
                  <button type="button" onClick={() => handleCopy(staff.email)} className="text-emerald-500 hover:text-emerald-700">
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Password</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold">{password}</span>
                  <button type="button" onClick={() => handleCopy(password)} className="text-emerald-500 hover:text-emerald-700">
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
            <Button onClick={onClose} className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700">
              Done
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function StaffProfilePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const staffId = params?.id;
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [permissions, setPermissions] = useState<string[]>([]);

  const { data: staff, isLoading } = useQuery({
    queryKey: ["staff-profile", staffId],
    queryFn: async () => {
      const res = await api.get(`/users/${staffId}`);
      return res.data.data;
    },
    enabled: !!staffId,
  });

  useEffect(() => {
    if (staff) {
      setName(staff.name ?? "");
      setEmail(staff.email ?? "");
      setPhone(staff.phone ?? "");
      setPermissions(Array.isArray(staff.permissions) ? [...staff.permissions] : []);
    }
  }, [staff]);

  const updateMutation = useMutation({
    mutationFn: async (payload: { name?: string; email?: string; phone?: string; permissions?: string[] }) => {
      await api.put(`/users/${staffId}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-profile", staffId] });
      queryClient.invalidateQueries({ queryKey: ["staff-detail", staffId] });
      queryClient.invalidateQueries({ queryKey: ["staff-list"] });
      toast.success("Profile updated");
      setEditing(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message ?? "Update failed");
    },
  });

  if (!staffId) return null;
  if (isLoading || !staff) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const handleSave = () => {
    updateMutation.mutate({ name, email, phone });
  };

  const permissionsList = [
    { key: "edit_timetable", label: "Edit timetable / change schedule", icon: CalendarDays },
    { key: "manage_announcements", label: "Manage announcements", icon: Megaphone },
    { key: "view_transport", label: "View bus routes (transport)", icon: Bus },
  ];

  const togglePermission = (key: string) => {
    const next = permissions.includes(key) ? permissions.filter((p) => p !== key) : [...permissions, key];
    setPermissions(next);
    api.put(`/users/${staffId}`, { permissions: next }).then(() => {
      queryClient.invalidateQueries({ queryKey: ["staff-profile", staffId] });
      queryClient.invalidateQueries({ queryKey: ["staff-list"] });
      toast.success("Access updated");
    }).catch((err: any) => toast.error(err.response?.data?.message ?? "Failed to update"));
  };

  const isTeacher = (staff.role || "").toLowerCase() === "teacher";

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => router.push(`/staff/${staffId}`)}
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to payroll
      </button>

      <Card className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <CardHeader className="border-b border-gray-100 bg-gray-50/50">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-white shadow">
                <AvatarImage src={staff.photo} />
                <AvatarFallback className="bg-indigo-100 text-lg font-semibold text-indigo-600">
                  {staff.name?.charAt(0) ?? "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-xl">{staff.name}</CardTitle>
                <Badge variant="secondary" className="mt-1">
                  {staff.role?.replace("_", " ")}
                </Badge>
              </div>
            </div>
            {!editing ? (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-gray-500 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              {editing ? (
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white"
                />
              ) : (
                <p className="text-gray-900">{staff.email ?? "—"}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-gray-500 flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone
              </Label>
              {editing ? (
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-white"
                />
              ) : (
                <p className="text-gray-900">{staff.phone ?? "—"}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-gray-500 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Joining date
              </Label>
              <p className="text-gray-900">
                {staff.joiningDate
                  ? new Date(staff.joiningDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "—"}
              </p>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-gray-500 flex items-center gap-2">
                <KeyRound className="h-4 w-4" />
                Login credentials
              </Label>
              <p className="text-sm text-gray-600 mb-2">
                Set or reset the password for Teacher Portal / School login.
              </p>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300"
                onClick={() => setShowCredentialsModal(true)}
              >
                <KeyRound className="h-4 w-4 mr-2" />
                Set login credentials
              </Button>
            </div>

            {isTeacher && (
              <div className="space-y-3 sm:col-span-2">
                <Label className="text-gray-700 font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Access permissions
                </Label>
                <p className="text-sm text-gray-500">
                  Grant this teacher access to extra features. By default teachers can only view the timetable.
                </p>
                <div className="flex flex-wrap gap-4 pt-2">
                  {permissionsList.map(({ key, label, icon: Icon }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permissions.includes(key)}
                        onChange={() => togglePermission(key)}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <Icon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {editing && (
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-gray-500">Full name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-white"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {showCredentialsModal && (
        <SetCredentialsModal
          staff={{ _id: staff._id, name: staff.name, email: staff.email, role: staff.role }}
          onClose={() => setShowCredentialsModal(false)}
        />
      )}
    </div>
  );
}
