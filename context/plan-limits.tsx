"use client";

import { createContext, useContext, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

const ALL_FEATURE_KEYS = [
    "dashboard", "students", "classes", "sessions", "fees", "staff", "transport", "exams", "admit_cards", "timetable", "ai", "reports", "plan_billing",
];

type PlanLimitsContextValue = {
    planLimits: { planName: string; maxStudents: number; maxTeachers: number; enabledFeatures: string[] } | null;
    enabledFeatures: string[];
    isLoading: boolean;
    hasFeature: (key: string) => boolean;
};

const PlanLimitsContext = createContext<PlanLimitsContextValue>({
    planLimits: null,
    enabledFeatures: ALL_FEATURE_KEYS,
    isLoading: false,
    hasFeature: () => true,
});

export function PlanLimitsProvider({ children }: { children: ReactNode }) {
    const { user } = useAuthStore();
    const isSchool = user?.role && user.role !== "superadmin";

    const { data, isLoading } = useQuery({
        queryKey: ["school-stats"],
        queryFn: async () => {
            const res = await api.get("/schools/stats");
            return res.data?.data ?? {};
        },
        enabled: !!isSchool,
    });

    const planLimits = data?.planLimits ?? null;
    const enabledFeatures = isSchool
        ? (planLimits?.enabledFeatures ?? ALL_FEATURE_KEYS)
        : ALL_FEATURE_KEYS;

    const hasFeature = (key: string) => enabledFeatures.includes(key);

    return (
        <PlanLimitsContext.Provider
            value={{
                planLimits,
                enabledFeatures,
                isLoading: isSchool && isLoading,
                hasFeature,
            }}
        >
            {children}
        </PlanLimitsContext.Provider>
    );
}

export function usePlanLimits() {
    return useContext(PlanLimitsContext);
}
