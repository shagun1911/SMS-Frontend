"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useMobileMenu } from "@/components/layout/mobile-menu-context";
import { LogOut, Bell, Calendar, ChevronDown, Menu, Info, AlertTriangle, AlertCircle, MessageSquare, Headphones, CheckCircle2, Clock, Megaphone, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import api from "@/lib/api";

const PRIORITY_ICONS: Record<string, typeof Info> = { info: Info, warning: AlertTriangle, critical: AlertCircle };
const PRIORITY_COLORS: Record<string, string> = {
    info: "text-sky-600",
    warning: "text-amber-600",
    critical: "text-red-600",
};
const TICKET_STATUS_ICON: Record<string, typeof MessageSquare> = {
    open: MessageSquare,
    in_progress: Clock,
    resolved: CheckCircle2,
};
const TICKET_STATUS_COLOR: Record<string, string> = {
    open: "text-sky-600",
    in_progress: "text-amber-600",
    resolved: "text-emerald-600",
};

export function Header() {
    const { logout, user } = useAuthStore();
    const router = useRouter();
    const isMaster = user?.role === "superadmin";
    const qc = useQueryClient();
    const [notifOpen, setNotifOpen] = useState(false);
    const [pendingReadIds, setPendingReadIds] = useState<Set<string>>(new Set());
    const [markAllPending, setMarkAllPending] = useState(false);
    const [seenMasterTicketIds, setSeenMasterTicketIds] = useState<Set<string>>(new Set());
    const [seenMasterAnnouncementIds, setSeenMasterAnnouncementIds] = useState<Set<string>>(new Set());
    const [seenSchoolTicketIds, setSeenSchoolTicketIds] = useState<Set<string>>(new Set());
    const [seenSchoolAnnouncementIds, setSeenSchoolAnnouncementIds] = useState<Set<string>>(new Set());

    const masterTicketSeenStorageKey = user?._id ? `ssms-master-seen-tickets:${user._id}` : null;
    const masterAnnouncementSeenStorageKey = user?._id ? `ssms-master-seen-announcements:${user._id}` : null;
    const schoolTicketSeenStorageKey = user?._id ? `ssms-school-seen-tickets:${user._id}` : null;
    const schoolAnnouncementSeenStorageKey = user?._id ? `ssms-school-seen-announcements:${user._id}` : null;

    useEffect(() => {
        if (!user?._id) {
            setSeenMasterTicketIds(new Set());
            setSeenMasterAnnouncementIds(new Set());
            setSeenSchoolTicketIds(new Set());
            setSeenSchoolAnnouncementIds(new Set());
            return;
        }

        try {
            if (isMaster) {
                const rawTickets = masterTicketSeenStorageKey
                    ? localStorage.getItem(masterTicketSeenStorageKey)
                    : null;
                const rawAnnouncements = masterAnnouncementSeenStorageKey
                    ? localStorage.getItem(masterAnnouncementSeenStorageKey)
                    : null;

                setSeenMasterTicketIds(new Set(rawTickets ? (JSON.parse(rawTickets) as string[]) : []));
                setSeenMasterAnnouncementIds(new Set(rawAnnouncements ? (JSON.parse(rawAnnouncements) as string[]) : []));
                setSeenSchoolTicketIds(new Set());
                setSeenSchoolAnnouncementIds(new Set());
            } else {
                const rawTickets = schoolTicketSeenStorageKey
                    ? localStorage.getItem(schoolTicketSeenStorageKey)
                    : null;
                const rawAnnouncements = schoolAnnouncementSeenStorageKey
                    ? localStorage.getItem(schoolAnnouncementSeenStorageKey)
                    : null;

                setSeenSchoolTicketIds(new Set(rawTickets ? (JSON.parse(rawTickets) as string[]) : []));
                setSeenSchoolAnnouncementIds(new Set(rawAnnouncements ? (JSON.parse(rawAnnouncements) as string[]) : []));
                setSeenMasterTicketIds(new Set());
                setSeenMasterAnnouncementIds(new Set());
            }
        } catch {
            setSeenMasterTicketIds(new Set());
            setSeenMasterAnnouncementIds(new Set());
            setSeenSchoolTicketIds(new Set());
            setSeenSchoolAnnouncementIds(new Set());
        }
    }, [isMaster, user?._id]);

    // Personal user notifications (for ALL roles)
    const { data: userNotificationsData } = useQuery({
        queryKey: ["user-notifications"],
        queryFn: async () => {
            const res = await api.get("/user-notifications");
            return res.data?.data ?? [];
        },
        enabled: !!user,
        refetchInterval: 10_000,
    });

    const markAsReadMut = useMutation({
        mutationFn: async (id: string) => {
            return api.patch(`/user-notifications/${id}/read`);
        },
        onSuccess: (_data, id) => {
            setPendingReadIds((prev) => {
                const next = new Set(prev);
                next.add(id);
                return next;
            });
        }
    });

    const markAllAsReadMut = useMutation({
        mutationFn: async () => {
            return api.patch(`/user-notifications/read-all`);
        },
        onMutate: () => {
            setMarkAllPending(true);
        },
        onSuccess: () => {
            setMarkAllPending(true);
        }
    });

    const { data: sessions } = useQuery({
        queryKey: ["sessions-list"],
        queryFn: async () => {
            const res = await api.get("/sessions");
            return res.data.data ?? [];
        },
        enabled: !isMaster,
    });

    // School admin: active announcements from master
    const { data: announcementsData } = useQuery({
        queryKey: ["announcements-active"],
        queryFn: async () => {
            const res = await api.get("/announcements/active");
            return res.data?.data ?? [];
        },
        enabled: !isMaster,
        refetchInterval: 60_000,
    });

    // School admin: own support tickets
    const { data: myTicketsData } = useQuery({
        queryKey: ["support-tickets"],
        queryFn: async () => {
            const res = await api.get("/support/tickets");
            return res.data?.data ?? [];
        },
        enabled: !isMaster,
        refetchInterval: 60_000,
    });

    // Master admin: open/in-progress support tickets from all schools
    const { data: masterTicketsData } = useQuery({
        queryKey: ["master-support"],
        queryFn: async () => {
            const res = await api.get("/master/support");
            return res.data?.data ?? [];
        },
        enabled: isMaster,
        refetchInterval: 60_000,
    });

    // Master admin: active announcements they created
    const { data: masterAnnouncementsData } = useQuery({
        queryKey: ["master-announcements"],
        queryFn: async () => {
            const res = await api.get("/master/announcements");
            return res.data?.data ?? [];
        },
        enabled: isMaster,
        refetchInterval: 60_000,
    });

    const announcements: any[] = Array.isArray(announcementsData) ? announcementsData : [];
    const myTickets: any[] = Array.isArray(myTicketsData) ? myTicketsData : [];
    const masterTickets: any[] = Array.isArray(masterTicketsData) ? masterTicketsData : [];
    const userNotifications: any[] = Array.isArray(userNotificationsData) ? userNotificationsData : [];
    const masterAnnouncements: any[] = Array.isArray(masterAnnouncementsData)
        ? masterAnnouncementsData.filter((a: any) => a.isActive)
        : [];

    // Master admin: open/in‑progress tickets for display in dropdown
    const openMasterTickets = masterTickets.filter((t: any) => t.status !== "resolved");

    const unseenMasterTickets = openMasterTickets.filter((t: any) => !seenMasterTicketIds.has(String(t._id)));
    const unseenMasterAnnouncements = masterAnnouncements.filter((a: any) => !seenMasterAnnouncementIds.has(String(a._id)));

    // School admin: only show tickets that master has acted on.
    // New school-submitted tickets start as `open`; we don't want those in the school bell.
    const handledSchoolTickets = myTickets.filter((t: any) => t.status !== "open");
    const unseenSchoolTickets = handledSchoolTickets.filter((t: any) => !seenSchoolTicketIds.has(String(t._id)));
    const unseenSchoolAnnouncements = announcements.filter((a: any) => !seenSchoolAnnouncementIds.has(String(a._id)));

    // Unread count shown on bell:
    // Keep behaviour intuitive and "real": the badge should
    // only reflect items that can actually become "read".
    // So we use ONLY per-user unread notifications here.
    const unreadNotifications = useMemo(
        () => userNotifications.filter((n: any) => !n.isRead),
        [userNotifications]
    );
    const visibleNotifications = useMemo(() => {
        if (markAllPending) return unreadNotifications;
        return unreadNotifications.filter((n: any) => !pendingReadIds.has(String(n._id)));
    }, [unreadNotifications, pendingReadIds, markAllPending]);
    const personalUnread = markAllPending
        ? 0
        : Math.max(0, unreadNotifications.length - pendingReadIds.size);
    /** Bell badge: personal unread + (master) unseen tickets/announcements */
    const masterAlertCount = isMaster ? unseenMasterTickets.length + unseenMasterAnnouncements.length : 0;
    const schoolAlertCount = !isMaster ? unseenSchoolTickets.length + unseenSchoolAnnouncements.length : 0;
    const totalBellCount = personalUnread + (isMaster ? masterAlertCount : schoolAlertCount);

    const activeSess = Array.isArray(sessions)
        ? sessions.find((s: any) => s.isActive)
        : null;

    const handleLogout = () => {
        logout();
        router.push("/login");
    };

    const { toggle: toggleMobileMenu } = useMobileMenu();

    return (
        <header className="sticky top-0 z-30 w-full border-b border-[hsl(var(--border))] bg-white/90 backdrop-blur-xl shadow-sm transition-smooth">
            <div className="flex h-14 items-center justify-between gap-2 px-3 sm:px-4 md:px-6">
                <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0 rounded-xl md:hidden"
                        onClick={toggleMobileMenu}
                        aria-label="Open menu"
                    >
                        <Menu className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
                    </Button>
                    {!isMaster && activeSess && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9 min-w-0 gap-1.5 rounded-xl border-[hsl(var(--border))] bg-white text-xs font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] sm:gap-2 sm:text-sm"
                                >
                                    <Calendar className="h-4 w-4 shrink-0 text-primary" />
                                    <span className="truncate max-w-25 sm:max-w-none">{activeSess.sessionYear ?? "Session"}</span>
                                    <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[hsl(var(--muted-foreground))]" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-52 rounded-xl">
                                {Array.isArray(sessions) &&
                                    sessions.map((sess: any) => (
                                        <DropdownMenuItem
                                            key={sess._id}
                                            className={
                                                sess.isActive
                                                    ? "bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] font-medium rounded-lg"
                                                    : "text-[hsl(var(--muted-foreground))] rounded-lg"
                                            }
                                        >
                                            {sess.sessionYear} {sess.isActive && " ✓"}
                                        </DropdownMenuItem>
                                    ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>

                <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                    {/* Notification Bell */}
                    <DropdownMenu
                        open={notifOpen}
                        onOpenChange={(open) => {
                            setNotifOpen(open);
                            if (!open) {
                                setPendingReadIds(new Set());
                                setMarkAllPending(false);
                                qc.invalidateQueries({ queryKey: ["user-notifications"] });
                            }
                        }}
                    >
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-xl hover:bg-[hsl(var(--muted))]">
                                <Bell className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                                {totalBellCount > 0 && (
                                    <span className="absolute -right-0.5 -top-0.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
                                        {totalBellCount > 99 ? "99+" : totalBellCount}
                                    </span>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-80 rounded-xl p-0" sideOffset={8}>
                            <div className="flex items-center justify-between border-b px-4 py-3">
                                <span className="font-semibold text-sm">Notifications</span>
                                <div className="flex items-center gap-2">
                                    {personalUnread > 0 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                markAllAsReadMut.mutate();
                                            }}
                                            className="h-6 px-2 text-xs text-primary font-medium hover:bg-primary/10"
                                            disabled={markAllAsReadMut.isPending}
                                        >
                                            Mark all as read
                                        </Button>
                                    )}
                                    {totalBellCount > 0 && (
                                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                            {totalBellCount} new
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="max-h-100 overflow-y-auto scrollbar-thin">
                                {/* ── PERSONAL ALERTS ── */}
                                {visibleNotifications.length > 0 && (
                                    <>
                                        <DropdownMenuLabel className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            Personal Alerts
                                        </DropdownMenuLabel>
                                        {visibleNotifications.map((n: any) => {
                                            const isUnread = !n.isRead;
                                            const isPendingRead = markAllPending || pendingReadIds.has(String(n._id));
                                            return (
                                                <DropdownMenuItem
                                                    key={n._id}
                                                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer rounded-none transition-opacity duration-200 focus:bg-muted/50 ${isUnread ? 'bg-primary/5' : ''} ${isPendingRead ? 'opacity-40' : ''}`}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        if (isUnread && !isPendingRead) markAsReadMut.mutate(String(n._id));
                                                    }}
                                                >
                                                    <div className="relative mt-0.5 shrink-0">
                                                        <Bell className={`h-4 w-4 ${isUnread ? "text-primary" : "text-muted-foreground"}`} />
                                                        {isUnread && <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-primary ring-1 ring-white" />}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className={`text-sm leading-snug ${isUnread ? "font-semibold text-primary" : "font-medium"}`}>{n.title}</p>
                                                        {n.message && (
                                                            <p className={`mt-0.5 text-xs line-clamp-3 leading-relaxed ${isUnread ? "text-foreground" : "text-muted-foreground"}`}>{n.message}</p>
                                                        )}
                                                    </div>
                                                </DropdownMenuItem>
                                            );
                                        })}
                                        <DropdownMenuSeparator />
                                    </>
                                )}

                                {/* ── SCHOOL ADMIN VIEW ── */}
                                {!isMaster && (
                                    <>
                                        {unseenSchoolAnnouncements.length > 0 && (
                                            <>
                                                <DropdownMenuLabel className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                    Announcements
                                                </DropdownMenuLabel>
                                                {unseenSchoolAnnouncements.map((a: any) => {
                                                    const Icon = PRIORITY_ICONS[a.priority] ?? Info;
                                                    const color = PRIORITY_COLORS[a.priority] ?? PRIORITY_COLORS.info;
                                                    return (
                                                        <DropdownMenuItem
                                                            key={a._id}
                                                            className="flex items-start gap-3 px-4 py-3 cursor-pointer rounded-none focus:bg-muted/50"
                                                            onClick={() => {
                                                                const idStr = String(a._id);
                                                                setSeenSchoolAnnouncementIds((prev) => {
                                                                    const next = new Set(prev);
                                                                    next.add(idStr);
                                                                    if (schoolAnnouncementSeenStorageKey) {
                                                                        try {
                                                                            localStorage.setItem(
                                                                                schoolAnnouncementSeenStorageKey,
                                                                                JSON.stringify(Array.from(next))
                                                                            );
                                                                        } catch {}
                                                                    }
                                                                    return next;
                                                                });
                                                            }}
                                                        >
                                                            <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${color}`} />
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-sm font-medium leading-snug">{a.title}</p>
                                                                {a.message && (
                                                                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{a.message}</p>
                                                                )}
                                                            </div>
                                                        </DropdownMenuItem>
                                                    );
                                                })}
                                                <DropdownMenuSeparator />
                                            </>
                                        )}

                                        {unseenSchoolTickets.length > 0 && (
                                            <>
                                                <DropdownMenuLabel className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                    Support tickets
                                                </DropdownMenuLabel>
                                                {unseenSchoolTickets.slice(0, 5).map((t: any) => {
                                                    const Icon = TICKET_STATUS_ICON[t.status] ?? MessageSquare;
                                                    const color = TICKET_STATUS_COLOR[t.status] ?? TICKET_STATUS_COLOR.open;
                                                    return (
                                                        <DropdownMenuItem key={t._id} asChild className="rounded-none focus:bg-muted/50">
                                                            <Link
                                                                href="/support"
                                                                className="flex items-start gap-3 px-4 py-3"
                                                                onClick={() => {
                                                                    const idStr = String(t._id);
                                                                    setSeenSchoolTicketIds((prev) => {
                                                                        const next = new Set(prev);
                                                                        next.add(idStr);
                                                                        if (schoolTicketSeenStorageKey) {
                                                                            try {
                                                                                localStorage.setItem(
                                                                                    schoolTicketSeenStorageKey,
                                                                                    JSON.stringify(Array.from(next))
                                                                                );
                                                                            } catch {}
                                                                        }
                                                                        return next;
                                                                    });
                                                                }}
                                                            >
                                                                <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${color}`} />
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="text-sm font-medium leading-snug truncate">{t.subject}</p>
                                                                    <p className="mt-0.5 text-xs text-muted-foreground capitalize">
                                                                        {t.status === "in_progress" ? "In progress" : t.status}
                                                                        {t.resolvedAt ? ` · ${new Date(t.resolvedAt).toLocaleDateString(undefined, { dateStyle: "short" })}` : ""}
                                                                    </p>
                                                                </div>
                                                            </Link>
                                                        </DropdownMenuItem>
                                                    );
                                                })}
                                                <DropdownMenuSeparator />
                                            </>
                                        )}

                                        {unseenSchoolAnnouncements.length === 0 && unseenSchoolTickets.length === 0 && visibleNotifications.length === 0 && (
                                            <div className="px-4 py-8 text-center flex flex-col items-center justify-center gap-2">
                                                <Bell className="h-8 w-8 text-muted-foreground/30" />
                                                <p className="text-sm text-muted-foreground">No notifications right now.</p>
                                            </div>
                                        )}

                                        <DropdownMenuItem asChild className="rounded-none rounded-b-xl focus:bg-muted/50">
                                            <Link
                                                href="/support"
                                                className="flex items-center gap-2 px-4 py-3 text-sm text-primary font-medium"
                                                    onClick={() => {
                                                    setSeenSchoolTicketIds((prev) => {
                                                        const next = new Set(prev);
                                                            unseenSchoolTickets.forEach((t: any) => next.add(String(t._id)));
                                                        if (schoolTicketSeenStorageKey) {
                                                            try {
                                                                localStorage.setItem(
                                                                    schoolTicketSeenStorageKey,
                                                                    JSON.stringify(Array.from(next))
                                                                );
                                                            } catch {}
                                                        }
                                                        return next;
                                                    });
                                                }}
                                            >
                                                <Headphones className="h-4 w-4" /> View all support tickets
                                            </Link>
                                        </DropdownMenuItem>
                                    </>
                                )}

                                {/* ── MASTER ADMIN VIEW ── */}
                                {isMaster && (
                                    <>
                                        {unseenMasterTickets.length > 0 && (
                                            <>
                                                <DropdownMenuLabel className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                    Open tickets
                                                </DropdownMenuLabel>
                                                {unseenMasterTickets.slice(0, 5).map((t: any) => {
                                                    const Icon = TICKET_STATUS_ICON[t.status] ?? MessageSquare;
                                                    const color = TICKET_STATUS_COLOR[t.status] ?? TICKET_STATUS_COLOR.open;
                                                    return (
                                                        <DropdownMenuItem key={t._id} asChild className="rounded-none focus:bg-muted/50">
                                                            <Link
                                                                href="/master/support"
                                                                className="flex items-start gap-3 px-4 py-3"
                                                                onClick={() => {
                                                                    const idStr = String(t._id);
                                                                    setSeenMasterTicketIds((prev) => {
                                                                        const next = new Set(prev);
                                                                        next.add(idStr);
                                                                        if (masterTicketSeenStorageKey) {
                                                                            try {
                                                                                localStorage.setItem(masterTicketSeenStorageKey, JSON.stringify(Array.from(next)));
                                                                            } catch {}
                                                                        }
                                                                        return next;
                                                                    });
                                                                }}
                                                            >
                                                                <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${color}`} />
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="text-sm font-medium leading-snug truncate">{t.subject}</p>
                                                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                                                        {t.schoolName} · <span className="capitalize">{t.priority}</span>
                                                                    </p>
                                                                </div>
                                                            </Link>
                                                        </DropdownMenuItem>
                                                    );
                                                })}
                                                <DropdownMenuSeparator />
                                            </>
                                        )}

                                        {unseenMasterAnnouncements.length > 0 && (
                                            <>
                                                <DropdownMenuLabel className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                    Active announcements
                                                </DropdownMenuLabel>
                                                {unseenMasterAnnouncements.slice(0, 3).map((a: any) => {
                                                    const Icon = PRIORITY_ICONS[a.priority] ?? Info;
                                                    const color = PRIORITY_COLORS[a.priority] ?? PRIORITY_COLORS.info;
                                                    return (
                                                        <DropdownMenuItem key={a._id} asChild className="rounded-none focus:bg-muted/50">
                                                            <Link
                                                                href="/master/announcements"
                                                                className="flex items-start gap-3 px-4 py-3"
                                                                onClick={() => {
                                                                    const idStr = String(a._id);
                                                                    setSeenMasterAnnouncementIds((prev) => {
                                                                        const next = new Set(prev);
                                                                        next.add(idStr);
                                                                        if (masterAnnouncementSeenStorageKey) {
                                                                            try {
                                                                                localStorage.setItem(masterAnnouncementSeenStorageKey, JSON.stringify(Array.from(next)));
                                                                            } catch {}
                                                                        }
                                                                        return next;
                                                                    });
                                                                }}
                                                            >
                                                                <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${color}`} />
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="text-sm font-medium leading-snug">{a.title}</p>
                                                                    <p className="mt-0.5 text-xs text-muted-foreground capitalize">{a.priority}</p>
                                                                </div>
                                                            </Link>
                                                        </DropdownMenuItem>
                                                    );
                                                })}
                                                <DropdownMenuSeparator />
                                            </>
                                        )}

                                        {unseenMasterTickets.length === 0 && unseenMasterAnnouncements.length === 0 && (
                                            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                                                No pending tickets or active announcements.
                                            </div>
                                        )}

                                        <div className="flex border-t">
                                            <DropdownMenuItem asChild className="flex-1 rounded-none rounded-bl-xl focus:bg-muted/50">
                                                <Link
                                                    href="/master/support"
                                                    className="flex items-center justify-center gap-2 px-4 py-3 text-sm text-primary font-medium"
                                                    onClick={() => {
                                                        setSeenMasterTicketIds((prev) => {
                                                            const next = new Set(prev);
                                                            unseenMasterTickets.forEach((t: any) => next.add(String(t._id)));
                                                            if (masterTicketSeenStorageKey) {
                                                                try {
                                                                    localStorage.setItem(masterTicketSeenStorageKey, JSON.stringify(Array.from(next)));
                                                                } catch {}
                                                            }
                                                            return next;
                                                        });
                                                    }}
                                                >
                                                    <Headphones className="h-4 w-4" /> Support
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild className="flex-1 rounded-none rounded-br-xl focus:bg-muted/50 border-l">
                                                <Link
                                                    href="/master/announcements"
                                                    className="flex items-center justify-center gap-2 px-4 py-3 text-sm text-primary font-medium"
                                                    onClick={() => {
                                                        setSeenMasterAnnouncementIds((prev) => {
                                                            const next = new Set(prev);
                                                            unseenMasterAnnouncements.forEach((a: any) => next.add(String(a._id)));
                                                            if (masterAnnouncementSeenStorageKey) {
                                                                try {
                                                                    localStorage.setItem(masterAnnouncementSeenStorageKey, JSON.stringify(Array.from(next)));
                                                                } catch {}
                                                            }
                                                            return next;
                                                        });
                                                    }}
                                                >
                                                    <Megaphone className="h-4 w-4" /> Announcements
                                                </Link>
                                            </DropdownMenuItem>
                                        </div>
                                    </>
                                )}
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <div className="flex items-center gap-1 border-l border-[hsl(var(--border))] pl-2 sm:gap-2 sm:pl-3">
                        <div className="hidden flex-col items-end sm:flex md:flex">
                            <span className="text-sm font-semibold leading-none text-[hsl(var(--foreground))]">
                                {user?.name || "Administrator"}
                            </span>
                            <span className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))] capitalize">
                                {user?.role?.replace("_", " ") || "Admin"}
                            </span>
                        </div>
                        {user?.role === "teacher" ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="focus:outline-none">
                                        <Avatar className="h-9 w-9 rounded-xl border-2 border-[hsl(var(--border))] ring-2 ring-[hsl(var(--primary))]/10 cursor-pointer hover:ring-4 transition-all">
                                            <AvatarImage src={user?.photo} alt={user?.name} />
                                            <AvatarFallback className="bg-[hsl(var(--primary))]/10 font-semibold text-sm text-primary rounded-xl">
                                                {user?.name?.charAt(0) || "T"}
                                            </AvatarFallback>
                                        </Avatar>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44 rounded-xl">
                                    <DropdownMenuItem asChild>
                                        <Link href="/teacher/profile" className="flex items-center gap-2">
                                            <Lock className="h-4 w-4" /> Change Password
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                        <LogOut className="mr-2 h-4 w-4" /> Logout
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <Avatar className="h-9 w-9 rounded-xl border-2 border-[hsl(var(--border))] ring-2 ring-[hsl(var(--primary))]/10">
                                <AvatarImage src={user?.photo} alt={user?.name} />
                                <AvatarFallback className="bg-[hsl(var(--primary))]/10 font-semibold text-sm text-primary rounded-xl">
                                    {user?.name?.charAt(0) || "A"}
                                </AvatarFallback>
                            </Avatar>
                        )}
                        {user?.role !== "teacher" && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleLogout}
                                className="h-9 w-9 rounded-xl text-[hsl(var(--muted-foreground))] hover:bg-destructive/10 hover:text-destructive"
                            >
                                <LogOut className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
