"use client";

import Link from "next/link";
import { Smartphone, ArrowLeft } from "lucide-react";

interface AppDownloadInfoProps {
  role: "teacher" | "student";
  backHref?: string;
}

export function AppDownloadInfo({ role, backHref = "/" }: AppDownloadInfoProps) {
  const isTeacher = role === "teacher";
  const title = isTeacher ? "Teacher Portal" : "Student Portal";
  const subtitle = isTeacher
    ? "Teacher and student sign-in is now available only in the mobile app."
    : "Student sign-in is now available only in the mobile app.";
  return (
    <div className={`min-h-screen bg-gradient-to-br ${isTeacher ? "from-emerald-50 via-teal-50 to-green-100" : "from-blue-50 to-indigo-100"} flex items-center justify-center p-4`}>
      <div className="w-full max-w-md">
        {backHref && (
          <Link
            href={backHref}
            className={`mb-8 inline-flex items-center gap-2 text-sm font-medium ${isTeacher ? "text-emerald-700 hover:text-emerald-900" : "text-indigo-700 hover:text-indigo-900"} transition-colors`}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        )}

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className={`h-1.5 bg-gradient-to-r ${isTeacher ? "from-emerald-500 via-teal-500 to-green-500" : "from-blue-500 via-indigo-500 to-purple-500"}`} />
          <div className="p-8">
            <div className="flex justify-center mb-6">
              <div className={`flex h-20 w-20 items-center justify-center rounded-2xl ${isTeacher ? "bg-emerald-100" : "bg-indigo-100"}`}>
                <Smartphone className={`h-10 w-10 ${isTeacher ? "text-emerald-600" : "text-indigo-600"}`} />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 text-center">{title}</h1>
            <p className="text-gray-500 text-sm mt-3 text-center">{subtitle}</p>

            <div className="mt-8 space-y-4">
              <p className="text-sm font-medium text-gray-700">Download the SMS Portal app:</p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="font-medium">•</span>
                  <span>Open the <strong>App Store</strong> (iOS) or <strong>Google Play</strong> (Android).</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-medium">•</span>
                  <span>Search for <strong>&quot;SMS Portal&quot;</strong> or use the link provided by your school.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-medium">•</span>
                  <span>Install the app and open it.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-medium">•</span>
                  <span>Choose <strong>{isTeacher ? "Teacher" : "Student"}</strong> and sign in with your {isTeacher ? "registered mobile number (or school email) and password" : "username and password"}.</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 text-center">
                The app uses the same account as before. If you don’t see the app in stores yet, your school may be using a direct download or testing build. Contact your school admin for the install link.
              </p>
            </div>
          </div>

          <div className="border-t border-gray-100 bg-gray-50/60 px-8 py-5 space-y-2 text-center">
            <Link
              href="/login?portal=school"
              className="block text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium"
            >
              School Admin Login →
            </Link>
            <Link
              href="/"
              className="block text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400 uppercase tracking-wider">
          Secure access · SMS
        </p>
      </div>
    </div>
  );
}
