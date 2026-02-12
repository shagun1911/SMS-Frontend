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
        color: "text-gray-600",
        bgColor: "bg-gray-100",
        features: ["Up to 500 Students", "Staff Management", "Fee Collection", "Basic Reports", "Standard Support"],
        activeTenants: 12
    },
    {
        id: "enterprise",
        name: "Elite Enterprise",
        price: "₹4,999",
        billing: "per month",
        icon: Crown,
        color: "text-amber-600",
        bgColor: "bg-amber-100",
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
        color: "text-indigo-600",
        bgColor: "bg-indigo-100",
        features: ["Global Multi-Campus", "Dedicated Server", "Custom API Integrations", "Advanced Security Audits", "Dedicated Manager"],
        activeTenants: 2
    }
];

export default function PlansManagementPage() {
    return (
        <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                        Ecosystem Economics
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage subscription tiers, feature gates, and pricing models for the SSMS network.
                    </p>
                </div>
                <Button className="bg-indigo-600 hover:bg-indigo-500 gap-2">
                    <Plus className="h-4 w-4" /> Create New Tier
                </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {PLANS.map((plan) => (
                    <Card key={plan.id} className={`relative flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm ${plan.popular ? "border-indigo-300 ring-1 ring-indigo-100" : ""}`}>
                        {plan.popular && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                                Popular
                            </div>
                        )}
                        <CardHeader>
                            <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${plan.bgColor}`}>
                                <plan.icon className={`h-6 w-6 ${plan.color}`} />
                            </div>
                            <CardTitle className="text-xl font-semibold text-gray-900">{plan.name}</CardTitle>
                            <CardDescription className="flex items-baseline gap-1">
                                <span className="text-2xl font-bold text-gray-900">{plan.price}</span>
                                <span className="text-xs text-gray-500">/{plan.billing}</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between text-xs font-medium uppercase text-gray-500">
                                    <span>Features</span>
                                    <Settings className="h-3 w-3" />
                                </div>
                                <ul className="space-y-2">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-center gap-3 text-sm text-gray-600">
                                            <CheckCircle2 className={`h-4 w-4 shrink-0 ${plan.color}`} />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </CardContent>
                        <CardFooter className="border-t border-gray-100 pt-6">
                            <div className="flex w-full items-center justify-between">
                                <div className="text-xs text-gray-600">
                                    <span className="font-semibold text-gray-900">{plan.activeTenants}</span>
                                    <span className="ml-1">Active Schools</span>
                                </div>
                                <Button variant="outline" size="sm" className="gap-2 border-gray-200">
                                    <Edit2 className="h-3 w-3" /> Edit
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            <Card className="flex items-start gap-4 rounded-2xl border border-gray-200 bg-emerald-50/80 p-6">
                <Layers className="h-6 w-6 shrink-0 text-emerald-600" />
                <div>
                    <h4 className="font-semibold text-emerald-700">Plan Synchronization</h4>
                    <p className="mt-1 text-sm text-gray-600">
                        Pricing changes will take effect at the start of the next billing cycle for existing schools. New schools will be onboarded with the current active rates immediately.
                    </p>
                </div>
            </Card>
        </div>
    );
}
