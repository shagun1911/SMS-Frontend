"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus } from "lucide-react";
import { useState } from "react";

interface OtherPaymentsTabProps {
  staffId: string;
}

export default function OtherPaymentsTab({ staffId }: OtherPaymentsTabProps) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["other-payments", staffId],
    queryFn: async () => {
      const res = await api.get(`/salary-other-payments/staff/${staffId}`);
      return res.data.data || [];
    },
  });

  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [type, setType] = useState<"bonus" | "adjustment">("bonus");
  const [notes, setNotes] = useState("");
  const [dateValue, setDateValue] = useState(() => new Date().toISOString().slice(0, 10));

  const mutation = useMutation({
    mutationFn: async () => {
      if (!amount || !title) return;
      await api.post(`/salary-other-payments/staff/${staffId}`, {
        title,
        amount: Number(amount),
        type,
        date: new Date(dateValue).toISOString(),
        notes: notes || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["other-payments", staffId] });
      setIsAdding(false);
      setTitle("");
      setAmount("");
      setType("bonus");
      setNotes("");
      setDateValue(new Date().toISOString().slice(0, 10));
    },
  });

  if (isLoading && !data) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
      </div>
    );
  }

  const payments = data || [];

  return (
    <Card className="border border-gray-200 bg-white p-6 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Other payments</h2>
          <p className="mt-1 text-xs text-gray-500">
            One-time bonuses or adjustments that sit outside the base structure.
          </p>
        </div>
        {!isAdding ? (
          <Button
            size="sm"
            className="text-xs"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="mr-1 h-3 w-3" />
            Add Other Payment
          </Button>
        ) : null}
      </div>

      {isAdding && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-9 text-xs bg-white border-gray-200"
                placeholder="Diwali bonus"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Amount</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                className="h-9 text-xs bg-white border-gray-200"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Date</Label>
              <Input
                type="date"
                value={dateValue}
                onChange={(e) => setDateValue(e.target.value)}
                className="h-9 text-xs bg-white border-gray-200"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Type</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setType("bonus")}
                  className={`flex-1 rounded-lg border px-3 py-1.5 text-[11px] ${
                    type === "bonus"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-gray-200 text-gray-500"
                  }`}
                >
                  Bonus
                </button>
                <button
                  type="button"
                  onClick={() => setType("adjustment")}
                  className={`flex-1 rounded-lg border px-3 py-1.5 text-[11px] ${
                    type === "adjustment"
                      ? "border-rose-500 bg-rose-50 text-rose-700"
                      : "border-gray-200 text-gray-500"
                  }`}
                >
                  Adjustment
                </button>
              </div>
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs text-gray-500">Notes (optional)</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-9 text-xs bg-white border-gray-200"
                placeholder="Optional notes"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => {
                setIsAdding(false);
                setTitle("");
                setAmount("");
                setType("bonus");
                setNotes("");
              }}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="text-xs"
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || !title || !amount}
            >
              {mutation.isPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
              Save
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        {payments.length === 0 ? (
          <p className="text-xs text-gray-500">No other payments recorded.</p>
        ) : (
          <table className="min-w-full text-xs text-left text-gray-600">
            <thead className="border-b border-gray-200 text-[11px] font-medium uppercase tracking-wide text-gray-500">
              <tr>
                <th className="pb-2 pr-4">Title</th>
                <th className="pb-2 pr-4">Amount</th>
                <th className="pb-2 pr-4">Type</th>
                <th className="pb-2 pr-4">Date</th>
                <th className="pb-2 pr-4">Notes</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p: any) => (
                <tr key={p._id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                  <td className="py-2 pr-4 text-xs">{p.title}</td>
                  <td className="py-2 pr-4 text-xs font-semibold text-emerald-400">
                    ₹{p.amount}
                  </td>
                  <td className="py-2 pr-4 text-xs capitalize text-gray-600">
                    {p.type}
                  </td>
                  <td className="py-2 pr-4 text-xs text-gray-500">
                    {p.date
                      ? new Date(p.date).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "-"}
                  </td>
                  <td className="py-2 pr-4 text-xs text-gray-500 max-w-[120px] truncate" title={p.notes}>
                    {p.notes || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Card>
  );
}

