/** Normalize phone for comparing staff vs bus crew fields. */
export function normalizePhoneDigits(phone: string): string {
    return String(phone || "").replace(/\D/g, "");
}

/**
 * Match saved bus driver/conductor name+phone to a staff `_id` for select value.
 * Uses name (case-insensitive); if several share a name, uses phone digits.
 */
export function matchStaffMemberId(
    members: Array<{ _id: string; name: string; phone?: string }>,
    name: string | undefined,
    phone: string | undefined
): string {
    const n = (name || "").trim().toLowerCase();
    if (!n) return "";
    const matches = members.filter((m) => m.name.trim().toLowerCase() === n);
    if (matches.length === 1) return matches[0]._id;
    const pd = normalizePhoneDigits(phone || "");
    if (pd) {
        const byPhone = matches.find((m) => normalizePhoneDigits(m.phone || "") === pd);
        if (byPhone) return byPhone._id;
    }
    return "";
}
