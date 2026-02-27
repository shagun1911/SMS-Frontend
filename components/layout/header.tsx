"use client";

import { useAuthStore } from "@/store/authStore";
import { useQuery } from "@tanstack/react-query";
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
    const masterAnnouncements: any[] = Array.isArray(masterAnnouncementsData)
        ? masterAnnouncementsData.filter((a: any) => a.isActive)
        : [];

    // Unread count
    const openMasterTickets = masterTickets.filter((t: any) => t.status !== "resolved");
    const schoolUnread = announcements.length + myTickets.filter((t: any) => t.status === "resolved").length;
    const masterUnread = openMasterTickets.length;
    const unreadCount = isMaster ? masterUnread : schoolUnread;

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
                                    <span className="truncate max-w-[100px] sm:max-w-none">{activeSess.sessionYear ?? "Session"}</span>
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
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-xl hover:bg-[hsl(var(--muted))]">
                                <Bell className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                                {unreadCount > 0 && (
                                    <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white ring-2 ring-white">
                                        {unreadCount > 9 ? "9+" : unreadCount}
                                    </span>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-80 rounded-xl p-0" sideOffset={8}>
                            <div className="flex items-center justify-between border-b px-4 py-3">
                                <span className="font-semibold text-sm">Notifications</span>
                                {unreadCount > 0 && (
                                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                        {unreadCount} new
                                    </span>
                                )}
                            </div>

                            <div className="max-h-[400px] overflow-y-auto">
                                {/* ── SCHOOL ADMIN VIEW ── */}
                                {!isMaster && (
                                    <>
                                        {announcements.length > 0 && (
                                            <>
                                                <DropdownMenuLabel className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                    Announcements
                                                </DropdownMenuLabel>
                                                {announcements.map((a: any) => {
                                                    const Icon = PRIORITY_ICONS[a.priority] ?? Info;
                                                    const color = PRIORITY_COLORS[a.priority] ?? PRIORITY_COLORS.info;
                                                    return (
                                                        <DropdownMenuItem key={a._id} className="flex items-start gap-3 px-4 py-3 cursor-default rounded-none focus:bg-muted/50">
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

                                        {myTickets.length > 0 && (
                                            <>
                                                <DropdownMenuLabel className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                    Support tickets
                                                </DropdownMenuLabel>
                                                {myTickets.slice(0, 5).map((t: any) => {
                                                    const Icon = TICKET_STATUS_ICON[t.status] ?? MessageSquare;
                                                    const color = TICKET_STATUS_COLOR[t.status] ?? TICKET_STATUS_COLOR.open;
                                                    return (
                                                        <DropdownMenuItem key={t._id} asChild className="rounded-none focus:bg-muted/50">
                                                            <Link href="/support" className="flex items-start gap-3 px-4 py-3">
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

                                        {announcements.length === 0 && myTickets.length === 0 && (
                                            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                                                No notifications right now.
                                            </div>
                                        )}

                                        <DropdownMenuItem asChild className="rounded-none rounded-b-xl focus:bg-muted/50">
                                            <Link href="/support" className="flex items-center gap-2 px-4 py-3 text-sm text-primary font-medium">
                                                <Headphones className="h-4 w-4" /> View all support tickets
                                            </Link>
                                        </DropdownMenuItem>
                                    </>
                                )}

                                {/* ── MASTER ADMIN VIEW ── */}
                                {isMaster && (
                                    <>
                                        {openMasterTickets.length > 0 && (
                                            <>
                                                <DropdownMenuLabel className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                    Open tickets
                                                </DropdownMenuLabel>
                                                {openMasterTickets.slice(0, 5).map((t: any) => {
                                                    const Icon = TICKET_STATUS_ICON[t.status] ?? MessageSquare;
                                                    const color = TICKET_STATUS_COLOR[t.status] ?? TICKET_STATUS_COLOR.open;
                                                    return (
                                                        <DropdownMenuItem key={t._id} asChild className="rounded-none focus:bg-muted/50">
                                                            <Link href="/master/support" className="flex items-start gap-3 px-4 py-3">
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

                                        {masterAnnouncements.length > 0 && (
                                            <>
                                                <DropdownMenuLabel className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                    Active announcements
                                                </DropdownMenuLabel>
                                                {masterAnnouncements.slice(0, 3).map((a: any) => {
                                                    const Icon = PRIORITY_ICONS[a.priority] ?? Info;
                                                    const color = PRIORITY_COLORS[a.priority] ?? PRIORITY_COLORS.info;
                                                    return (
                                                        <DropdownMenuItem key={a._id} asChild className="rounded-none focus:bg-muted/50">
                                                            <Link href="/master/announcements" className="flex items-start gap-3 px-4 py-3">
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

                                        {openMasterTickets.length === 0 && masterAnnouncements.length === 0 && (
                                            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                                                No pending tickets or active announcements.
                                            </div>
                                        )}

                                        <div className="flex border-t">
                                            <DropdownMenuItem asChild className="flex-1 rounded-none rounded-bl-xl focus:bg-muted/50">
                                                <Link href="/master/support" className="flex items-center justify-center gap-2 px-4 py-3 text-sm text-primary font-medium">
                                                    <Headphones className="h-4 w-4" /> Support
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild className="flex-1 rounded-none rounded-br-xl focus:bg-muted/50 border-l">
                                                <Link href="/master/announcements" className="flex items-center justify-center gap-2 px-4 py-3 text-sm text-primary font-medium">
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
