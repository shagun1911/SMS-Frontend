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

/**
 * UI state for one staff row: explicit `marks` wins, then server day data, then legacy implicit present
 * (past dates only stored absences).
 */
export function effectiveStaffAttendanceMark(
    staffId: string,
    marks: Record<string, "PRESENT" | "ABSENT">,
    dayData: { absentStaffIds: string[]; presentStaffIds?: string[] } | null | undefined,
    dateYmd: string,
    todayYmd: string
): "PRESENT" | "ABSENT" | "PENDING" {
    const m = marks[staffId];
    if (m === "PRESENT") return "PRESENT";
    if (m === "ABSENT") return "ABSENT";
    if (dayData?.absentStaffIds?.includes(staffId)) return "ABSENT";
    if (dayData?.presentStaffIds?.includes(staffId)) return "PRESENT";
    if (dateYmd < todayYmd) return "PRESENT";
    return "PENDING";
}

/**
 * Persisted mark for POST /staff-attendance/day. Legacy past days only stored absences; implicit
 * present is PENDING (clears both present/absent rows).
 */
export function staffAttendanceMarkForSave(
    staffId: string,
    marks: Record<string, "PRESENT" | "ABSENT">,
    dayData: { absentStaffIds: string[]; presentStaffIds?: string[] } | null | undefined,
    dateYmd: string,
    todayYmd: string
): "PRESENT" | "ABSENT" | "PENDING" {
    const m = marks[staffId];
    if (m === "PRESENT") return "PRESENT";
    if (m === "ABSENT") return "ABSENT";
    if (dayData?.absentStaffIds?.includes(staffId)) return "ABSENT";
    if (dayData?.presentStaffIds?.includes(staffId)) return "PRESENT";
    if (dateYmd < todayYmd) return "PENDING";
    return "PENDING";
}
