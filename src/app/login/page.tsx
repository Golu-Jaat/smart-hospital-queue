"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn, getUserProfile } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { UserRole } from "@/types/database";

const roleRoutes: Record<UserRole, string> = {
  patient: "/patient/dashboard",
  doctor: "/doctor/dashboard",
  admin: "/admin/dashboard",
  super_admin: "/admin/dashboard",
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    if (!isSupabaseConfigured) {
      setError("Supabase environment variables are missing in .env.local.");
      setLoading(false);
      return;
    }

    const { data, error: loginError } = await signIn(email, password);

    if (loginError || !data.user) {
      setError(loginError?.message || "Login failed.");
      setLoading(false);
      return;
    }

    const { data: profile } = await getUserProfile(data.user.id);
    const role = (profile?.role || "patient") as UserRole;
    router.push(roleRoutes[role]);
    setLoading(false);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8">
        <h1 className="text-center text-2xl font-bold text-blue-700">Login</h1>
        {error && (
          <div className="mt-5 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="mt-6 grid gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-4 py-2"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-4 py-2"
          />
          <button
            onClick={handleLogin}
            disabled={loading || !email || !password}
            className="rounded-lg bg-blue-700 py-2 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </div>
        <p className="text-right text-sm mb-2">
          <Link
            href="/forgot-password"
            className="text-blue-600 hover:underline"
          >
            Forgot Password?
          </Link>
        </p>
        <p className="mt-4 text-center text-sm text-slate-500">
          New patient?{" "}
          <Link href="/signup" className="text-blue-700 hover:underline">
            Create an account
          </Link>
        </p>
      </section>
    </main>
  );
}
