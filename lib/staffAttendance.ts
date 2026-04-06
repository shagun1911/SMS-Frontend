import { UserRole } from "@/types";

/** Roles excluded from staff attendance (aligned with backend). */
export const STAFF_ATTENDANCE_EXCLUDED_ROLES: UserRole[] = [
    UserRole.SCHOOL_ADMIN,
    UserRole.BUS_DRIVER,
    UserRole.CONDUCTOR,
];

export const staffAttendanceExcludedSet = new Set(STAFF_ATTENDANCE_EXCLUDED_ROLES);

export function isStaffAttendanceTrackedRole(role: string | undefined): boolean {
    if (!role) return false;
    return !staffAttendanceExcludedSet.has(role as UserRole);
}

/** Local calendar date YYYY-MM-DD */
export function formatYmdLocal(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}
