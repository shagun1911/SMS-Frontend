"use client";

import { Label } from "@/components/ui/label";

export type TransportStaffOption = { _id: string; name: string; phone?: string };

interface TransportStaffSelectProps {
    label: string;
    members: TransportStaffOption[];
    valueId: string;
    onChange: (member: TransportStaffOption | null) => void;
    placeholder?: string;
    disabled?: boolean;
}

export function TransportStaffSelect({
    label,
    members,
    valueId,
    onChange,
    placeholder = "— None —",
    disabled,
}: TransportStaffSelectProps) {
    return (
        <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
            </Label>
            <select
                disabled={disabled}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={valueId}
                onChange={(e) => {
                    const id = e.target.value;
                    const m = members.find((x) => x._id === id) ?? null;
                    onChange(m);
                }}
            >
                <option value="">{placeholder}</option>
                {members.map((m) => (
                    <option key={m._id} value={m._id}>
                        {m.name}
                        {m.phone ? ` · ${m.phone}` : ""}
                    </option>
                ))}
            </select>
        </div>
    );
}
