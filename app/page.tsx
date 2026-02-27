"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  GraduationCap,
  Users,
  Banknote,
  Bus,
  CalendarDays,
  BarChart3,
  ArrowRight,
  School,
  ShieldCheck,
  Play,
  BookOpen,
  BookOpenCheck,
} from "lucide-react";
import { AnimatedDashboardMock } from "@/components/landing/animated-dashboard-mock";
import { AnimatedFeesMock } from "@/components/landing/animated-fees-mock";
import { AnimatedStudentsMock } from "@/components/landing/animated-students-mock";
import { DemoMedia } from "@/components/landing/demo-media";

const features = [
  { title: "Student Management", description: "Enrollments, class & section, academic records, and promotions.", icon: GraduationCap },
  { title: "Staff & Payroll", description: "Personnel, salary structure, monthly payroll, and bonus tracking.", icon: Users },
  { title: "Fees & Accounting", description: "Fee structures, collections, ledger, and outstanding tracking.", icon: Banknote },
  { title: "Transport Management", description: "Buses, routes, and student transport assignments.", icon: Bus },
  { title: "Exams & Results", description: "Exam schedules, marks entry, admit cards, and result management.", icon: CalendarDays },
  { title: "Reports & Analytics", description: "Dashboards, fee trends, and institutional insights.", icon: BarChart3 },
];

const steps = [
  { step: 1, title: "Register your school", text: "Create your institution and add admin details." },
  { step: 2, title: "Configure classes & fees", text: "Set up sessions, fee structures, and transport." },
  { step: 3, title: "Enroll students & staff", text: "Add students and staff; manage payroll and fees." },
  { step: 4, title: "Run daily operations", text: "Collect fees, conduct exams, and publish results." },
];

const DEMOS = [
  {
    id: "dashboard",
    title: "Dashboard at a glance",
    description: "Stats, fee trends, and recent activity in one view.",
    videoSrc: "/demos/dashboard.mp4",
    gifSrc: "/hero-preview.gif",
    fallback: <AnimatedDashboardMock />,
  },
  {
    id: "fees",
    title: "Fee collection",
    description: "Collect fees, print receipts, and track defaulters.",
    videoSrc: "/demos/fees.mp4",
    gifSrc: "/demos/fees.gif",
    fallback: <AnimatedFeesMock />,
  },
  {
    id: "students",
    title: "Student management",
    description: "Enroll students, manage classes, and track progress.",
    videoSrc: "/demos/students.mp4",
    gifSrc: "/demos/students.gif",
    fallback: <AnimatedStudentsMock />,
  },
];

