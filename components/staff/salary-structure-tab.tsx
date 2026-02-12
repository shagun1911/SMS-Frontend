"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

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

  const [draftBase, setDraftBase] = useState<number | undefined>(undefined);
  const [draftAllowances, setDraftAllowances] = useState<Adjustment[]>([]);
  const [draftDeductions, setDraftDeductions] = useState<Adjustment[]>([]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        baseSalary: draftBase ?? data?.baseSalary ?? 0,
        allowances: draftAllowances,
        deductions: draftDeductions,
      };
      await api.put(`/salary-structure/staff/${staffId}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salary-structure", staffId] });
      setIsEditing(false);
    },
  });

  const structure = data;

  const effectiveBase = draftBase ?? structure?.baseSalary ?? 0;
  const effectiveAllowances = isEditing ? draftAllowances : structure?.allowances || [];
  const effectiveDeductions = isEditing ? draftDeductions : structure?.deductions || [];

  const allowanceTotal = effectiveAllowances.reduce((sum: number, a: Adjustment) => sum + a.amount, 0);
  const deductionTotal = effectiveDeductions.reduce((sum: number, d: Adjustment) => sum + d.amount, 0);
  const net = effectiveBase + allowanceTotal - deductionTotal;

  const startEditing = () => {
    setDraftBase(structure?.baseSalary ?? 0);
    setDraftAllowances(structure?.allowances || []);
    setDraftDeductions(structure?.deductions || []);
    setIsEditing(true);
  };

  if (isLoading && !structure) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <Card className="border border-gray-200 bg-white p-6 space-y-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Salary structure</h2>
          <p className="mt-1 text-xs text-gray-500">
            Define base salary, allowances and deductions for this staff member.
          </p>
        </div>
        {!isEditing ? (
          <Button size="sm" className="text-xs" onClick={startEditing}>
            Edit Salary Structure
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={() => setIsEditing(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="text-xs"
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
            >
              {mutation.isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
              Save
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-2">
          <Label className="text-xs text-gray-500">Base salary (monthly)</Label>
          <Input
            type="number"
            value={effectiveBase}
            readOnly={!isEditing}
            onChange={(e) => setDraftBase(Number(e.target.value) || 0)}
            className="bg-white border-gray-200 text-sm text-gray-900"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-gray-500">Total allowances</Label>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
            ₹{allowanceTotal}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-gray-500">Total deductions</Label>
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
            ₹{deductionTotal}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-gray-500">Allowances</Label>
            {isEditing && (
              <button
                type="button"
                className="flex items-center gap-1 text-xs font-medium text-emerald-400"
                onClick={() => setDraftAllowances((prev) => [...prev, { title: "", amount: 0 }])}
              >
                <Plus className="h-3 w-3" /> Add
              </button>
            )}
          </div>
          <div className="space-y-2">
            {effectiveAllowances.length === 0 && !isEditing && (
              <p className="text-xs text-gray-500">No allowances configured.</p>
            )}
            {(isEditing ? draftAllowances : effectiveAllowances).map((a: Adjustment, idx: number) => (
              <div key={idx} className="flex gap-2">
                <Input
                  placeholder="Title"
                  value={a.title}
                  readOnly={!isEditing}
                  onChange={(e) =>
                    setDraftAllowances((prev) =>
                      prev.map((item, i) =>
                        i === idx ? { ...item, title: e.target.value } : item
                      )
                    )
                  }
                  className="h-9 text-xs"
                />
                <Input
                  type="number"
                  placeholder="Amount"
                  value={a.amount}
                  readOnly={!isEditing}
                  onChange={(e) =>
                    setDraftAllowances((prev) =>
                      prev.map((item, i) =>
                        i === idx ? { ...item, amount: Number(e.target.value) || 0 } : item
                      )
                    )
                  }
                  className="h-9 w-24 text-xs"
                />
                {isEditing && (
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-md border border-transparent p-1 text-zinc-500 hover:text-rose-500"
                    onClick={() =>
                      setDraftAllowances((prev) => prev.filter((_, i) => i !== idx))
                    }
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-gray-500">Deductions</Label>
            {isEditing && (
              <button
                type="button"
                className="flex items-center gap-1 text-xs font-medium text-rose-400"
                onClick={() => setDraftDeductions((prev) => [...prev, { title: "", amount: 0 }])}
              >
                <Plus className="h-3 w-3" /> Add
              </button>
            )}
          </div>
          <div className="space-y-2">
            {effectiveDeductions.length === 0 && !isEditing && (
              <p className="text-xs text-gray-500">No deductions configured.</p>
            )}
            {(isEditing ? draftDeductions : effectiveDeductions).map((d: Adjustment, idx: number) => (
              <div key={idx} className="flex gap-2">
                <Input
                  placeholder="Title"
                  value={d.title}
                  readOnly={!isEditing}
                  onChange={(e) =>
                    setDraftDeductions((prev) =>
                      prev.map((item, i) =>
                        i === idx ? { ...item, title: e.target.value } : item
                      )
                    )
                  }
                  className="h-9 text-xs"
                />
                <Input
                  type="number"
                  placeholder="Amount"
                  value={d.amount}
                  readOnly={!isEditing}
                  onChange={(e) =>
                    setDraftDeductions((prev) =>
                      prev.map((item, i) =>
                        i === idx ? { ...item, amount: Number(e.target.value) || 0 } : item
                      )
                    )
                  }
                  className="h-9 w-24 text-xs"
                />
                {isEditing && (
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-md border border-transparent p-1 text-zinc-500 hover:text-rose-500"
                    onClick={() =>
                      setDraftDeductions((prev) => prev.filter((_, i) => i !== idx))
                    }
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-600">
        <span>Estimated net monthly salary</span>
        <span className="text-sm font-semibold text-emerald-600">₹{net}</span>
      </div>
    </Card>
  );
}

