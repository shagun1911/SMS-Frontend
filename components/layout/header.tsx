"use client";

import { useAuthStore } from "@/store/authStore";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { LogOut, Bell, Calendar, ChevronDown } from "lucide-react";
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

    return (
        <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-xl shadow-sm">
            <div className="flex h-14 items-center justify-between px-4 md:px-6">
                <div className="flex items-center gap-3">
                    {user?.role !== "superadmin" && activeSess && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9 gap-2 rounded-xl border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-indigo-200"
                                >
                                    <Calendar className="h-4 w-4 text-indigo-600" />
                                    <span>{activeSess.sessionYear ?? "Session"}</span>
                                    <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-52 rounded-xl">
                                {Array.isArray(sessions) &&
                                    sessions.map((sess: any) => (
                                        <DropdownMenuItem
                                            key={sess._id}
                                            className={
                                                sess.isActive
                                                    ? "bg-indigo-50 text-indigo-700 font-medium rounded-lg"
                                                    : "text-slate-600 rounded-lg"
                                            }
                                        >
                                            {sess.sessionYear} {sess.isActive && " ✓"}
                                        </DropdownMenuItem>
                                    ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-xl hover:bg-slate-100">
                        <Bell className="h-4 w-4 text-slate-600" />
                        <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-indigo-500 ring-2 ring-white" />
                    </Button>
                    <div className="ml-2 flex items-center gap-2 border-l border-slate-200 pl-3">
                        <div className="hidden flex-col items-end md:flex">
                            <span className="text-sm font-semibold leading-none text-slate-900">
                                {user?.name || "Administrator"}
                            </span>
                            <span className="mt-0.5 text-xs text-slate-500 capitalize">
                                {user?.role?.replace("_", " ") || "Admin"}
                            </span>
                        </div>
                        <Avatar className="h-9 w-9 border-2 border-slate-200 ring-2 ring-indigo-100 rounded-xl">
                            <AvatarImage src={user?.photo} alt={user?.name} />
                            <AvatarFallback className="bg-indigo-100 text-indigo-700 font-semibold text-sm rounded-xl">
                                {user?.name?.charAt(0) || "A"}
                            </AvatarFallback>
                        </Avatar>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleLogout}
                            className="h-9 w-9 rounded-xl hover:bg-red-50 text-slate-500 hover:text-red-600"
                        >
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    );
}
