"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2 } from "lucide-react";
import { PaySalaryModal } from "./pay-salary-modal";

interface SalaryPaymentsTabProps {
  staffId: string;
  compact?: boolean;
}

export default function SalaryPaymentsTab({ staffId, compact }: SalaryPaymentsTabProps) {
  const queryClient = useQueryClient();
  const [payModalRecord, setPayModalRecord] = useState<any | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["salary-history", staffId],
    queryFn: async () => {
      const res = await api.get(`/salaries/staff/${staffId}/history`);
      return res.data.data || [];
    },
  });

  const handlePaySuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["salary-history", staffId] });
  };

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
      </div>
    );
  }

  const records = data || [];

  if (records.length === 0) {
    return (
      <Card className="border border-gray-200 bg-white p-6 text-sm text-gray-500 shadow-sm">
        No salary records yet for this staff member.
      </Card>
    );
  }

  const visibleRecords = compact ? records.slice(0, 3) : records;

  return (
    <Card className="border border-gray-200 bg-white p-6 space-y-4 shadow-sm">
      {!compact && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Payment history</h2>
            <p className="mt-1 text-xs text-gray-500">
              Monthly salary records generated for this staff member.
            </p>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full text-xs text-left text-gray-600">
          <thead className="border-b border-gray-200 text-[11px] font-medium uppercase tracking-wide text-gray-500">
            <tr>
              <th className="pb-2 pr-4">Month</th>
              <th className="pb-2 pr-4">Net Amount</th>
              <th className="pb-2 pr-4">Status</th>
              <th className="pb-2 pr-4">Payment Date</th>
              {!compact && <th className="pb-2" />}
            </tr>
          </thead>
          <tbody>
            {visibleRecords.map((r: any) => (
              <tr key={r._id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                <td className="py-2 pr-4 text-xs">
                  {r.month} {r.year}
                </td>
                <td className="py-2 pr-4 text-xs font-semibold text-emerald-400">
                  ₹{r.netSalary}
                </td>
                <td className="py-2 pr-4 text-xs">
                  <span
                    className={
                      r.status === "paid"
                        ? "inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-300"
                        : "inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-1 text-[11px] font-medium text-amber-300"
                    }
                  >
                    {r.status === "paid" && <CheckCircle2 className="h-3 w-3" />}
                    {r.status.toUpperCase()}
                  </span>
                </td>
                                                <td className="py-2 pr-4 text-xs text-gray-500">
                  {r.paymentDate
                    ? new Date(r.paymentDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "-"}
                </td>
                {!compact && (
                  <td className="py-2 text-right">
                    {r.status !== "paid" && (
                      <Button
                        size="xs"
                        className="h-7 rounded-lg bg-indigo-600 text-[11px] font-medium hover:bg-indigo-500"
                        onClick={() => setPayModalRecord(r)}
                      >
                        Pay
                      </Button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PaySalaryModal
        isOpen={!!payModalRecord}
        onClose={() => setPayModalRecord(null)}
        record={payModalRecord}
        onSuccess={handlePaySuccess}
      />
    </Card>
  );
}