export default function LandingPage() {
  const [heroVideoLoaded, setHeroVideoLoaded] = useState(false);
  const [heroGifLoaded, setHeroGifLoaded] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const showHeroMedia = heroVideoLoaded || heroGifLoaded;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      {/* Navbar: embedded, shrinks on scroll for modern feel */}
      <header
        className={`sticky top-0 z-50 border-b bg-[hsl(var(--card))] transition-all duration-200 ${
          scrolled ? "border-[hsl(var(--border))] shadow-card" : "border-transparent"
        }`}
      >
        <div className={`mx-auto flex max-w-6xl items-center justify-between px-4 transition-all duration-200 ${scrolled ? "h-12" : "h-14"}`}>
          <Link href="/" className="flex items-center gap-2 text-[hsl(var(--foreground))] transition-smooth hover:opacity-80">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--primary))] text-white">
              <School className="h-4 w-4" />
            </div>
            <span className="font-semibold tracking-tight">SMS</span>
          </Link>
          <nav className="flex items-center gap-3 text-sm font-medium text-[hsl(var(--muted-foreground))]">
            <Link href="#features" className="transition-smooth hover:text-[hsl(var(--foreground))] hidden md:block">Features</Link>
            <Link href="#demos" className="transition-smooth hover:text-[hsl(var(--foreground))] hidden md:block">Demos</Link>
            <Link
              href="/student/login"
              className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 transition-smooth hover:bg-indigo-100 hidden sm:inline-flex"
            >
              <GraduationCap className="h-4 w-4" />
              Student
            </Link>
            <Link
              href="/teacher/login"
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 transition-smooth hover:bg-emerald-100 hidden sm:inline-flex"
            >
              <BookOpenCheck className="h-4 w-4" />
              Teacher
            </Link>
            <Link
              href="/login?portal=school"
              className="rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-white transition-smooth hover:opacity-90"
            >
              School Login
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero – minimal, generous whitespace */}
        <section className="relative overflow-hidden py-28 sm:py-36">
          <div className="absolute inset-0 bg-[hsl(var(--background))]" />
          <div className="relative mx-auto max-w-4xl px-4 text-center">
            <span className="animate-fade-in-up inline-block h-2 w-2 rounded-full bg-[hsl(var(--foreground))]/60" aria-hidden />
            <p className="animate-fade-in-up animation-delay-100 mt-4 text-sm font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
              School Management System
            </p>
            <h1 className="animate-fade-in-up animation-delay-200 mt-6 text-4xl font-bold tracking-tight text-[hsl(var(--foreground))] sm:text-5xl md:text-6xl">
              One platform.
              <br />
              <span className="text-[hsl(var(--primary))]">Every school need.</span>
            </h1>
            <p className="animate-fade-in-up animation-delay-300 mx-auto mt-6 max-w-lg text-base text-[hsl(var(--muted-foreground))] leading-relaxed">
              Admissions, fees, payroll, transport, and exams—built for clarity and control.
            </p>
            <div className="animate-fade-in-up animation-delay-400 mt-12 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/login?portal=school"
                className="group inline-flex items-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-6 py-3.5 text-sm font-semibold text-white transition-smooth hover:opacity-90"
              >
                School Login
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/student/login"
                className="group inline-flex items-center gap-2 rounded-xl border-2 border-indigo-200 bg-indigo-50 px-6 py-3.5 text-sm font-semibold text-indigo-700 transition-smooth hover:bg-indigo-100 hover:border-indigo-300"
              >
                <GraduationCap className="h-4 w-4" />
                Student Login
              </Link>
              <Link
                href="/teacher/login"
                className="group inline-flex items-center gap-2 rounded-xl border-2 border-emerald-200 bg-emerald-50 px-6 py-3.5 text-sm font-semibold text-emerald-700 transition-smooth hover:bg-emerald-100 hover:border-emerald-300"
              >
                <BookOpenCheck className="h-4 w-4" />
                Teacher Login
              </Link>
              <Link
                href="/login?portal=master"
                className="inline-flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-5 py-3.5 text-sm font-medium text-[hsl(var(--muted-foreground))] transition-smooth hover:bg-[hsl(var(--muted))] shadow-card"
              >
                <ShieldCheck className="h-4 w-4" />
                Master Admin
              </Link>
            </div>
            {/* Hero visual */}
            <div className="animate-fade-in-up animation-delay-500 relative mx-auto mt-20 max-w-5xl" style={{ animationFillMode: "both" }}>
              <div className="overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-card">
                <div className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]/50 px-4 py-2.5">
                  <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Dashboard</span>
                </div>
                <div className="relative aspect-[16/9] bg-[hsl(var(--muted))]/30">
                  <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    className={`absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-500 ${heroVideoLoaded ? "opacity-100" : "opacity-0"}`}
                    onLoadedData={() => setHeroVideoLoaded(true)}
                  >
                    <source src="/demos/hero.mp4" type="video/mp4" />
                  </video>
                  <img
                    src="/hero-preview.gif"
                    alt=""
                    className={`absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-500 ${!heroVideoLoaded && heroGifLoaded ? "opacity-100" : "opacity-0"}`}
                    onLoad={() => setHeroGifLoaded(true)}
                  />
                  <div className={`absolute inset-0 transition-opacity duration-500 ${showHeroMedia ? "opacity-0 pointer-events-none" : "opacity-100"}`} aria-hidden={showHeroMedia}>
                    <AnimatedDashboardMock />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Demos – soft shadows, accent underline */}
        <section id="demos" className="relative py-28 sm:py-32">
          <div className="mx-auto max-w-6xl px-4">
            <div className="text-center">
              <Link
                href="#demos"
                className="animate-fade-in-up inline-flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-5 py-2.5 text-sm font-medium text-[hsl(var(--foreground))] shadow-card transition-smooth hover:bg-[hsl(var(--muted))]"
              >
                <Play className="h-4 w-4 text-[hsl(var(--primary))]" />
                See it in action
              </Link>
              <h2 className="animate-fade-in-up animation-delay-100 mt-10 text-3xl font-bold tracking-tight text-[hsl(var(--foreground))] sm:text-4xl">
                Your school, running on SMS
              </h2>
              <span className="animate-fade-in-up animation-delay-100 mx-auto mt-3 block h-1 w-12 rounded-full bg-[hsl(var(--primary))]/80" />
              <p className="animate-fade-in-up animation-delay-200 mx-auto mt-6 max-w-xl text-base text-[hsl(var(--muted-foreground))]">
                Dashboard, fee collection, and student management in one place.
              </p>
            </div>
            <div className="mt-16 grid gap-8 sm:grid-cols-1 lg:grid-cols-3">
              {DEMOS.map((d, i) => (
                <div
                  key={d.id}
                  className="animate-fade-in-up flex flex-col rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden shadow-card transition-smooth hover-lift animation-fill-both"
                  style={{ animationDelay: `${200 + i * 80}ms` }}
                >
                  <div className="relative h-[300px] shrink-0 overflow-hidden bg-[hsl(var(--muted))]/30">
                    <DemoMedia videoSrc={d.videoSrc} gifSrc={d.gifSrc} className="h-full w-full" compact={d.id === "dashboard"}>
                      {d.fallback}
                    </DemoMedia>
                  </div>
                  <div className="shrink-0 border-t border-[hsl(var(--border))] px-6 py-5">
                    <h3 className="text-lg font-bold text-[hsl(var(--foreground))]">{d.title}</h3>
                    <span className="mt-2 block h-0.5 w-8 rounded-full bg-[hsl(var(--primary))]/60" />
                    <p className="mt-3 text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">{d.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features – cards with soft shadow, optional left accent */}
        <section id="features" className="relative border-t border-[hsl(var(--border))] py-28 sm:py-32">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="animate-fade-in-up text-center text-3xl font-bold tracking-tight text-[hsl(var(--foreground))] sm:text-4xl">
              Everything your school needs
            </h2>
            <span className="animate-fade-in-up animation-delay-100 mx-auto mt-3 block h-1 w-12 rounded-full bg-[hsl(var(--primary))]/80" />
            <p className="animate-fade-in-up animation-delay-100 mx-auto mt-6 max-w-xl text-center text-base text-[hsl(var(--muted-foreground))]">
              One place for students, staff, fees, transport, and exams.
            </p>
            <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f, i) => (
                <div
                  key={f.title}
                  className="animate-fade-in-up relative rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-7 pl-8 shadow-card transition-smooth hover-lift"
                  style={{ animationDelay: `${120 + i * 60}ms`, animationFillMode: "both" }}
                >
                  <span className="absolute left-0 top-6 bottom-6 w-0.5 rounded-r-full bg-[hsl(var(--primary))]/30" aria-hidden />
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]">
                    <f.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-[hsl(var(--foreground))]">{f.title}</h3>
                  <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* School dashboard guide – what you can do after login */}
        <section id="dashboard-guide" className="relative border-t border-[hsl(var(--border))] py-28 sm:py-32">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="animate-fade-in-up text-center text-3xl font-bold tracking-tight text-[hsl(var(--foreground))] sm:text-4xl">
              Your school dashboard – quick guide
            </h2>
            <span className="animate-fade-in-up animation-delay-100 mx-auto mt-3 block h-1 w-12 rounded-full bg-[hsl(var(--primary))]/80" />
            <p className="animate-fade-in-up animation-delay-100 mx-auto mt-6 max-w-xl text-center text-base text-[hsl(var(--muted-foreground))]">
              After you log in, here’s what you can do from the school dashboard. Your data is private to your school only.
            </p>
            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { title: 'Dashboard', text: 'View stats, fee trends, and recent activity at a glance.' },
                { title: 'Students', text: 'Enroll students, assign class & section, and manage records.' },
                { title: 'Classes & sections', text: 'Create classes and sections (e.g. Class 5 – Section A).' },
                { title: 'Sessions', text: 'Create academic sessions and set start/end dates.' },
                { title: 'Fees', text: 'Set fee structures per class, collect fees, print receipts, track defaulters.' },
                { title: 'Staff & payroll', text: 'Add teachers and staff, set salary structure, run monthly payroll.' },
                { title: 'Timetable', text: 'Create and print timetables per class/section.' },
                { title: 'Exams & results', text: 'Create exams, enter marks, generate admit cards and results.' },
                { title: 'Transport', text: 'Manage buses, routes, and student transport assignments.' },
                { title: 'Plan & billing', text: 'View your subscription and upgrade or manage billing.' },
                { title: 'AI assistant', text: 'Ask questions in plain language; answers use only your school’s data.' },
              ].map((item, i) => (
                <div
                  key={item.title}
                  className="animate-fade-in-up rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-card transition-smooth hover-lift"
                  style={{ animationDelay: `${120 + i * 40}ms`, animationFillMode: 'both' }}
                >
                  <h3 className="font-bold text-[hsl(var(--foreground))]">{item.title}</h3>
                  <span className="mt-2 block h-0.5 w-8 rounded-full bg-[hsl(var(--primary))]/60" />
                  <p className="mt-3 text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="relative border-t border-[hsl(var(--border))] py-28 sm:py-32">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="animate-fade-in-up text-center text-3xl font-bold tracking-tight text-[hsl(var(--foreground))] sm:text-4xl">
              How it works
            </h2>
            <span className="animate-fade-in-up animation-delay-100 mx-auto mt-3 block h-1 w-12 rounded-full bg-[hsl(var(--primary))]/80" />
            <p className="animate-fade-in-up animation-delay-100 mx-auto mt-6 max-w-xl text-center text-base text-[hsl(var(--muted-foreground))]">
              Get your school online in four steps.
            </p>
            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((s, i) => (
                <div
                  key={s.step}
                  className="animate-fade-in-up flex gap-5 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-card transition-smooth hover-lift"
                  style={{ animationDelay: `${180 + i * 80}ms`, animationFillMode: "both" }}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--muted))] text-base font-bold text-[hsl(var(--foreground))]">
                    {s.step}
                  </span>
                  <div>
                    <h3 className="font-bold text-[hsl(var(--foreground))]">{s.title}</h3>
                    <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">{s.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-[hsl(var(--border))] py-28 sm:py-32">
          <div className="mx-auto max-w-2xl px-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-[hsl(var(--foreground))] sm:text-4xl">
              Ready to get started?
            </h2>
            <span className="mx-auto mt-3 block h-1 w-12 rounded-full bg-[hsl(var(--primary))]/80" />
            <p className="mt-6 text-base text-[hsl(var(--muted-foreground))]">
              Log in or register your institution.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/login?portal=school"
                className="inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-5 py-2.5 text-sm font-medium text-white transition-smooth hover:opacity-90"
              >
                <School className="h-4 w-4" />
                School Login
              </Link>
              <Link
                href="/student/login"
                className="inline-flex items-center gap-2 rounded-lg border-2 border-indigo-200 bg-indigo-50 px-5 py-2.5 text-sm font-medium text-indigo-700 transition-smooth hover:bg-indigo-100"
              >
                <GraduationCap className="h-4 w-4" />
                Student Login
              </Link>
              <Link
                href="/teacher/login"
                className="inline-flex items-center gap-2 rounded-lg border-2 border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-medium text-emerald-700 transition-smooth hover:bg-emerald-100"
              >
                <BookOpenCheck className="h-4 w-4" />
                Teacher Login
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-5 py-2.5 text-sm font-medium text-[hsl(var(--foreground))] transition-smooth hover:bg-[hsl(var(--muted))]"
              >
                Register school
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[hsl(var(--border))] bg-[hsl(var(--card))] py-10">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[hsl(var(--primary))] text-white">
                <School className="h-3.5 w-3.5" />
              </div>
              <span className="font-semibold text-[hsl(var(--foreground))] text-sm">SMS</span>
            </div>
            <nav className="flex flex-wrap items-center justify-center gap-5 text-sm text-[hsl(var(--muted-foreground))]">
              <Link href="#features" className="transition-smooth hover:text-[hsl(var(--foreground))]">Features</Link>
              <Link href="#demos" className="transition-smooth hover:text-[hsl(var(--foreground))]">Demos</Link>
              <Link href="#how-it-works" className="transition-smooth hover:text-[hsl(var(--foreground))]">How it works</Link>
              <Link href="#dashboard-guide" className="transition-smooth hover:text-[hsl(var(--foreground))]">Dashboard guide</Link>
              <Link href="/login" className="transition-smooth hover:text-[hsl(var(--foreground))]">Login</Link>
            </nav>
          </div>
          <p className="mt-6 text-center text-xs text-[hsl(var(--muted-foreground))]">
            &copy; {new Date().getFullYear()} School Management System
          </p>
        </div>
      </footer>
    </div>
  );
}
