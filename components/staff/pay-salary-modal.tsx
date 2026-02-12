"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

const PAYMENT_MODES = [
  { value: "cash", label: "Cash" },
  { value: "cheque", label: "Cheque" },
  { value: "online", label: "Online" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
] as const;

interface SalaryRecord {
  _id: string;
  month: string;
  year: number;
  basicSalary: number;
  allowances: { title: string; amount: number }[];
  deductions: { title: string; amount: number }[];
  totalSalary: number;
  netSalary: number;
}

interface PaySalaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: SalaryRecord | null;
  onSuccess: () => void;
}

export function PaySalaryModal({
  isOpen,
  onClose,
  record,
  onSuccess,
}: PaySalaryModalProps) {
  const [remarks, setRemarks] = useState("");
  const [mode, setMode] = useState<string>("cash");

  const payMutation = useMutation({
    mutationFn: async () => {
      if (!record) return;
      await api.post(`/salaries/${record._id}/pay`, {
        amount: record.netSalary,
        mode,
        remarks: remarks || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Salary payment recorded successfully");
      setRemarks("");
      setMode("cash");
      onSuccess();
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message ?? "Failed to process payment");
    },
  });

  if (!record) return null;

  const allowanceTotal = record.allowances?.reduce((s, a) => s + a.amount, 0) ?? 0;
  const deductionTotal = record.deductions?.reduce((s, d) => s + d.amount, 0) ?? 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Pay salary – ${record.month} ${record.year}`}
      description="Confirm payment details. You can only set remarks and payment mode."
      className="max-w-md bg-white border border-gray-200 rounded-2xl shadow-xl text-gray-900"
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Base salary</span>
            <span>₹{record.basicSalary}</span>
          </div>
          {record.allowances?.length > 0 && (
            <>
              <div className="text-xs font-medium text-gray-500 mt-2">Allowances</div>
              {record.allowances.map((a, i) => (
                <div key={i} className="flex justify-between text-gray-600 pl-2">
                  <span>{a.title}</span>
                  <span>₹{a.amount}</span>
                </div>
              ))}
              <div className="flex justify-between text-gray-600 border-t border-gray-200 pt-1">
                <span>Total allowances</span>
                <span>₹{allowanceTotal}</span>
              </div>
            </>
          )}
          {record.deductions?.length > 0 && (
            <>
              <div className="text-xs font-medium text-gray-500 mt-2">Deductions</div>
              {record.deductions.map((d, i) => (
                <div key={i} className="flex justify-between text-gray-600 pl-2">
                  <span>{d.title}</span>
                  <span>₹{d.amount}</span>
                </div>
              ))}
              <div className="flex justify-between text-gray-600 border-t border-gray-200 pt-1">
                <span>Total deductions</span>
                <span>₹{deductionTotal}</span>
              </div>
            </>
          )}
          <div className="flex justify-between font-semibold text-gray-900 pt-2 border-t border-gray-200">
            <span>Net amount</span>
            <span className="text-emerald-600">₹{record.netSalary}</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-gray-500">Payment mode</Label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="w-full h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {PAYMENT_MODES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-gray-500">Remarks (optional)</Label>
          <Input
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="e.g. Salary for February 2025"
            className="h-10 rounded-lg border-gray-200 bg-white text-sm"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1 rounded-xl border-gray-200"
            onClick={onClose}
            disabled={payMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-500"
            onClick={() => payMutation.mutate()}
            disabled={payMutation.isPending}
          >
            {payMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              `Pay ₹${record.netSalary}`
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
