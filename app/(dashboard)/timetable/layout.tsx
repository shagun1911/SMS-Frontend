"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
    { label: "Timetable", href: "/timetable" },
    { label: "Settings", href: "/timetable/settings" },
];

export default function TimetableLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    return (
        <div className="flex-1 space-y-6">
            <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3">
                {tabs.map((tab) => (
                    <Link
                        key={tab.href}
                        href={tab.href}
                        className={cn(
                            "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                            pathname === tab.href
                                ? "bg-indigo-600 text-white"
                                : "text-gray-600 hover:bg-gray-100"
                        )}
                    >
                        {tab.label}
                    </Link>
                ))}
            </div>
            {children}
        </div>
    );
}
