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

  const mutation = useMutation({
    mutationFn: async () => {
      if (!amount || !title) return;
      await api.post(`/salary-other-payments/staff/${staffId}`, {
        title,
        amount: Number(amount),
        type,
        date: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["other-payments", staffId] });
      setIsAdding(false);
      setTitle("");
      setAmount("");
      setType("bonus");
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
    <Card className="border border-white/5 bg-neutral-900/70 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Other payments</h2>
          <p className="mt-1 text-xs text-zinc-400">
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
        <div className="rounded-xl border border-white/10 bg-neutral-900/80 p-4 space-y-3">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-xs text-zinc-400">Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-9 text-xs bg-neutral-900 border-white/10"
                placeholder="Diwali bonus"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-zinc-400">Amount</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                className="h-9 text-xs bg-neutral-900 border-white/10"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-zinc-400">Type</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setType("bonus")}
                  className={`flex-1 rounded-lg border px-3 py-1.5 text-[11px] ${
                    type === "bonus"
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
                      : "border-white/10 text-zinc-400"
                  }`}
                >
                  Bonus
                </button>
                <button
                  type="button"
                  onClick={() => setType("adjustment")}
                  className={`flex-1 rounded-lg border px-3 py-1.5 text-[11px] ${
                    type === "adjustment"
                      ? "border-rose-500 bg-rose-500/10 text-rose-300"
                      : "border-white/10 text-zinc-400"
                  }`}
                >
                  Adjustment
                </button>
              </div>
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
          <p className="text-xs text-zinc-500">No other payments recorded.</p>
        ) : (
          <table className="min-w-full text-xs text-left text-zinc-300">
            <thead className="border-b border-white/5 text-[11px] uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="pb-2 pr-4">Title</th>
                <th className="pb-2 pr-4">Amount</th>
                <th className="pb-2 pr-4">Type</th>
                <th className="pb-2 pr-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p: any) => (
                <tr key={p._id} className="border-b border-white/5 last:border-0">
                  <td className="py-2 pr-4 text-xs">{p.title}</td>
                  <td className="py-2 pr-4 text-xs font-semibold text-emerald-400">
                    ₹{p.amount}
                  </td>
                  <td className="py-2 pr-4 text-xs capitalize text-zinc-300">
                    {p.type}
                  </td>
                  <td className="py-2 pr-4 text-xs text-zinc-400">
                    {p.date
                      ? new Date(p.date).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "-"}
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

