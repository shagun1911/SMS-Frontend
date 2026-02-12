import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type LucideIcon } from "lucide-react";

interface StatCardProps {
    title: string;
    value: string | number;
    description: string;
    icon: LucideIcon;
    trend?: "up" | "down" | "neutral";
}

export function StatCard({
    title,
    value,
    description,
    icon: Icon,
    trend,
}: StatCardProps) {
    return (
        <Card className="border border-gray-200 bg-white shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">{title}</CardTitle>
                <Icon className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-gray-900">{value}</div>
                <p className="text-xs text-gray-500 mt-1">
                    {description}
                </p>
            </CardContent>
        </Card>
    );
}
