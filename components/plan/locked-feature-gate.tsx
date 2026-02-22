"use client";

import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";
import { usePlanLimits } from "@/context/plan-limits";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface LockedFeatureGateProps {
    featureKey: string;
    featureLabel: string;
    children: React.ReactNode;
}

export function LockedFeatureGate({ featureKey, featureLabel, children }: LockedFeatureGateProps) {
    const { hasFeature } = usePlanLimits();

    if (hasFeature(featureKey)) {
        return <>{children}</>;
    }

    return (
        <div className="flex flex-1 flex-col items-center justify-center p-8">
            <Card className="max-w-md border-2 border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20">
                <CardContent className="flex flex-col items-center gap-4 pt-8 pb-8 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                        <Lock className="h-7 w-7 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">{featureLabel} is not included in your plan</h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Upgrade your plan to unlock this feature and get a more complete school management experience.
                        </p>
                    </div>
                    <Button asChild className="gap-2">
                        <Link href="/plan">
                            <Sparkles className="h-4 w-4" />
                            Upgrade plan
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
