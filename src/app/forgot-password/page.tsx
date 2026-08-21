"use client";

import { useState } from "react";
import { forgotPassword } from "@/lib/auth";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    const { error } = await forgotPassword(email);

    if (error) {
      setError(error.message);
    } else {
      setSuccess("Password reset link sent! Check your email.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center px-4 transition-colors">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-md w-full max-w-md border border-slate-200 dark:border-slate-800">
        <h1 className="text-2xl font-bold text-center text-blue-600 dark:text-blue-400 mb-2">
          Forgot Password
        </h1>
        <p className="text-center text-slate-500 dark:text-slate-400 text-sm mb-6">
          Enter your email — we will send a reset link!
        </p>

        {error && (
          <div className="bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-3 rounded mb-4 text-sm border border-red-200 dark:border-red-900/50">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400 p-3 rounded mb-4 text-sm border border-green-200 dark:border-green-900/50">
            {success}
          </div>
        )}

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Your Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-700 dark:text-white"
          />
          <button
            onClick={handleSubmit}
            disabled={loading || !email}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </div>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-4">
          Remember password?{" "}
          <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
