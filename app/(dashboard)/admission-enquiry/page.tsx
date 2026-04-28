"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Plus, Phone, Mail, MapPin, Edit, Trash2, Search, Filter } from "lucide-react";
import { toast } from "sonner";

interface AdmissionEnquiry {
  _id: string;
  studentName: string;
  fatherName: string;
  motherName: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  class: string;
  section?: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  enquiryDate: string;
  status: "pending" | "follow_up" | "converted" | "rejected";
  notes?: string;
  referredBy?: string;
  previousSchool?: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  follow_up: "bg-blue-100 text-blue-800 border-blue-200",
  converted: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
};

export default function AdmissionEnquiryPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEnquiry, setEditingEnquiry] = useState<AdmissionEnquiry | null>(null);
  const queryClient = useQueryClient();

  const { data: enquiries = [], isLoading } = useQuery({
    queryKey: ["admission-enquiries", search, statusFilter],
    queryFn: async () => {
      const res = await api.get("/admission-enquiries", { 
        params: { 
          search, 
          status: statusFilter,
          limit: 100 
        } 
      });
      return res.data.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<AdmissionEnquiry>) => {
      const res = await api.post("/admission-enquiries", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admission-enquiries"] });
      setIsAddModalOpen(false);
      toast.success("Enquiry added successfully");
    },
    onError: (error) => {
      console.error("Create error:", error);
      toast.error("Failed to add enquiry");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<AdmissionEnquiry> }) => {
      const res = await api.put(`/admission-enquiries/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admission-enquiries"] });
      setEditingEnquiry(null);
      toast.success("Enquiry updated successfully");
    },
    onError: (error) => {
      console.error("Update error:", error);
      toast.error("Failed to update enquiry");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admission-enquiries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admission-enquiries"] });
      toast.success("Enquiry deleted successfully");
    },
    onError: (error) => {
      console.error("Delete error:", error);
      toast.error("Failed to delete enquiry");
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      studentName: formData.get("studentName") as string,
      fatherName: formData.get("fatherName") as string,
      motherName: formData.get("motherName") as string,
      phone: formData.get("phone") as string,
      alternatePhone: formData.get("alternatePhone") as string,
      email: formData.get("email") as string,
      class: formData.get("class") as string,
      section: formData.get("section") as string,
      address: {
        street: formData.get("street") as string,
        city: formData.get("city") as string,
        state: formData.get("state") as string,
        pincode: formData.get("pincode") as string,
      },
      status: formData.get("status") as "pending" | "follow_up" | "converted" | "rejected",
      notes: formData.get("notes") as string,
      referredBy: formData.get("referredBy") as string,
      previousSchool: formData.get("previousSchool") as string,
    };

    if (editingEnquiry) {
      updateMutation.mutate({ id: editingEnquiry._id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">Admission Enquiries</h1>
          <p className="text-muted-foreground mt-1">Manage parent enquiries for student admissions</p>
        </div>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl gap-2">
              <Plus className="h-4 w-4" />
              Add New Enquiry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle>Add New Admission Enquiry</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="studentName">Student Name *</Label>
                  <Input id="studentName" name="studentName" required placeholder="Enter student name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="class">Class *</Label>
                  <Select
                    name="class"
                    required
                    options={["Nursery", "LKG", "UKG", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"].map((cls) => ({ label: cls, value: cls }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fatherName">Father Name *</Label>
                  <Input id="fatherName" name="fatherName" required placeholder="Enter father name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="motherName">Mother Name *</Label>
                  <Input id="motherName" name="motherName" required placeholder="Enter mother name" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input id="phone" name="phone" required placeholder="Enter phone number" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alternatePhone">Alternate Phone</Label>
                  <Input id="alternatePhone" name="alternatePhone" placeholder="Enter alternate phone" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="Enter email address" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="section">Section</Label>
                  <Input id="section" name="section" placeholder="e.g., A" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Address *</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Input name="street" required placeholder="Street Address" />
                  <Input name="city" required placeholder="City" />
                  <Input name="state" required placeholder="State" />
                  <Input name="pincode" required placeholder="Pincode" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="referredBy">Referred By</Label>
                  <Input id="referredBy" name="referredBy" placeholder="Who referred them?" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="previousSchool">Previous School</Label>
                  <Input id="previousSchool" name="previousSchool" placeholder="Previous school name" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    name="status"
                    defaultValue="pending"
                    options={[
                      { label: "Pending", value: "pending" },
                      { label: "Follow Up", value: "follow_up" },
                      { label: "Converted", value: "converted" },
                      { label: "Rejected", value: "rejected" },
                    ]}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  name="notes"
                  placeholder="Any additional notes..."
                  rows={3}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Adding..." : "Add Enquiry"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Enquiries</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search enquiries..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 rounded-xl w-64"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-40 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="follow_up">Follow Up</option>
                <option value="converted">Converted</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading enquiries...</div>
          ) : enquiries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No enquiries found. Click "Add New Enquiry" to create one.
            </div>
          ) : (
            <div className="space-y-3">
              {enquiries.map((enquiry: AdmissionEnquiry) => (
                <div
                  key={enquiry._id}
                  className="p-4 rounded-xl border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm truncate">{enquiry.studentName}</h4>
                        <Badge className={`text-xs ${statusColors[enquiry.status] || statusColors.pending}`}>
                          {enquiry.status.replace("_", " ").toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {enquiry.fatherName} • Class: {enquiry.class}{enquiry.section ? `-${enquiry.section}` : ""}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {enquiry.phone}
                        </span>
                        {enquiry.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {enquiry.email}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3" />
                        {enquiry.address.city}, {enquiry.address.state}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => setEditingEnquiry(enquiry)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => deleteMutation.mutate(enquiry._id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={!!editingEnquiry} onOpenChange={() => setEditingEnquiry(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit Admission Enquiry</DialogTitle>
          </DialogHeader>
          {editingEnquiry && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-studentName">Student Name *</Label>
                  <Input id="edit-studentName" name="studentName" defaultValue={editingEnquiry.studentName} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-class">Class *</Label>
                  <Select
                    name="class"
                    defaultValue={editingEnquiry.class}
                    required
                    options={["Nursery", "LKG", "UKG", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"].map((cls) => ({ label: cls, value: cls }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-fatherName">Father Name *</Label>
                  <Input id="edit-fatherName" name="fatherName" defaultValue={editingEnquiry.fatherName} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-motherName">Mother Name *</Label>
                  <Input id="edit-motherName" name="motherName" defaultValue={editingEnquiry.motherName} required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Phone Number *</Label>
                  <Input id="edit-phone" name="phone" defaultValue={editingEnquiry.phone} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-alternatePhone">Alternate Phone</Label>
                  <Input id="edit-alternatePhone" name="alternatePhone" defaultValue={editingEnquiry.alternatePhone} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input id="edit-email" name="email" type="email" defaultValue={editingEnquiry.email} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-section">Section</Label>
                  <Input id="edit-section" name="section" defaultValue={editingEnquiry.section} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Address *</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Input name="street" defaultValue={editingEnquiry.address.street} required placeholder="Street Address" />
                  <Input name="city" defaultValue={editingEnquiry.address.city} required placeholder="City" />
                  <Input name="state" defaultValue={editingEnquiry.address.state} required placeholder="State" />
                  <Input name="pincode" defaultValue={editingEnquiry.address.pincode} required placeholder="Pincode" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-referredBy">Referred By</Label>
                  <Input id="edit-referredBy" name="referredBy" defaultValue={editingEnquiry.referredBy} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-previousSchool">Previous School</Label>
                  <Input id="edit-previousSchool" name="previousSchool" defaultValue={editingEnquiry.previousSchool} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select
                    name="status"
                    defaultValue={editingEnquiry.status}
                    options={[
                      { label: "Pending", value: "pending" },
                      { label: "Follow Up", value: "follow_up" },
                      { label: "Converted", value: "converted" },
                      { label: "Rejected", value: "rejected" },
                    ]}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <textarea
                  id="edit-notes"
                  name="notes"
                  defaultValue={editingEnquiry.notes}
                  rows={3}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditingEnquiry(null)}>Cancel</Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Updating..." : "Update Enquiry"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
