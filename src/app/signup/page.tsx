"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async () => {
    setLoading(true);
    setError("");

    if (!isSupabaseConfigured) {
      setError("Supabase environment variables are missing in .env.local.");
      setLoading(false);
      return;
    }

    const { error: signupError } = await signUp(email, password, fullName, phone);

    if (signupError) {
      setError(signupError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    router.push("/patient/dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center px-4 transition-colors">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-md w-full max-w-md border border-slate-200 dark:border-slate-800">
        <h1 className="text-2xl font-bold text-center text-blue-600 dark:text-blue-400 mb-6">
          Smart Hospital - Sign Up
        </h1>
        {error && (
          <div className="bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-3 rounded mb-4 text-sm border border-red-200 dark:border-red-900/50">
            {error}
          </div>
        )}
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 dark:bg-slate-700 dark:text-white"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 dark:bg-slate-700 dark:text-white"
          />
          <input
            type="tel"
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 dark:bg-slate-700 dark:text-white"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 dark:bg-slate-700 dark:text-white"
          />
          <button
            onClick={handleSignup}
            disabled={loading || !email || !password || !fullName}
            className="w-full rounded-lg bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </div>
        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
