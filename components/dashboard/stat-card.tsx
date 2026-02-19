import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type LucideIcon } from "lucide-react";

const variants = {
  emerald: {
    bg: "bg-[hsl(var(--primary))]/10",
    icon: "text-[hsl(var(--primary))]",
    border: "border-[hsl(var(--primary))]/20 hover:border-[hsl(var(--primary))]/30",
    gradient: "from-[hsl(var(--primary))]/15 to-transparent",
  },
  violet: {
    bg: "bg-violet-500/10",
    icon: "text-violet-600",
    border: "border-violet-200 hover:border-violet-300",
    gradient: "from-violet-500/20 to-transparent",
  },
  amber: {
    bg: "bg-amber-500/10",
    icon: "text-amber-600",
    border: "border-amber-200 hover:border-amber-300",
    gradient: "from-amber-500/20 to-transparent",
  },
  blue: {
    bg: "bg-blue-500/10",
    icon: "text-blue-600",
    border: "border-blue-200 hover:border-blue-300",
    gradient: "from-blue-500/20 to-transparent",
  },
  rose: {
    bg: "bg-rose-500/10",
    icon: "text-rose-600",
    border: "border-rose-200 hover:border-rose-300",
    gradient: "from-rose-500/20 to-transparent",
  },
} as const;

type VariantKey = keyof typeof variants;

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  animationDelay?: number;
  variant?: VariantKey;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  animationDelay = 0,
  variant = "emerald",
}: StatCardProps) {
  const v = variants[variant];
  return (
    <Card
      className={`relative overflow-hidden animate-fade-in-up rounded-2xl border ${v.border} bg-[hsl(var(--card))] shadow-card transition-smooth hover-lift`}
      style={{ animationDelay: `${animationDelay}ms`, animationFillMode: "both" }}
    >
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${v.gradient} opacity-40 pointer-events-none`} aria-hidden />
      <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-semibold text-[hsl(var(--muted-foreground))]">{title}</CardTitle>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${v.bg} ${v.icon}`}>
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">{value}</div>
        <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{description}</p>
      </CardContent>
    </Card>
  );
}
