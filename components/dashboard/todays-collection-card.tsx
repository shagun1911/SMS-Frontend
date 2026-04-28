"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IndianRupee } from "lucide-react";

interface TodayCollectionData {
  total: number;
  byPaymentMode: { mode: string; amount: number }[];
  transactionCount: number;
}

const paymentModeLabels: Record<string, string> = {
  cash: "Cash",
  upi: "QR/UPI",
  online: "Online",
  bank: "Bank",
  cheque: "Cheque",
  card: "Card",
  other: "Other",
};

export function TodaysCollectionCard() {
  const { data: collection, isLoading } = useQuery({
    queryKey: ["todays-collection"],
    queryFn: async () => {
      const res = await api.get("/fees/today-collection");
      return res.data.data as TodayCollectionData;
    },
    refetchInterval: 60000, // Refetch every minute
  });

  if (isLoading) {
    return (
      <Card className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-[hsl(var(--muted-foreground))]">
            <IndianRupee className="h-4 w-4 text-primary" />
            Today's Collection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-muted rounded" />
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const total = collection?.total || 0;
  const byPaymentMode = collection?.byPaymentMode || [];
  const transactionCount = collection?.transactionCount || 0;

  return (
    <Card className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-[hsl(var(--muted-foreground))]">
          <IndianRupee className="h-4 w-4 text-primary" />
          Today's Collection
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[hsl(var(--foreground))]">
              ₹{(total / 1000).toFixed(1)}K
            </span>
            <span className="text-xs text-muted-foreground">
              {transactionCount} transaction{transactionCount !== 1 ? 's' : ''}
            </span>
          </div>

          {byPaymentMode.length > 0 ? (
            <div className="space-y-2">
              {byPaymentMode.map((item) => (
                <div
                  key={item.mode}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground">
                    {paymentModeLabels[item.mode.toLowerCase()] || item.mode}
                  </span>
                  <span className="font-medium">₹{(item.amount / 1000).toFixed(1)}K</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No collections today</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
