"use client";

import Image from "next/image";
import Link from "next/link";
import { MoveRight, School, ShieldAlert, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#050505] text-white">
      {/* Background Orbs */}
      <div className="absolute -top-[10%] -left-[10%] h-[500px] w-[500px] rounded-full bg-blue-600/20 blur-[120px]" />
      <div className="absolute top-[20%] -right-[10%] h-[400px] w-[400px] rounded-full bg-purple-600/20 blur-[120px]" />

      <main className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center px-6 py-20 text-center">
        {/* Logo Section */}
        <div className="mb-12 animate-in fade-in slide-in-from-bottom-10 duration-1000">
          <div className="relative h-32 w-32 mx-auto mb-6 transition-transform hover:scale-110 duration-500">
            <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl animate-pulse" />
            <Image
              src="/logo.png" // Fallback to Next logo for now, but I'll update it to use the AI one if possible
              alt="SSMS Logo"
              fill
              className="object-contain"
            />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
            SSMS
          </h1>
          <p className="mt-4 text-lg text-zinc-400 max-w-2xl mx-auto">
            Shagun School Management System.
            Elevating education through seamless management and intelligent insights.
          </p>
        </div>

        {/* Portal Selection Cards */}
        <div className="grid w-full grid-cols-1 gap-8 md:grid-cols-2 mt-12 animate-in fade-in zoom-in duration-1000 delay-300">

          {/* Master Admin Portal */}
          <Link
            href="/login?portal=master"
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 transition-all hover:bg-white/[0.08] hover:border-blue-500/50"
          >
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl transition-all group-hover:bg-blue-500/20" />

            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30 group-hover:scale-110 group-hover:rotate-3 transition-transform">
              <ShieldAlert className="h-7 w-7" />
            </div>

            <div className="text-left">
              <h2 className="mb-2 text-2xl font-bold">Master Admin</h2>
              <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                System-wide control, tenant provisioning, and global intelligence.
                Accessible only to platform architects.
              </p>

              <div className="flex items-center gap-2 text-blue-400 font-medium group-hover:translate-x-2 transition-transform">
                Enter Control Center <MoveRight className="h-4 w-4" />
              </div>
            </div>
          </Link>

          {/* School Management Portal */}
          <Link
            href="/login?portal=school"
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 transition-all hover:bg-white/[0.08] hover:border-purple-500/50"
          >
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-purple-500/10 blur-3xl transition-all group-hover:bg-purple-500/20" />

            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-400 ring-1 ring-purple-500/30 group-hover:scale-110 group-hover:-rotate-3 transition-transform">
              <School className="h-7 w-7" />
            </div>

            <div className="text-left">
              <h2 className="mb-2 text-2xl font-bold">School Ecosystem</h2>
              <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                Integrated management for institutions. Login to your dashboard
                or register a new school to join the network.
              </p>

              <div className="flex items-center gap-2 text-purple-400 font-medium group-hover:translate-x-2 transition-transform">
                Access Institution Portal <MoveRight className="h-4 w-4" />
              </div>
            </div>
          </Link>

        </div>

        {/* Floating Features Badge */}
        <div className="mt-24 flex items-center gap-4 rounded-full border border-white/5 bg-white/5 px-6 py-3 backdrop-blur-md animate-bounce slow">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-amber-500 ring-1 ring-amber-500/30">
            <Zap className="h-3 w-3 fill-current" />
          </div>
          <span className="text-sm font-medium text-zinc-300">Powering educational institutions across the SSMS Network</span>
        </div>

        <footer className="mt-auto pt-20 pb-10 text-zinc-500 text-xs tracking-widest uppercase">
          &copy; 2026 Shagun Systems &bull; Enterprise Grade Security &bull; v2.0.4-LTS
        </footer>
      </main>

      {/* Modern Mesh Grid Overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-150 contrast-150" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
    </div>
  );
}
