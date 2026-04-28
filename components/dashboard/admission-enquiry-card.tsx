"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, ArrowRight } from "lucide-react";

export function AdmissionEnquiryCard() {
  const { data: countData, isLoading } = useQuery({
    queryKey: ["admission-enquiries-count"],
    queryFn: async () => {
      const res = await api.get("/admission-enquiries/count");
      return res.data.data as { count: number };
    },
  });

  const totalEnquiries = countData?.count || 0;

  return (
    <Link href="/admission-enquiry">
      <Card className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-card hover:border-primary/50 transition-colors cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-[hsl(var(--muted-foreground))]">
              <Phone className="h-4 w-4 text-primary" />
              Admission Enquiries
            </CardTitle>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[hsl(var(--foreground))]">
              {isLoading ? "..." : totalEnquiries}
            </span>
            <span className="text-xs text-muted-foreground">
              total enquiries
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
