"use client";

import { useState } from "react";
import { resetPassword } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const handleReset = async () => {
    if (password !== confirm) {
      setError("Passwords do not match!");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters!");
      return;
    }

    setLoading(true);
    setError("");

    const { error } = await resetPassword(password);

    if (error) {
      setError(error.message);
    } else {
      setSuccess("Password reset successful!");
      setTimeout(() => router.push("/login"), 2000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center px-4 transition-colors">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-md w-full max-w-md border border-slate-200 dark:border-slate-800">
        <h1 className="text-2xl font-bold text-center text-blue-600 dark:text-blue-400 mb-2">
          Reset Password
        </h1>
        <p className="text-center text-slate-500 dark:text-slate-400 text-sm mb-6">
          Enter your new password below
        </p>

        {error && (
          <div className="bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-3 rounded mb-4 text-sm border border-red-200 dark:border-red-900/50">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400 p-3 rounded mb-4 text-sm border border-green-200 dark:border-green-900/50">
            {success} Redirecting to login...
          </div>
        )}

        <div className="space-y-4">
          <input
            type="password"
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-700 dark:text-white"
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-700 dark:text-white"
          />
          <button
            onClick={handleReset}
            disabled={loading || !password || !confirm}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </div>
      </div>
    </div>
  );
}
