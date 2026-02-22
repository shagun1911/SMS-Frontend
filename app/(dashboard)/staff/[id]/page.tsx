"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import api from "@/lib/api";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ArrowLeft, User, Wallet, IndianRupee, TrendingUp, TrendingDown } from "lucide-react";
import SalaryStructureTab from "@/components/staff/salary-structure-tab";
import SalaryPaymentsTab from "@/components/staff/salary-payments-tab";
import OtherPaymentsTab from "@/components/staff/other-payments-tab";

export default function StaffDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const staffId = params?.id;

  const { data: staff, isLoading } = useQuery({
    queryKey: ["staff-detail", staffId],
    queryFn: async () => {
      const res = await api.get(`/users/${staffId}`);
      return res.data.data;
    },
    enabled: !!staffId,
  });

  const { data: structure } = useQuery({
    queryKey: ["salary-structure", staffId],
    queryFn: async () => {
      const res = await api.get(`/salary-structure/staff/${staffId}`);
      return res.data.data;
    },
    enabled: !!staffId,
  });

  if (!staffId) return null;

  if (isLoading || !staff) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const base = structure?.baseSalary ?? staff.baseSalary ?? 0;
  const allowances = (structure?.allowances || []).reduce((s: number, a: any) => s + a.amount, 0);
  const deductions = (structure?.deductions || []).reduce((s: number, d: any) => s + d.amount, 0);
  const net = base + allowances - deductions;
  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  return (
    <div className="space-y-6 p-1">
      {/* Back link */}
      <button
        type="button"
        onClick={() => router.push("/staff")}
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to staff directory
      </button>

      {/* Staff header */}
      <Card className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 border-2 border-primary/10">
              <AvatarImage src={staff.photo} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                {staff.name?.charAt(0) ?? "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-bold tracking-tight">{staff.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary" className="font-medium capitalize">
                  {(staff.role || "").replace(/_/g, " ")}
                </Badge>
                {staff.email && <span>{staff.email}</span>}
                {staff.phone && <span>· {staff.phone}</span>}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/payroll">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Wallet className="h-4 w-4" /> Payroll
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => router.push(`/staff/${staffId}/profile`)}
            >
              <User className="h-4 w-4" /> Edit Profile
            </Button>
          </div>
        </div>
      </Card>

      {/* Quick salary stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <MiniStat icon={<IndianRupee className="h-4 w-4 text-blue-500" />} label="Base Salary" value={fmt(base)} />
        <MiniStat icon={<TrendingUp className="h-4 w-4 text-emerald-500" />} label="Allowances" value={`+${fmt(allowances)}`} />
        <MiniStat icon={<TrendingDown className="h-4 w-4 text-rose-500" />} label="Deductions" value={`-${fmt(deductions)}`} />
        <MiniStat icon={<Wallet className="h-4 w-4 text-primary" />} label="Net Salary" value={fmt(net)} highlight />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="payments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="payments">Payment History</TabsTrigger>
          <TabsTrigger value="structure">Salary Structure</TabsTrigger>
          <TabsTrigger value="other">Bonuses & Adjustments</TabsTrigger>
        </TabsList>

        <TabsContent value="payments">
          <SalaryPaymentsTab staffId={staffId} />
        </TabsContent>
        <TabsContent value="structure">
          <SalaryStructureTab staffId={staffId} />
        </TabsContent>
        <TabsContent value="other">
          <OtherPaymentsTab staffId={staffId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MiniStat({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <Card className={`flex items-center gap-3 px-4 py-3 ${highlight ? "border-primary/20 bg-primary/5" : ""}`}>
      <div className="rounded-lg bg-muted p-2">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-sm font-semibold tabular-nums truncate ${highlight ? "text-primary" : ""}`}>{value}</p>
      </div>
    </Card>
  );
}
