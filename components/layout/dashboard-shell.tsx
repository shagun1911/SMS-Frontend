"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileMenuProvider, useMobileMenu } from "@/components/layout/mobile-menu-context";
import { AiChat } from "@/components/ai/ai-chat";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function MobileDrawer() {
    const { open, setOpen } = useMobileMenu();
    const pathname = usePathname();

    useEffect(() => {
        setOpen(false);
    }, [pathname, setOpen]);

    useEffect(() => {
        if (open) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [open]);

    return (
        <>
            <div
                className={cn(
                    "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-200 md:hidden",
                    open ? "opacity-100" : "pointer-events-none opacity-0"
                )}
                aria-hidden
                onClick={() => setOpen(false)}
            />
            <div
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] border-r border-slate-200 bg-slate-50/95 shadow-xl transition-transform duration-200 ease-out md:hidden",
                    open ? "translate-x-0" : "-translate-x-full"
                )}
                role="dialog"
                aria-label="Navigation menu"
            >
                <div className="flex h-14 items-center justify-between border-b border-slate-200 px-4">
                    <span className="text-base font-bold text-slate-900">Menu</span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-xl"
                        onClick={() => setOpen(false)}
                        aria-label="Close menu"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>
                <div className="h-[calc(100vh-3.5rem)] overflow-y-auto">
                    <Sidebar className="h-full border-0" />
                </div>
            </div>
        </>
    );
}

function ShellContent({ children }: { children: React.ReactNode }) {
    return (
        <>
            <div className="flex h-screen overflow-hidden bg-[hsl(var(--background))]">
                {/* Desktop sidebar */}
                <div className="hidden w-64 shrink-0 border-r md:block">
                    <Sidebar className="h-full" />
                </div>

                {/* Main content */}
                <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                    <Header />
                    <main className="flex-1 overflow-x-auto overflow-y-auto bg-gradient-to-br from-[hsl(var(--background))] via-[hsl(var(--background))] to-violet-50/30 p-4 md:p-6 lg:p-8 overscroll-behavior-contain">{children}</main>
                </div>
            </div>
            <MobileDrawer />
            <AiChat />
        </>
    );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
    return (
        <MobileMenuProvider>
            <ShellContent>{children}</ShellContent>
        </MobileMenuProvider>
    );
}
