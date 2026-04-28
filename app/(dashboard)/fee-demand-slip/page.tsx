"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Printer, Download, User, Calendar, IndianRupee, AlertCircle, FileText } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface Student {
  _id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  fatherName: string;
  class: string;
  section: string;
  phone: string;
  dueAmount: number;
  totalYearlyFee: number;
  paidAmount: number;
}

interface SessionMonthlyFee {
  month: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: string;
}

interface FeeSummaryResponse {
  monthlyFee?: number;
  oneTimeFee?: number;
  sessionMonthlyFees?: SessionMonthlyFee[];
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

function formatCurrency(value: number) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

export default function FeeDemandSlipPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [customMessage, setCustomMessage] = useState("Please pay the fee before 15th of this month to avoid late fee charges.");
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["students-for-fee-slip", searchQuery],
    queryFn: async () => {
      const params: Record<string, string | number> = { limit: 50 };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      const res = await api.get("/students", { params });
      return res.data.data || [];
    },
    enabled: true,
  });

  const { data: feeSummary, isLoading: feeSummaryLoading } = useQuery({
    queryKey: ["fee-demand-slip-summary", selectedStudent?._id],
    queryFn: async () => {
      const res = await api.get(`/fees/student/${selectedStudent?._id}`);
      return (res.data?.data ?? null) as FeeSummaryResponse | null;
    },
    enabled: !!selectedStudent?._id,
  });

  const { data: school } = useQuery({
    queryKey: ["school-me-for-fee-slip"],
    queryFn: async () => {
      const res = await api.get("/schools/me");
      return (res.data?.data ?? null) as SchoolProfile | null;
    },
    enabled: true,
  });

  const monthRows = useMemo(() => {
    const rows = feeSummary?.sessionMonthlyFees;
    if (Array.isArray(rows) && rows.length > 0) return rows;

    const fallbackMonths = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const fallbackMonthlyDue =
      (selectedStudent?.totalYearlyFee ?? 0) > 0
        ? Math.round((selectedStudent?.totalYearlyFee ?? 0) / 12)
        : 0;

    return fallbackMonths.map((month) => ({
      month,
      totalAmount: fallbackMonthlyDue,
      paidAmount: 0,
      remainingAmount: fallbackMonthlyDue,
      status: "pending",
    }));
  }, [feeSummary?.sessionMonthlyFees, selectedStudent?.totalYearlyFee]);

  const dueMonthRows = useMemo(
    () => monthRows.filter((row) => Number(row.remainingAmount || 0) > 0),
    [monthRows]
  );

  const selectedMonthRows = useMemo(
    () => monthRows.filter((row) => selectedMonths.includes(row.month)),
    [monthRows, selectedMonths]
  );

  const selectedTotalAmount = useMemo(
    () => selectedMonthRows.reduce((sum, row) => sum + (Number(row.remainingAmount) || 0), 0),
    [selectedMonthRows]
  );

  const selectedTotalOriginal = useMemo(
    () => selectedMonthRows.reduce((sum, row) => sum + (Number(row.totalAmount) || 0), 0),
    [selectedMonthRows]
  );

  const selectedTotalPaid = Math.max(0, selectedTotalOriginal - selectedTotalAmount);
  const currentYear = new Date().getFullYear();
  const schoolAddress = [
    school?.address?.street,
    school?.address?.city,
    school?.address?.state,
    school?.address?.pincode,
  ]
    .filter(Boolean)
    .join(", ");
  const schoolContact = [school?.phone, school?.email].filter(Boolean).join(" | ");
  const orderedSelectedMonths = monthRows
    .map((row) => row.month)
    .filter((month) => selectedMonths.includes(month));

  const handleGenerateSlip = () => {
    if (!selectedStudent) {
      toast.error("Please select a student first");
      return;
    }
    if (selectedMonths.length === 0) {
      toast.error("Please select at least one month");
      return;
    }
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      window.print();
    }, 500);
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleMonthSelection = (monthName: string) => {
    setSelectedMonths((prev) =>
      prev.includes(monthName)
        ? prev.filter((m) => m !== monthName)
        : [...prev, monthName]
    );
  };

  return (
    <div className="space-y-6">
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm;
          }

          body * {
            visibility: hidden !important;
          }
          #fee-slip,
          #fee-slip * {
            visibility: visible !important;
          }
          #fee-slip {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            page-break-inside: avoid !important;
            padding: 10px !important;
            font-size: 11px !important;
            line-height: 1.25 !important;
          }

          #fee-slip h1 {
            font-size: 18px !important;
            line-height: 1.2 !important;
          }

          #fee-slip h2 {
            font-size: 18px !important;
          }

          #fee-slip h3 {
            font-size: 14px !important;
            margin-bottom: 8px !important;
          }

          #fee-slip .print-compact {
            margin-bottom: 8px !important;
            padding-top: 8px !important;
            padding-bottom: 8px !important;
          }

          #fee-slip .print-compact-box {
            margin-bottom: 8px !important;
            padding: 10px !important;
          }

          #fee-slip .print-logo {
            width: 44px !important;
            height: 44px !important;
          }

          #fee-slip .print-tight {
            margin-top: 4px !important;
            margin-bottom: 4px !important;
          }

          #fee-slip .print-hide {
            display: none !important;
          }
        }
      `}</style>
      <div>
        <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">Fee Demand Slip</h1>
        <p className="text-muted-foreground mt-1">Generate and print fee demand slips for students</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Search and Filter Section */}
        <Card className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Select Student
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or admission number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 rounded-xl"
              />
            </div>

            {students.length > 0 && !selectedStudent && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {students.map((student: Student) => (
                  <div
                    key={student._id}
                    onClick={() => {
                      setSelectedStudent(student);
                      setSelectedMonths([]);
                    }}
                    className="p-3 rounded-lg border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm">{student.firstName} {student.lastName}</p>
                        <p className="text-xs text-muted-foreground">
                          {student.admissionNumber} • Class {student.class}-{student.section}
                        </p>
                      </div>
                      {student.dueAmount > 0 && (
                        <div className="text-right">
                          <p className="text-sm font-bold text-orange-600">₹{student.dueAmount.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Due</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!selectedStudent && isLoading && (
              <p className="text-sm text-muted-foreground">Loading students...</p>
            )}

            {!selectedStudent && !isLoading && students.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {searchQuery.trim()
                  ? "No student found. Try another name or admission number."
                  : "No students available to select."}
              </p>
            )}

            {selectedStudent && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                      <User className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-semibold">{selectedStudent.firstName} {selectedStudent.lastName}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedStudent.admissionNumber} • Class {selectedStudent.class}-{selectedStudent.section}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Father: {selectedStudent.fatherName}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSelectedStudent(null);
                      setSelectedMonths([]);
                    }}
                  >
                    Change
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Month and Message Section */}
        <Card className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Slip Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label>Select Month(s)</Label>
                {selectedStudent && (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => setSelectedMonths(dueMonthRows.map((row) => row.month))}
                    >
                      Select all due
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => setSelectedMonths([])}
                    >
                      Clear
                    </Button>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-[hsl(var(--border))] p-3 bg-[hsl(var(--muted))]/20">
                {!selectedStudent ? (
                  <p className="text-sm text-muted-foreground">Select a student to see month-wise fee cards.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {monthRows.map((row) => {
                      const isSelected = selectedMonths.includes(row.month);
                      const isPaid = Number(row.remainingAmount || 0) <= 0;
                      return (
                        <button
                          key={row.month}
                          type="button"
                          onClick={() => toggleMonthSelection(row.month)}
                          className={[
                            "rounded-xl border p-2 text-left transition-all",
                            isSelected
                              ? "border-indigo-500 bg-indigo-50 shadow-sm"
                              : "border-[hsl(var(--border))] bg-white hover:border-indigo-300 hover:bg-indigo-50/40",
                            isPaid ? "opacity-70" : "",
                          ].join(" ")}
                        >
                          <p className="text-sm font-semibold text-foreground">{row.month}</p>
                          <p className={`text-xs ${isPaid ? "text-green-700" : "text-orange-700"}`}>
                            {isPaid ? "Paid" : `Due ${formatCurrency(row.remainingAmount)}`}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Custom Message (Optional)</Label>
              <textarea
                id="message"
                value={customMessage}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCustomMessage(e.target.value)}
                placeholder="Enter a message to display on the slip..."
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>

            {selectedStudent && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-sky-50 border border-indigo-100">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <p className="font-semibold text-sm text-indigo-900">Fee Summary</p>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Yearly Fee:</span>
                    <span className="font-medium">{formatCurrency(selectedStudent.totalYearlyFee || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Paid Amount:</span>
                    <span className="font-medium text-green-600">{formatCurrency(selectedStudent.paidAmount || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-indigo-200">
                    <span className="font-semibold">Total Due:</span>
                    <span className="font-bold text-orange-600">{formatCurrency(selectedStudent.dueAmount || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-indigo-200">
                    <span className="font-semibold">Selected Months:</span>
                    <span className="font-bold text-indigo-700">{selectedMonths.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold">Selected Amount:</span>
                    <span className="font-bold text-indigo-700">{formatCurrency(selectedTotalAmount)}</span>
                  </div>
                </div>
                {feeSummaryLoading && <p className="text-xs text-muted-foreground mt-2">Refreshing monthly breakdown...</p>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Fee Demand Slip Preview */}
      {selectedStudent && selectedMonths.length > 0 && (
        <Card className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Fee Demand Slip Preview
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  onClick={handlePrint}
                  variant="outline"
                  className="gap-2"
                >
                  <Printer className="h-4 w-4" />
                  Print
                </Button>
                <Button
                  onClick={handleGenerateSlip}
                  disabled={isGenerating}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  {isGenerating ? "Generating..." : "Download PDF"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div id="fee-slip" className="border border-slate-200 rounded-2xl p-6 bg-white max-w-3xl mx-auto shadow-sm">
              {/* School Header */}
              <div className="mb-4 pb-3 border-b-2 border-indigo-200 print-compact">
                <div className="flex items-start gap-4">
                  <div className="print-logo h-12 w-12 rounded-xl border border-indigo-100 bg-indigo-50 flex items-center justify-center overflow-hidden shrink-0">
                    {school?.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={school.logo} alt="School logo" className="h-full w-full object-contain" />
                    ) : (
                      <span className="text-indigo-700 text-lg font-extrabold">
                        {String(school?.schoolName || "S").charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 text-center pr-12">
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                      {school?.schoolName || "School Name"}
                    </h1>
                    <p className="text-xs text-gray-600 mt-1">{schoolAddress || "School Address"}</p>
                    <p className="text-xs text-gray-600 mt-1">{schoolContact || "Phone | Email"}</p>
                  </div>
                </div>
              </div>

              {/* Slip Title */}
              <div className="text-center mb-4 bg-slate-50 rounded-xl p-3 border border-slate-200 print-compact-box">
                <h2 className="text-2xl font-bold text-indigo-600 uppercase tracking-wider">Fee Demand Slip</h2>
                <p className="text-xs text-gray-600 mt-1 font-medium">
                  For{" "}
                  <span className="text-indigo-700">
                    {selectedMonths.length} month{selectedMonths.length > 1 ? "s" : ""}
                  </span>{" "}
                  in {currentYear}
                </p>
                <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                  {orderedSelectedMonths.map((month) => (
                    <Badge key={month} variant="secondary" className="px-2.5 py-0.5 rounded-full text-[11px]">
                      {month}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Student Details */}
              <div className="bg-white border-2 border-indigo-100 rounded-xl p-4 mb-4 shadow-sm print-compact-box">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-base">
                  <User className="h-5 w-5 text-indigo-600" />
                  Student Details
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-xs uppercase tracking-wider mb-1">Student Name</span>
                    <span className="font-semibold text-gray-900">{selectedStudent.firstName} {selectedStudent.lastName}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-xs uppercase tracking-wider mb-1">Admission Number</span>
                    <span className="font-semibold text-gray-900">{selectedStudent.admissionNumber}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-xs uppercase tracking-wider mb-1">Class & Section</span>
                    <span className="font-semibold text-gray-900">{selectedStudent.class} - {selectedStudent.section}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-xs uppercase tracking-wider mb-1">Father's Name</span>
                    <span className="font-semibold text-gray-900">{selectedStudent.fatherName}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-xs uppercase tracking-wider mb-1">Contact Number</span>
                    <span className="font-semibold text-gray-900">{selectedStudent.phone}</span>
                  </div>
                </div>
              </div>

              {/* Fee Details */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 shadow-sm print-compact-box">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-base">
                  <IndianRupee className="h-5 w-5 text-indigo-600" />
                  Fee Breakdown (Selected Months)
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1.5 border-b border-indigo-200">
                    <span className="text-gray-700 font-medium text-xs">Selected Month Fee (Original)</span>
                    <span className="font-bold text-gray-900 text-sm">{formatCurrency(selectedTotalOriginal)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-indigo-200">
                    <span className="text-gray-700 font-medium text-xs">Already Paid in Selected Months</span>
                    <span className="font-bold text-green-600 text-sm">{formatCurrency(selectedTotalPaid)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 bg-white rounded-lg px-3 mt-1">
                    <span className="font-bold text-gray-900 text-sm">Amount Payable Now</span>
                    <span className="font-bold text-lg text-orange-600">{formatCurrency(selectedTotalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Custom Message */}
              {customMessage && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl p-4 mb-4 shadow-sm print-compact-box">
                  <h3 className="font-bold text-amber-900 mb-2 flex items-center gap-2 text-base">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                    Important Notice
                  </h3>
                  <p className="text-xs text-amber-800 leading-relaxed">{customMessage}</p>
                </div>
              )}

              {/* Terms and Conditions */}
              <div className="bg-gray-50 rounded-xl p-3 mb-4 text-[11px] text-gray-600 print-compact-box">
                <h4 className="font-bold text-gray-900 mb-2">Terms & Conditions:</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Fees must be paid by the due date to avoid late fee charges.</li>
                  <li>Fee receipt will be issued upon payment.</li>
                  <li>Contact school office for any fee-related queries.</li>
                </ul>
              </div>

              {/* Footer */}
              <div className="mt-3 pt-3 border-t-2 border-gray-200 print-compact">
                <div className="grid grid-cols-2 gap-6 text-xs">
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Issue Date</p>
                    <p className="font-semibold text-gray-900">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Authorized Signature</p>
                    <div className="mt-2 border-b-2 border-gray-400 w-40 ml-auto"></div>
                    <p className="text-xs text-gray-500 mt-1">Accounts Department</p>
                  </div>
                </div>
              </div>

              {/* Footer Note */}
              <div className="text-center mt-3 pt-2 border-t border-gray-200 print-tight">
                <p className="text-[10px] text-gray-500">This is a computer-generated fee demand slip. No signature required.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
