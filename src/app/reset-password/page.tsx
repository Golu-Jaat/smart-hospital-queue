"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { resetPassword } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingLink, setCheckingLink] = useState(true);
  const [canReset, setCanReset] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  useEffect(() => {
    let active = true;
    let timeoutId: ReturnType<typeof setTimeout>;

    const getUrlAuthError = () => {
      const hash = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash;
      const hashParams = new URLSearchParams(hash);
      const queryParams = new URLSearchParams(window.location.search);

      return (
        hashParams.get("error_description") ||
        queryParams.get("error_description") ||
        hashParams.get("error") ||
        queryParams.get("error")
      );
    };

    const markReady = () => {
      if (!active) return;
      setCanReset(true);
      setCheckingLink(false);
      setError("");
    };

    const markInvalid = (message: string) => {
      if (!active) return;
      setCanReset(false);
      setCheckingLink(false);
      setError(message);
    };

    const checkSession = async () => {
      const urlError = getUrlAuthError();
      if (urlError) {
        markInvalid(decodeURIComponent(urlError.replace(/\+/g, " ")));
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        markReady();
        return;
      }

      timeoutId = setTimeout(async () => {
        const {
          data: { session: latestSession },
        } = await supabase.auth.getSession();

        if (latestSession) {
          markReady();
        } else {
          markInvalid(
            "Reset link expired or invalid. Please request a new password reset link.",
          );
        }
      }, 2500);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        markReady();
      }
    });

    checkSession();

    return () => {
      active = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

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

        {checkingLink && (
          <div className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 p-3 rounded mb-4 text-sm border border-blue-200 dark:border-blue-900/50">
            Checking reset link...
          </div>
        )}
        {error && (
          <div className="bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-3 rounded mb-4 text-sm border border-red-200 dark:border-red-900/50">
            {error}{" "}
            {!canReset && (
              <Link href="/forgot-password" className="font-semibold underline">
                Send a new link
              </Link>
            )}
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
            disabled={!canReset || loading}
            className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-700 dark:text-white"
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            disabled={!canReset || loading}
            className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-700 dark:text-white"
          />
          <button
            onClick={handleReset}
            disabled={loading || !canReset || !password || !confirm}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </div>
      </div>
    </div>
  );
}
