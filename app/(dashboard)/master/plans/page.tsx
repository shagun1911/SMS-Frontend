"use client";

import {
    Layers,
    Plus,
    CheckCircle2,
    Settings,
    Zap,
    ShieldCheck,
    Crown,
    Edit2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter
} from "@/components/ui/card";

const PLANS = [
    {
        id: "basic",
        name: "Standard Core",
        price: "₹1,999",
        billing: "per month",
        icon: Zap,
        color: "text-zinc-400",
        bgColor: "bg-zinc-400/10",
        features: ["Up to 500 Students", "Staff Management", "Fee Collection", "Basic Reports", "Standard Support"],
        activeTenants: 12
    },
    {
        id: "enterprise",
        name: "Elite Enterprise",
        price: "₹4,999",
        billing: "per month",
        icon: Crown,
        color: "text-yellow-400",
        bgColor: "bg-yellow-400/10",
        features: ["Unlimited Students", "Advanced Analytics", "Transport Tracking", "Exams & Results", "24/7 Priority Support", "White-labeling"],
        activeTenants: 28,
        popular: true
    },
    {
        id: "custom",
        name: "Architect Custom",
        price: "Custom",
        billing: "based on scale",
        icon: ShieldCheck,
        color: "text-blue-400",
        bgColor: "bg-blue-400/10",
        features: ["Global Multi-Campus", "Dedicated Server", "Custom API Integrations", "Advanced Security Audits", "Dedicated Manager"],
        activeTenants: 2
    }
];

export default function PlansManagementPage() {
    return (
        <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                        Ecosystem Economics
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Manage subscription tiers, feature gates, and pricing models for the SSMS network.
                    </p>
                </div>
                <Button className="bg-emerald-600 hover:bg-emerald-500 gap-2 font-bold">
                    <Plus className="h-4 w-4" /> Create New Tier
                </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {PLANS.map((plan) => (
                    <Card key={plan.id} className={`relative border-white/5 bg-neutral-900/50 backdrop-blur-xl flex flex-col ${plan.popular ? 'border-yellow-500/20 shadow-[0_0_30px_rgba(234,179,8,0.05)]' : ''}`}>
                        {plan.popular && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                                Most Adopted
                            </div>
                        )}

                        <CardHeader>
                            <div className={`h-12 w-12 rounded-xl ${plan.bgColor} flex items-center justify-center mb-4`}>
                                <plan.icon className={`h-6 w-6 ${plan.color}`} />
                            </div>
                            <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                            <CardDescription className="flex items-baseline gap-1">
                                <span className="text-3xl font-bold text-white tracking-tight">{plan.price}</span>
                                <span className="text-xs text-zinc-500 font-medium">/{plan.billing}</span>
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="flex-1">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between text-xs font-bold text-zinc-500 uppercase tracking-widest">
                                    <span>Authorized Features</span>
                                    <Settings className="h-3 w-3" />
                                </div>
                                <ul className="space-y-3">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-center gap-3 text-sm text-zinc-400">
                                            <CheckCircle2 className={`h-4 w-4 ${plan.color} shrink-0`} />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </CardContent>

                        <CardFooter className="pt-6 border-t border-white/5 bg-white/[0.01]">
                            <div className="w-full flex items-center justify-between">
                                <div className="text-xs">
                                    <span className="text-white font-bold">{plan.activeTenants}</span>
                                    <span className="text-zinc-500 ml-1">Active Schools</span>
                                </div>
                                <Button variant="outline" size="sm" className="gap-2 border-white/10 hover:bg-white/5">
                                    <Edit2 className="h-3 w-3" /> Edit Tier
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            <Card className="border-emerald-500/20 bg-emerald-500/5 p-6 flex items-start gap-4">
                <Layers className="h-6 w-6 text-emerald-500 shrink-0" />
                <div>
                    <h4 className="font-bold text-emerald-500">Plan Synchronization</h4>
                    <p className="text-sm text-emerald-500/70 mt-1">
                        Pricing changes will take effect at the start of the next billing cycle for existing schools. New schools will be onboarded with the current active rates immediately.
                    </p>
                </div>
            </Card>
        </div>
    );
}
