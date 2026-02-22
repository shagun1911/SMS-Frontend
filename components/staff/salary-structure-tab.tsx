"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2, Save, Pencil } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface SalaryStructureTabProps {
  staffId: string;
}

interface Adjustment {
  title: string;
  amount: number;
}

export default function SalaryStructureTab({ staffId }: SalaryStructureTabProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["salary-structure", staffId],
    queryFn: async () => {
      const res = await api.get(`/salary-structure/staff/${staffId}`);
      return res.data.data;
    },
  });

  const [draftBase, setDraftBase] = useState(0);
  const [draftAllowances, setDraftAllowances] = useState<Adjustment[]>([]);
  const [draftDeductions, setDraftDeductions] = useState<Adjustment[]>([]);

  const mutation = useMutation({
    mutationFn: async () => {
      await api.put(`/salary-structure/staff/${staffId}`, {
        baseSalary: draftBase,
        allowances: draftAllowances,
        deductions: draftDeductions,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salary-structure", staffId] });
      toast.success("Salary structure updated");
      setIsEditing(false);
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? "Update failed"),
  });

  const structure = data;
  const effectiveBase = isEditing ? draftBase : (structure?.baseSalary ?? 0);
  const effectiveAllowances = isEditing ? draftAllowances : (structure?.allowances || []);
  const effectiveDeductions = isEditing ? draftDeductions : (structure?.deductions || []);
  const allowanceTotal = effectiveAllowances.reduce((s: number, a: Adjustment) => s + a.amount, 0);
  const deductionTotal = effectiveDeductions.reduce((s: number, d: Adjustment) => s + d.amount, 0);
  const gross = effectiveBase + allowanceTotal;
  const net = gross - deductionTotal;
  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  const startEditing = () => {
    setDraftBase(structure?.baseSalary ?? 0);
    setDraftAllowances([...(structure?.allowances || [])]);
    setDraftDeductions([...(structure?.deductions || [])]);
    setIsEditing(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Salary Structure</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Base salary, allowances and deductions used when generating monthly payroll.
          </p>
        </div>
        {!isEditing ? (
          <Button size="sm" variant="outline" className="gap-1.5" onClick={startEditing}>
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button size="sm" className="gap-1.5" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save
            </Button>
          </div>
        )}
      </div>

      {/* Base salary */}
      <div className="space-y-1.5">
        <Label className="text-sm text-muted-foreground">Base salary (monthly)</Label>
        {isEditing ? (
          <Input
            type="number"
            value={draftBase}
            onChange={(e) => setDraftBase(Number(e.target.value) || 0)}
            className="max-w-xs h-10"
          />
        ) : (
          <p className="text-lg font-semibold tabular-nums">{fmt(effectiveBase)}</p>
        )}
      </div>

      {/* Allowances & Deductions side by side */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Allowances */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-emerald-700">Allowances</h3>
            {isEditing && (
              <button
                type="button"
                className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700"
                onClick={() => setDraftAllowances((p) => [...p, { title: "", amount: 0 }])}
              >
                <Plus className="h-3 w-3" /> Add
              </button>
            )}
          </div>
          {effectiveAllowances.length === 0 ? (
            <p className="text-sm text-muted-foreground">No allowances configured.</p>
          ) : (
            <div className="space-y-2">
              {effectiveAllowances.map((a: Adjustment, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <Input placeholder="Title" value={a.title} onChange={(e) => setDraftAllowances((p) => p.map((x, j) => j === i ? { ...x, title: e.target.value } : x))} className="h-9 text-sm flex-1" />
                      <Input type="number" value={a.amount} onChange={(e) => setDraftAllowances((p) => p.map((x, j) => j === i ? { ...x, amount: Number(e.target.value) || 0 } : x))} className="h-9 text-sm w-28" />
                      <button type="button" onClick={() => setDraftAllowances((p) => p.filter((_, j) => j !== i))} className="p-1 text-muted-foreground hover:text-rose-500">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  ) : (
                    <div className="flex justify-between w-full rounded-lg border bg-emerald-50/50 px-3 py-2">
                      <span className="text-sm">{a.title}</span>
                      <span className="text-sm font-medium text-emerald-700 tabular-nums">+{fmt(a.amount)}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {effectiveAllowances.length > 0 && (
            <div className="flex justify-between border-t pt-2 text-sm font-medium">
              <span className="text-muted-foreground">Total allowances</span>
              <span className="text-emerald-700 tabular-nums">+{fmt(allowanceTotal)}</span>
            </div>
          )}
        </div>

        {/* Deductions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-rose-700">Deductions</h3>
            {isEditing && (
              <button
                type="button"
                className="flex items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-700"
                onClick={() => setDraftDeductions((p) => [...p, { title: "", amount: 0 }])}
              >
                <Plus className="h-3 w-3" /> Add
              </button>
            )}
          </div>
          {effectiveDeductions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No deductions configured.</p>
          ) : (
            <div className="space-y-2">
              {effectiveDeductions.map((d: Adjustment, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <Input placeholder="Title" value={d.title} onChange={(e) => setDraftDeductions((p) => p.map((x, j) => j === i ? { ...x, title: e.target.value } : x))} className="h-9 text-sm flex-1" />
                      <Input type="number" value={d.amount} onChange={(e) => setDraftDeductions((p) => p.map((x, j) => j === i ? { ...x, amount: Number(e.target.value) || 0 } : x))} className="h-9 text-sm w-28" />
                      <button type="button" onClick={() => setDraftDeductions((p) => p.filter((_, j) => j !== i))} className="p-1 text-muted-foreground hover:text-rose-500">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  ) : (
                    <div className="flex justify-between w-full rounded-lg border bg-rose-50/50 px-3 py-2">
                      <span className="text-sm">{d.title}</span>
                      <span className="text-sm font-medium text-rose-700 tabular-nums">-{fmt(d.amount)}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {effectiveDeductions.length > 0 && (
            <div className="flex justify-between border-t pt-2 text-sm font-medium">
              <span className="text-muted-foreground">Total deductions</span>
              <span className="text-rose-700 tabular-nums">-{fmt(deductionTotal)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-xl border-2 border-primary/20 bg-primary/5 px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Estimated net monthly salary</p>
          <p className="text-xs text-muted-foreground mt-0.5">Base {fmt(effectiveBase)} + Allowances {fmt(allowanceTotal)} − Deductions {fmt(deductionTotal)}</p>
        </div>
        <p className="text-xl font-bold text-primary tabular-nums">{fmt(net)}</p>
      </div>
    </Card>
  );
}
