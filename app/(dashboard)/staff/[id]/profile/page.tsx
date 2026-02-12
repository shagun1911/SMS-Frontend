"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Mail, Phone, Calendar, Save } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function StaffProfilePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const staffId = params?.id;
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const { data: staff, isLoading } = useQuery({
    queryKey: ["staff-profile", staffId],
    queryFn: async () => {
      const res = await api.get(`/users/${staffId}`);
      return res.data.data;
    },
    enabled: !!staffId,
    onSuccess: (data) => {
      if (data) {
        setName(data.name ?? "");
        setEmail(data.email ?? "");
        setPhone(data.phone ?? "");
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: { name?: string; email?: string; phone?: string }) => {
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
    </div>
  );
}
