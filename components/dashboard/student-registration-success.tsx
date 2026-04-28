"use client";

import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Printer, CheckCircle2, X, User, Phone, Mail, MapPin, Calendar, GraduationCap, School } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface StudentRegistrationSuccessProps {
  student: any;
  onClose: () => void;
}

interface SchoolProfile {
  schoolName?: string;
  logo?: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
}

export function StudentRegistrationSuccess({ student, onClose }: StudentRegistrationSuccessProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const { data: school } = useQuery({
    queryKey: ["school-me-registration-success"],
    queryFn: async () => {
      const res = await api.get("/schools/me");
      return (res.data?.data ?? null) as SchoolProfile | null;
    },
  });

  const schoolAddress = [
    school?.address?.street,
    school?.address?.city,
    school?.address?.state,
    school?.address?.pincode,
  ]
    .filter(Boolean)
    .join(", ");

  const handlePrint = () => {
    if (!printRef.current) {
      toast.error("Nothing to print");
      return;
    }
    window.print();
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      // Use browser's print to save as PDF
      handlePrint();
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const formatDate = (date: string | Date) => {
    if (!date) return "N/A";
    const d = new Date(date);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden border border-indigo-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-white" />
            <h2 className="text-xl font-bold text-white">Registration Successful</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(92vh-180px)] bg-gradient-to-b from-indigo-50/40 to-white">
          <div ref={printRef} className="print-content">
            {/* Student Card */}
            <Card className="border border-indigo-100 bg-white shadow-sm">
              <CardContent className="p-6">
                {/* School Header */}
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 mb-5">
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-xl border border-indigo-200 bg-white overflow-hidden flex items-center justify-center shrink-0">
                      {school?.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={school.logo} alt="School logo" className="h-full w-full object-contain" />
                      ) : (
                        <span className="text-indigo-700 font-bold text-lg">
                          {String(school?.schoolName || "S").charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-base font-bold text-gray-900">
                        {school?.schoolName || "School Name"}
                      </p>
                      {schoolAddress && (
                        <p className="text-xs text-gray-600 mt-0.5">{schoolAddress}</p>
                      )}
                      <p className="text-xs text-gray-600 mt-0.5">
                        {[school?.phone, school?.email].filter(Boolean).join(" | ") || "Phone | Email"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Header Section */}
                <div className="flex items-start justify-between mb-5 pb-4 border-b border-indigo-100">
                  <div className="flex items-center gap-4">
                    {student.photo ? (
                      <img
                        src={student.photo}
                        alt={student.firstName}
                        className="w-20 h-20 rounded-xl object-cover border-2 border-indigo-200 shadow-md"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center border-2 border-indigo-200">
                        <User className="h-10 w-10 text-indigo-400" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {student.firstName} {student.lastName}
                      </h3>
                      <p className="text-sm text-indigo-600 font-semibold mt-1">
                        Admission No: {student.admissionNumber || "Pending"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Class: {student.class} - {student.section}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                      <CheckCircle2 className="h-3 w-3" />
                      Active
                    </div>
                  </div>
                </div>

                {/* Personal Details */}
                <div className="space-y-3.5">
                  <div>
                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Personal Information
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-white rounded-lg p-3 border border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Father's Name</p>
                        <p className="text-sm font-semibold text-gray-900">{student.fatherName}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Mother's Name</p>
                        <p className="text-sm font-semibold text-gray-900">{student.motherName}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Date of Birth</p>
                        <p className="text-sm font-semibold text-gray-900">{formatDate(student.dateOfBirth)}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Gender</p>
                        <p className="text-sm font-semibold text-gray-900">{student.gender}</p>
                      </div>
                    </div>
                  </div>

                  {/* Contact Details */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Contact Information
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-white rounded-lg p-3 border border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Phone</p>
                        <p className="text-sm font-semibold text-gray-900">{student.phone}</p>
                      </div>
                      {student.email && (
                        <div className="bg-white rounded-lg p-3 border border-gray-100">
                          <p className="text-xs text-gray-500 mb-1">Email</p>
                          <p className="text-sm font-semibold text-gray-900">{student.email}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Address
                    </h4>
                    <div className="bg-white rounded-lg p-3 border border-gray-100">
                      <p className="text-sm text-gray-900">
                        {student.address?.street}, {student.address?.city}, {student.address?.state} - {student.address?.pincode}
                      </p>
                    </div>
                  </div>

                  {/* Academic Details */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      Academic Information
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-white rounded-lg p-3 border border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Class</p>
                        <p className="text-sm font-semibold text-gray-900">{student.class}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Section</p>
                        <p className="text-sm font-semibold text-gray-900">{student.section}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Roll Number</p>
                        <p className="text-sm font-semibold text-gray-900">{student.rollNumber || "Not Assigned"}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Admission Date</p>
                        <p className="text-sm font-semibold text-gray-900">{formatDate(student.admissionDate)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Fee Details */}
                  {student.totalYearlyFee && (
                    <div>
                      <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <School className="h-4 w-4" />
                        Fee Information
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-3 border border-indigo-100">
                          <p className="text-xs text-gray-500 mb-1">Total Yearly Fee</p>
                          <p className="text-lg font-bold text-indigo-600">₹{student.totalYearlyFee.toLocaleString()}</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 border border-green-100">
                          <p className="text-xs text-gray-500 mb-1">Paid Amount</p>
                          <p className="text-lg font-bold text-green-600">₹{(student.paidAmount || 0).toLocaleString()}</p>
                        </div>
                        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-3 border border-orange-100 col-span-2">
                          <p className="text-xs text-gray-500 mb-1">Due Amount</p>
                          <p className="text-lg font-bold text-orange-600">₹{(student.dueAmount || 0).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3 print-hidden">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-xl"
          >
            Close
          </Button>
          <Button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="rounded-xl gap-2"
          >
            <Download className="h-4 w-4" />
            {isDownloading ? "Downloading..." : "Download PDF"}
          </Button>
          <Button
            onClick={handlePrint}
            className="rounded-xl gap-2 bg-indigo-600 hover:bg-indigo-700"
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }

          body * {
            visibility: hidden !important;
          }
          .print-content, .print-content * {
            visibility: visible !important;
          }
          .print-content {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 0 !important;
          }
          .print-hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
