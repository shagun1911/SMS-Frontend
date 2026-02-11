"use client";

import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { LogOut, Bell, User } from "lucide-react";
import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Header() {
    const { logout, user } = useAuthStore();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push("/login");
    };

    return (
        <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur-xl">
            <div className="flex h-20 items-center justify-between px-8">
                <div className="flex items-center gap-2">
                    <span className="font-black text-xl tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        School Management System
                    </span>
                </div>

                <div className="flex items-center gap-6">
                    <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-xl hover:bg-slate-100">
                        <Bell className="h-5 w-5 text-slate-400" />
                        <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-blue-500 ring-4 ring-white" />
                    </Button>

                    <div className="flex items-center gap-4 pl-6 border-l border-slate-200">
                        <div className="flex flex-col items-end text-right hidden md:flex">
                            <span className="text-sm font-black text-slate-900 leading-none">
                                {user?.name || "Administrator"}
                            </span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                {user?.role?.replace('_', ' ') || "Admin"}
                            </span>
                        </div>
                        <Avatar className="h-10 w-10 border border-slate-200 ring-2 ring-blue-500/10 transition-all hover:ring-blue-500/30">
                            <AvatarImage src={user?.photo} />
                            <AvatarFallback className="bg-blue-500/10 text-blue-600 font-black">
                                {user?.name?.charAt(0) || "A"}
                            </AvatarFallback>
                        </Avatar>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleLogout}
                            className="h-10 w-10 rounded-xl hover:bg-red-50 transition-all group"
                        >
                            <LogOut className="h-5 w-5 text-slate-400 group-hover:text-red-500 transition-colors" />
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    );
}
