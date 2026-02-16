"use client";

import Image from "next/image";
import Link from "next/link";
import {
  GraduationCap,
  Users,
  Banknote,
  Bus,
  CalendarDays,
  FileText,
  BarChart3,
  ArrowRight,
  School,
  ShieldCheck,
} from "lucide-react";

const features = [
  {
    title: "Student Management",
    description: "Enrollments, class & section, academic records, and promotions.",
    icon: GraduationCap,
  },
  {
    title: "Staff & Payroll",
    description: "Personnel, salary structure, monthly payroll, and bonus tracking.",
    icon: Users,
  },
  {
    title: "Fees & Accounting",
    description: "Fee structures, collections, ledger, and outstanding tracking.",
    icon: Banknote,
  },
  {
    title: "Transport Management",
    description: "Buses, routes, and student transport assignments.",
    icon: Bus,
  },
  {
    title: "Attendance & Exams",
    description: "Daily attendance, exam schedules, and result management.",
    icon: CalendarDays,
  },
  {
    title: "Reports & Analytics",
    description: "Dashboards, fee trends, and institutional insights.",
    icon: BarChart3,
  },
];

const steps = [
  { step: 1, title: "Register your school", text: "Create your institution and add admin details." },
  { step: 2, title: "Configure classes & fees", text: "Set up sessions, fee structures, and transport." },
  { step: 3, title: "Enroll students & staff", text: "Add students and staff; manage payroll and fees." },
  { step: 4, title: "Run daily operations", text: "Take attendance, collect fees, and publish results." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Hero */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
            <div className="flex items-center gap-2">
            <div className="relative h-9 w-9">
              <Image src="/logo.png" alt="SSMS" fill className="object-contain" sizes="36px" />
            </div>
            <span className="text-xl font-semibold tracking-tight text-gray-900">SSMS</span>
          </div>
          <nav className="flex items-center gap-6 text-sm font-medium text-gray-600">
            <Link href="#features" className="hover:text-indigo-600 transition-colors">Features</Link>
            <Link href="#how-it-works" className="hover:text-indigo-600 transition-colors">How it works</Link>
            <Link href="/login" className="hover:text-indigo-600 transition-colors">Login</Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-gray-200 bg-white py-20 sm:py-28">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/50" />
          <div className="relative mx-auto max-w-6xl px-4 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
              Shagun School Management System
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
              One platform for admissions, fees, payroll, attendance, and exams. Built for schools that want clarity and control.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/login?portal=school"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
              >
                Login as School
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login?portal=master"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-gray-300 bg-white px-6 py-3.5 text-base font-semibold text-gray-700 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
              >
                <ShieldCheck className="h-4 w-4" />
                Master Admin
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything your school needs
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-gray-600">
              Student management, staff payroll, fees, transport, attendance, and exams in one place.
            </p>
            <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                    <f.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">{f.title}</h3>
                  <p className="mt-2 text-gray-600">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="border-t border-gray-200 bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              How it works
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-gray-600">
              Get your school online in a few steps.
            </p>
            <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((s) => (
                <div key={s.step} className="relative rounded-2xl border border-gray-200 bg-gray-50/50 p-6">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
                    {s.step}
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">{s.title}</h3>
                  <p className="mt-2 text-gray-600">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-gray-200 py-20 sm:py-24">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              Ready to get started?
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Log in to your school dashboard or register a new institution.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/login?portal=school"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
              >
                <School className="h-4 w-4" />
                School Login
              </Link>
              <Link
                href="/login?portal=master"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-6 py-3.5 text-base font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Master Admin
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="relative h-6 w-6">
                <Image src="/logo.png" alt="SSMS" fill className="object-contain" sizes="24px" />
              </div>
              <span className="font-semibold text-gray-900">SSMS</span>
            </div>
            <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
              <Link href="#features" className="hover:text-indigo-600 transition-colors">Features</Link>
              <Link href="#how-it-works" className="hover:text-indigo-600 transition-colors">How it works</Link>
              <Link href="/login" className="hover:text-indigo-600 transition-colors">Login</Link>
              <span className="text-gray-400">|</span>
              <span className="text-gray-500">About</span>
              <span className="text-gray-500">Contact</span>
              <span className="text-gray-500">Terms</span>
            </nav>
          </div>
          <p className="mt-8 text-center text-xs text-gray-500">
            &copy; {new Date().getFullYear()} Shagun Systems. Enterprise-grade security.
          </p>
        </div>
      </footer>
    </div>
  );
}
