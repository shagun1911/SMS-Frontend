/**
 * Classify exams by calendar date vs today (local timezone).
 *
 * Example: exam Mar 23–Mar 24
 * - Mar 22 → upcoming (before start)
 * - Mar 23–24 → ongoing (start and end dates inclusive)
 * - Mar 25+ → completed (after end)
 */
export type ExamScheduleBucket = "upcoming" | "ongoing" | "completed";

function startOfLocalDay(d: Date): number {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/**
 * Calendar day in local timezone. Date-only strings (YYYY-MM-DD) and ISO strings
 * use the written calendar date, not UTC shift (avoids “wrong tab” in some timezones).
 */
function examDayStart(value: string | Date | undefined): number | null {
    if (value == null) return null;
    if (typeof value === "string") {
        const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
        if (m) {
            const y = parseInt(m[1], 10);
            const mo = parseInt(m[2], 10) - 1;
            const day = parseInt(m[3], 10);
            if (!Number.isNaN(y) && !Number.isNaN(mo) && !Number.isNaN(day)) {
                return startOfLocalDay(new Date(y, mo, day));
            }
        }
    }
    const d = value instanceof Date ? value : new Date(value as string);
    if (Number.isNaN(d.getTime())) return null;
    return startOfLocalDay(d);
}

export function getExamScheduleBucket(exam: {
    startDate?: string | Date;
    endDate?: string | Date;
}): ExamScheduleBucket {
    const start = examDayStart(exam.startDate);
    const end = examDayStart(exam.endDate);
    if (start == null || end == null) return "upcoming";

    const today = startOfLocalDay(new Date());

    if (today < start) return "upcoming";
    if (today <= end) return "ongoing";
    return "completed";
}

export function filterExamsByBucket<T extends { startDate?: string | Date; endDate?: string | Date }>(
    exams: T[],
    bucket: ExamScheduleBucket
): T[] {
    return exams.filter((e) => getExamScheduleBucket(e) === bucket);
}
