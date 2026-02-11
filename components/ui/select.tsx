"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    options: { label: string; value: string }[];
    error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, label, options, error, ...props }, ref) => {
        return (
            <div className="space-y-2 w-full">
                {label && (
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">
                        {label}
                    </label>
                )}
                <div className="relative group">
                    <select
                        ref={ref}
                        className={cn(
                            "w-full h-14 bg-white/[0.05] border border-white/10 rounded-2xl px-4 text-sm appearance-none outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 transition-all text-white",
                            className
                        )}
                        {...props}
                    >
                        {options.map((opt) => (
                            <option key={opt.value} value={opt.value} className="bg-neutral-900 text-white">
                                {opt.label}
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 group-hover:text-white transition-colors">
                        <ChevronDown className="h-4 w-4" />
                    </div>
                </div>
                {error && <p className="text-[10px] text-red-400 ml-1">{error}</p>}
            </div>
        );
    }
);

Select.displayName = "Select";
