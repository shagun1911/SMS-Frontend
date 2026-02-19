"use client";

import { useAuthStore } from "@/store/authStore";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useMobileMenu } from "@/components/layout/mobile-menu-context";
import { LogOut, Bell, Calendar, ChevronDown, Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import api from "@/lib/api";

export function Header() {
    const { logout, user } = useAuthStore();
    const router = useRouter();

    const { data: sessions } = useQuery({
        queryKey: ["sessions-list"],
        queryFn: async () => {
            const res = await api.get("/sessions");
            return res.data.data ?? [];
        },
        enabled: user?.role !== "superadmin",
    });

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
                    {user?.role !== "superadmin" && activeSess && (
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
                    <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-xl hover:bg-[hsl(var(--muted))]">
                        <Bell className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                        <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary ring-2 ring-white" />
                    </Button>
                    <div className="flex items-center gap-1 border-l border-[hsl(var(--border))] pl-2 sm:gap-2 sm:pl-3">
                        <div className="hidden flex-col items-end sm:flex md:flex">
                            <span className="text-sm font-semibold leading-none text-[hsl(var(--foreground))]">
                                {user?.name || "Administrator"}
                            </span>
                            <span className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))] capitalize">
                                {user?.role?.replace("_", " ") || "Admin"}
                            </span>
                        </div>
                        <Avatar className="h-9 w-9 rounded-xl border-2 border-[hsl(var(--border))] ring-2 ring-[hsl(var(--primary))]/10">
                            <AvatarImage src={user?.photo} alt={user?.name} />
                            <AvatarFallback className="bg-[hsl(var(--primary))]/10 font-semibold text-sm text-primary rounded-xl">
                                {user?.name?.charAt(0) || "A"}
                            </AvatarFallback>
                        </Avatar>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleLogout}
                            className="h-9 w-9 rounded-xl text-[hsl(var(--muted-foreground))] hover:bg-destructive/10 hover:text-destructive"
                        >
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    );
}
