"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn, getUserProfile } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase";
import { isKnownRole, roleRoutes } from "@/lib/roles";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    if (!isSupabaseConfigured) {
      setError("Supabase environment variables are missing in .env.local.");
      setLoading(false);
      return;
    }

    try {
      const { data, error: loginError } = await signIn(email, password);

      if (loginError || !data?.user) {
        const message = loginError?.message || "Login failed.";
        setError(
          /invalid login credentials/i.test(message)
            ? "Email or password is incorrect. Use Forgot Password to set a new password."
            : message,
        );
        return;
      }

      const { data: profile, error: profileError } = await getUserProfile(data.user.id);
      const role = profile?.role;
      if (profileError || !isKnownRole(role)) {
        setError(profileError?.message || "Your account role is unavailable. Please try again.");
        return;
      }

      // A full navigation clears any protected-route redirect prefetched before login.
      window.location.replace(roleRoutes[role]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900 px-4 transition-colors">
      <section className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 p-8 shadow-sm">
        <h1 className="text-center text-2xl font-bold text-blue-700 dark:text-blue-400">Login</h1>
        {error && (
          <div className="mt-5 rounded-md bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/50">
            {error}
          </div>
        )}
        <form onSubmit={handleLogin} className="mt-6 grid gap-4">
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 dark:bg-slate-700 dark:text-white"
          />
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            required
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 dark:bg-slate-700 dark:text-white"
          />
          <button
            type="submit"
            disabled={loading || !email || !password}
            className="rounded-lg bg-blue-700 py-2 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <p className="text-right text-sm mb-2 mt-3">
          <Link
            href="/forgot-password"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Forgot Password?
          </Link>
        </p>
        <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
          New patient?{" "}
          <Link href="/signup" className="text-blue-700 dark:text-blue-400 hover:underline">
            Create an account
          </Link>
        </p>
      </section>
    </main>
  );
}
