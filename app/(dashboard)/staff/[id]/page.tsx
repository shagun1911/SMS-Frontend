"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, User } from "lucide-react";
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

  if (!staffId) return null;

  if (isLoading || !staff) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => router.push("/staff")}
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to staff directory
      </button>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 border border-gray-200">
              <AvatarImage src={staff.photo} />
              <AvatarFallback className="bg-indigo-100 text-indigo-600 font-semibold">
                {staff.name?.charAt(0) ?? "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{staff.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                <Badge variant="secondary" className="font-medium">
                  {staff.role?.replace("_", " ")}
                </Badge>
                {staff.email && <span>{staff.email}</span>}
                {staff.phone && <span>· {staff.phone}</span>}
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => router.push(`/staff/${staffId}/profile`)}
            >
              <User className="h-4 w-4" />
              View Profile
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-gray-100 p-1 rounded-xl">
          <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Overview
          </TabsTrigger>
          <TabsTrigger value="structure" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Salary Structure
          </TabsTrigger>
          <TabsTrigger value="payments" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Payment History
          </TabsTrigger>
          <TabsTrigger value="otherPayments" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Other Payments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <SalaryPaymentsTab staffId={staffId} compact />
        </TabsContent>
        <TabsContent value="structure">
          <SalaryStructureTab staffId={staffId} />
        </TabsContent>
        <TabsContent value="payments">
          <SalaryPaymentsTab staffId={staffId} />
        </TabsContent>
        <TabsContent value="otherPayments">
          <OtherPaymentsTab staffId={staffId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
