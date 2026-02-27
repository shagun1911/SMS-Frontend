"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import { toast } from "sonner";
import Link from "next/link";
import {
  GraduationCap,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Lock,
  BookOpen,
  ArrowLeft,
} from "lucide-react";

export default function TeacherLoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Please fill all fields");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", {
        email: email.trim().toLowerCase(),
        password,
        portal: "teacher",
      });

      const { user, accessToken, refreshToken, mustChangePassword } = data;

      if (user.role !== "teacher") {
        toast.error("Access denied", {
          description: "This portal is for teachers only. Use School Login instead.",
        });
        return;
      }

      login(
        { ...user, mustChangePassword: mustChangePassword ?? user.mustChangePassword },
        accessToken,
        refreshToken
      );
      toast.success(`Welcome back, ${user.name}!`);
      if (mustChangePassword || user.mustChangePassword) {
        router.push("/teacher/profile?changePassword=1");
      } else {
        router.push("/teacher/dashboard");
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Invalid credentials";
      toast.error("Login failed", { description: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Back link */}
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Top accent bar */}
          <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500" />

          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-2xl mb-4">
                <GraduationCap className="w-8 h-8 text-emerald-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Teacher Portal</h1>
              <span className="mx-auto mt-3 block h-0.5 w-10 rounded-full bg-emerald-400" />
              <p className="text-gray-500 text-sm mt-3">
                Sign in with your school email & password
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="teacher@school.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm transition-all"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    className="w-full pl-10 pr-11 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm transition-all"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-70 transition-colors flex items-center justify-center gap-2 mt-2 shadow-lg shadow-emerald-200"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <BookOpen className="w-4 h-4" />
                )}
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>
          </div>

          {/* Footer links */}
          <div className="border-t border-gray-100 bg-gray-50/60 px-8 py-5 space-y-2 text-center">
            <Link
              href="/student/login"
              className="block text-sm text-gray-500 hover:text-emerald-600 transition-colors"
            >
              Student Portal Login →
            </Link>
            <Link
              href="/login?portal=school"
              className="block text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              School Admin Login →
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400 uppercase tracking-wider">
          Secure login · SMS
        </p>
      </div>
    </div>
  );
}
