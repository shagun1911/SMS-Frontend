"use client";

import { useMemo, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import api from "@/lib/api";

export function TeacherHeader() {
    const { user } = useAuthStore();
    const qc = useQueryClient();
    const [notifOpen, setNotifOpen] = useState(false);
    const [pendingReadIds, setPendingReadIds] = useState<Set<string>>(new Set());
    const [markAllPending, setMarkAllPending] = useState(false);

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

    const userNotifications: any[] = Array.isArray(userNotificationsData) ? userNotificationsData : [];
    const unreadNotifications = useMemo(
        () => userNotifications.filter((n: any) => !n.isRead),
        [userNotifications]
    );
    const visibleNotifications = useMemo(() => {
        if (markAllPending) return unreadNotifications;
        return unreadNotifications.filter((n: any) => !pendingReadIds.has(String(n._id)));
    }, [unreadNotifications, pendingReadIds, markAllPending]);
    const unreadCount = markAllPending
        ? 0
        : Math.max(0, unreadNotifications.length - pendingReadIds.size);

    return (
        <header className="sticky top-0 z-30 w-full bg-slate-50 border-b border-transparent flex items-center justify-end h-14 px-4 sm:px-6">
            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
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
                        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-xl hover:bg-slate-200/50">
                            <Bell className="h-5 w-5 text-slate-500" />
                            {unreadCount > 0 && (
                                <span className="absolute right-1.5 top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white">
                                    {unreadCount > 9 ? "9+" : unreadCount}
                                </span>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80 rounded-xl p-0" sideOffset={8}>
                        <div className="flex items-center justify-between border-b px-4 py-3">
                            <span className="font-semibold text-sm">Notifications</span>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => markAllAsReadMut.mutate()}
                                        className="h-6 px-2 text-xs text-primary font-medium hover:bg-primary/10"
                                        disabled={markAllAsReadMut.isPending}
                                    >
                                        Mark all as read
                                    </Button>
                                )}
                                {unreadCount > 0 && (
                                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                        {unreadCount} new
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="max-h-[400px] overflow-y-auto scrollbar-thin">
                            {visibleNotifications.length > 0 ? (
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
                                </>
                            ) : (
                                <div className="px-4 py-8 text-center flex flex-col items-center justify-center gap-2">
                                    <Bell className="h-8 w-8 text-muted-foreground/30" />
                                    <p className="text-sm text-muted-foreground">No notifications right now.</p>
                                </div>
                            )}
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
