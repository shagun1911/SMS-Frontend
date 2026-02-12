"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";

interface CollectFeeModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CollectFeeModal({ open, onOpenChange }: CollectFeeModalProps) {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [amount, setAmount] = useState("");
    const [feeTitle, setFeeTitle] = useState("");
    const [paymentMode, setPaymentMode] = useState("cash");
    const [transactionId, setTransactionId] = useState("");
    const [remarks, setRemarks] = useState("");

    const { data: students } = useQuery({
        queryKey: ["students-search", searchTerm],
        queryFn: async () => {
            const res = await api.get("/students");
            return res.data.data ?? [];
        },
        enabled: open,
    });

    const collectFee = useMutation({
        mutationFn: async (data: any) => {
            const res = await api.post("/fees/collect", data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["fees-list"] });
            queryClient.invalidateQueries({ queryKey: ["fees-stats"] });
            toast.success("Fee collected successfully");
            resetForm();
            onOpenChange(false);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message ?? "Failed to collect fee");
        },
    });

    const resetForm = () => {
        setSearchTerm("");
        setSelectedStudent(null);
        setAmount("");
        setFeeTitle("");
        setPaymentMode("cash");
        setTransactionId("");
        setRemarks("");
    };

    const handleSubmit = () => {
        if (!selectedStudent || !amount || !feeTitle) {
            toast.error("Please fill all required fields");
            return;
        }
        // Generate current month in format: "January 2026"
        const now = new Date();
        const month = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        const payload = {
            studentId: selectedStudent._id,
            amount: Number(amount),
            month: month,
            feeTitle: feeTitle || "Fee",
            mode: paymentMode === "bank_transfer" ? "online" : paymentMode,
            transactionId: transactionId || undefined,
            remarks: remarks || undefined,
        };
        collectFee.mutate(payload);
    };

    const filteredStudents = Array.isArray(students)
        ? students.filter((s: any) =>
              `${s.firstName} ${s.lastName} ${s.admissionNumber}`
                  .toLowerCase()
                  .includes(searchTerm.toLowerCase())
          )
        : [];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Collect Fee</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {!selectedStudent ? (
                        <div className="space-y-3">
                            <Label>Search Student</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input
                                    placeholder="Search by name or admission number..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-2">
                                {filteredStudents.length > 0 ? (
                                    filteredStudents.map((student: any) => (
                                        <div
                                            key={student._id}
                                            className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-100 bg-white p-3 transition-colors hover:bg-indigo-50"
                                            onClick={() => setSelectedStudent(student)}
                                        >
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {student.firstName} {student.lastName}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {student.admissionNumber} • Class {student.class}{" "}
                                                    {student.section}
                                                </p>
                                            </div>
                                            <Badge className="bg-indigo-100 text-indigo-700">
                                                Select
                                            </Badge>
                                        </div>
                                    ))
                                ) : (
                                    <p className="py-8 text-center text-sm text-gray-500">
                                        {searchTerm ? "No students found" : "Start typing to search"}
                                    </p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between rounded-lg border border-indigo-200 bg-indigo-50 p-3">
                                <div>
                                    <p className="font-semibold text-indigo-900">
                                        {selectedStudent.firstName} {selectedStudent.lastName}
                                    </p>
                                    <p className="text-xs text-indigo-700">
                                        {selectedStudent.admissionNumber} • Class{" "}
                                        {selectedStudent.class} {selectedStudent.section}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-indigo-600 hover:bg-indigo-100"
                                    onClick={() => setSelectedStudent(null)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 space-y-2">
                                    <Label>Fee Title</Label>
                                    <Input
                                        placeholder="e.g., Tuition Fee, Exam Fee"
                                        value={feeTitle}
                                        onChange={(e) => setFeeTitle(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Amount (₹)</Label>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Payment Mode</Label>
                                    <select
                                        className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                                        value={paymentMode}
                                        onChange={(e) => setPaymentMode(e.target.value)}
                                    >
                                        <option value="cash">Cash</option>
                                        <option value="card">Card</option>
                                        <option value="upi">UPI</option>
                                        <option value="bank_transfer">Bank Transfer</option>
                                        <option value="cheque">Cheque</option>
                                    </select>
                                </div>
                                {paymentMode !== "cash" && (
                                    <div className="col-span-2 space-y-2">
                                        <Label>Transaction ID</Label>
                                        <Input
                                            placeholder="Enter transaction/reference ID"
                                            value={transactionId}
                                            onChange={(e) => setTransactionId(e.target.value)}
                                        />
                                    </div>
                                )}
                                <div className="col-span-2 space-y-2">
                                    <Label>Remarks (Optional)</Label>
                                    <Input
                                        placeholder="Any additional notes"
                                        value={remarks}
                                        onChange={(e) => setRemarks(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                            resetForm();
                            onOpenChange(false);
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        className="flex-1 bg-indigo-600 hover:bg-indigo-500"
                        onClick={handleSubmit}
                        disabled={!selectedStudent || !amount || !feeTitle || collectFee.isPending}
                    >
                        {collectFee.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            "Collect Fee"
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
