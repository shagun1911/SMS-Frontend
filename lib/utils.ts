import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
    }).format(amount)
}

/** Directory / payroll: show custom title for `staff_other`, else title-case role slug. */
export function formatStaffRoleLabel(role: string, staffRoleTitle?: string | null): string {
    if (role === "staff_other" && staffRoleTitle?.trim()) {
        return staffRoleTitle.trim();
    }
    return role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
