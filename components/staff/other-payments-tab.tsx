"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Gift, MinusCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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
      toast.success("Payment added");
      reset();
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed to add"),
  });

  const reset = () => { setIsAdding(false); setTitle(""); setAmount(""); setType("bonus"); };
  const fmt = (n: number) => `₹${n?.toLocaleString("en-IN")}`;

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  const payments = data || [];
  const bonusTotal = payments.filter((p: any) => p.type === "bonus").reduce((s: number, p: any) => s + p.amount, 0);
  const adjustTotal = payments.filter((p: any) => p.type === "adjustment").reduce((s: number, p: any) => s + p.amount, 0);

  return (
    <Card className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Bonuses & Adjustments</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            One-time payments outside the regular salary structure. Included when generating monthly payroll.
          </p>
        </div>
        {!isAdding && (
          <Button size="sm" className="gap-1.5" onClick={() => setIsAdding(true)}>
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        )}
      </div>

      {/* Add form */}
      {isAdding && (
        <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Diwali bonus" className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Amount</Label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))} className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Type</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setType("bonus")}
                  className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                    type === "bonus"
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : "border-border text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  Bonus
                </button>
                <button
                  type="button"
                  onClick={() => setType("adjustment")}
                  className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                    type === "adjustment"
                      ? "border-rose-300 bg-rose-50 text-rose-700"
                      : "border-border text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  Deduction
                </button>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={reset} disabled={mutation.isPending}>Cancel</Button>
            <Button size="sm" onClick={() => mutation.mutate()} disabled={mutation.isPending || !title || !amount}>
              {mutation.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Save
            </Button>
          </div>
        </div>
      )}

      {/* Summary pills */}
      {payments.length > 0 && (
        <div className="flex gap-3">
          <div className="rounded-lg border bg-emerald-50/60 border-emerald-200 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Total bonuses: </span>
            <span className="font-semibold text-emerald-700">{fmt(bonusTotal)}</span>
          </div>
          <div className="rounded-lg border bg-rose-50/60 border-rose-200 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Total adjustments: </span>
            <span className="font-semibold text-rose-700">{fmt(adjustTotal)}</span>
          </div>
        </div>
      )}

      {/* Table */}
      {payments.length === 0 ? (
        <div className="text-center py-8">
          <Gift className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No bonuses or adjustments recorded yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <th className="pb-2.5 pr-4">Title</th>
                <th className="pb-2.5 pr-4 text-right">Amount</th>
                <th className="pb-2.5 pr-4 text-center">Type</th>
                <th className="pb-2.5">Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p: any) => (
                <tr key={p._id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="py-3 pr-4 font-medium">{p.title}</td>
                  <td className={`py-3 pr-4 text-right font-semibold tabular-nums ${p.type === "bonus" ? "text-emerald-700" : "text-rose-600"}`}>
                    {p.type === "bonus" ? "+" : "-"}{fmt(p.amount)}
                  </td>
                  <td className="py-3 pr-4 text-center">
                    {p.type === "bonus" ? (
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">Bonus</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 text-xs">Adjustment</Badge>
                    )}
                  </td>
                  <td className="py-3 text-muted-foreground">
                    {p.date
                      ? new Date(p.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
