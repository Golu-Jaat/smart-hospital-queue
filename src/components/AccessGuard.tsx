"use client";

import { useEffect, useState } from "react";
import { getCurrentUserRole, getCachedUserRoleSync, isRoleAuthorized, UserRole } from "@/lib/rbac";
import Link from "next/link";

interface AccessGuardProps {
  requiredRole: "admin" | "doctor" | "patient";
  children: React.ReactNode;
}

export function AccessGuard({ requiredRole, children }: AccessGuardProps) {
  // Read instant cache synchronously (0ms)
  const cached = typeof window !== "undefined" ? getCachedUserRoleSync() : null;
  const initialAuthorized = cached?.userId ? isRoleAuthorized(cached.role, requiredRole) : false;
  const initialLoggedIn = Boolean(cached?.userId);

  const [checking, setChecking] = useState(!cached); // If cache exists, 0ms delay!
  const [authorized, setAuthorized] = useState(initialAuthorized);
  const [userRole, setUserRole] = useState<UserRole>(cached?.role || "patient");
  const [isLoggedIn, setIsLoggedIn] = useState(initialLoggedIn);

  useEffect(() => {
    async function verifyAccess() {
      const user = await getCurrentUserRole();

      if (!user.userId) {
        setIsLoggedIn(false);
        setAuthorized(false);
        setChecking(false);
        return;
      }

      setIsLoggedIn(true);
      setUserRole(user.role);

      const hasAccess = isRoleAuthorized(user.role, requiredRole);
      setAuthorized(hasAccess);
      setChecking(false);
    }

    verifyAccess();
  }, [requiredRole]);

  // If checking and no initial cache, show minimal smooth loader
  if (checking && !authorized) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Loading portal...
        </p>
      </div>
    );
  }

  // Case 1: User Not Logged In
  if (!isLoggedIn && !checking) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center shadow-2xl">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 border border-amber-500/20 text-3xl flex items-center justify-center mx-auto mb-4">
            🔒
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Authentication Required</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            Please log in with your authorized hospital credentials to access the {requiredRole.toUpperCase()} portal.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link
              href="/login"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md"
            >
              Sign In to Continue →
            </Link>
            <Link
              href="/"
              className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Case 2: User Logged In But Unauthorized (e.g. Patient trying to open Admin or Doctor Dashboard)
  if (!authorized && !checking) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <div className="max-w-lg w-full rounded-3xl border border-red-200 dark:border-red-900/50 bg-white dark:bg-slate-900 p-8 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-500 to-rose-600" />
          
          <div className="w-16 h-16 rounded-3xl bg-red-500/10 text-red-500 border border-red-500/20 text-3xl flex items-center justify-center mx-auto mb-4">
            ⛔
          </div>
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-[11px] font-bold uppercase tracking-wider mb-2">
            <span>403 Access Forbidden</span>
          </div>

          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            Access Restricted
          </h2>

          <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
            This portal is restricted exclusively to <strong>{requiredRole.toUpperCase()}</strong> accounts.
          </p>

          <div className="my-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-left">
            <p>• <strong>Your Current Role:</strong> <span className="uppercase font-bold text-blue-600 dark:text-blue-400">{userRole}</span></p>
            <p className="mt-1">• <strong>Required Role:</strong> <span className="uppercase font-bold text-red-600 dark:text-red-400">{requiredRole}</span></p>
          </div>

          <p className="text-[11px] text-slate-400 mb-6">
            If you are a hospital administrator or doctor needing access, please contact the hospital system admin.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/patient/dashboard"
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              Go to Patient Dashboard →
            </Link>
            <Link
              href="/"
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-200 transition"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Case 3: Fully Authorized (0ms instant render)
  return <>{children}</>;
}
