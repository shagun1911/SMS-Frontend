"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

type MobileMenuContextValue = {
    open: boolean;
    setOpen: (v: boolean) => void;
    toggle: () => void;
};

const MobileMenuContext = createContext<MobileMenuContextValue | null>(null);

export function MobileMenuProvider({ children }: { children: ReactNode }) {
    const [open, setOpen] = useState(false);
    const toggle = useCallback(() => setOpen((prev) => !prev), []);
    return (
        <MobileMenuContext.Provider value={{ open, setOpen, toggle }}>
            {children}
        </MobileMenuContext.Provider>
    );
}

export function useMobileMenu() {
    const ctx = useContext(MobileMenuContext);
    if (!ctx) return { open: false, setOpen: () => {}, toggle: () => {} };
    return ctx;
}
