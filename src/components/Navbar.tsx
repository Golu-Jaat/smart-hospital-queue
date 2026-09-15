"use client";

import Link from "next/link";
import { NotificationBell } from "./NotificationBell";
import { ThemeToggle } from "./ThemeToggle";
import { SmartQueueLogo } from "./SmartQueueLogo";
import { signOut } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { UserRole } from "@/lib/rbac";
import type { User } from "@supabase/supabase-js";

const navItems = [
  { href: "/patient/dashboard", label: "Patient" },
  { href: "/doctor/dashboard", label: "Doctor" },
  { href: "/admin/dashboard", label: "Admin" },
  { href: "/display", label: "TV Display" },
  { href: "/ai-assistant", label: "AI Assistant" },
];

type AuthStatus = "checking" | "authenticated" | "guest";

export function Navbar() {
  const router = useRouter();

  const [authStatus, setAuthStatus] = useState<AuthStatus>("checking");
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState<UserRole>("patient");
  const [userAvatar, setUserAvatar] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const seedSessionUser = useCallback((user: User) => {
    setAuthStatus("authenticated");
    setUserEmail(user.email || "");
    setUserName(user.user_metadata?.full_name || "User");
    setUserAvatar(user.user_metadata?.avatar_url || "");
  }, []);

  const clearUserData = useCallback(() => {
    setAuthStatus("guest");
    setUserName("");
    setUserRole("patient");
    setUserAvatar("");
    setUserEmail("");
  }, []);

  const fetchUserData = useCallback(async () => {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      clearUserData();
      return;
    }

    // Cookie-backed session data is enough for immediate display. The verified
    // user and database-owned role are still fetched before role links appear.
    seedSessionUser(session.user);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return;
    }

    seedSessionUser(user);

    const [profileResult, healthResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .single(),
      supabase
        .from("patient_health_profiles")
        .select("avatar_path, avatar_emoji")
        .eq("patient_id", user.id)
        .maybeSingle(),
    ]);

    const profile = profileResult.data;
    const healthProfile = healthResult.data;

    setUserName(profile?.full_name || user.user_metadata?.full_name || "User");
    setUserRole(
      profile?.role === "admin" || profile?.role === "doctor"
        ? profile.role
        : "patient",
    );

    if (healthProfile?.avatar_emoji) {
      setUserAvatar(healthProfile.avatar_emoji);
    } else if (healthProfile?.avatar_path) {
      const { data: signedAvatar } = await supabase.storage
        .from("profile-avatars")
        .createSignedUrl(healthProfile.avatar_path, 3600);
      setUserAvatar(signedAvatar?.signedUrl || "");
    } else {
      setUserAvatar(user.user_metadata?.avatar_url || "");
    }
  }, [clearUserData, seedSessionUser]);

  const isLoggedIn = authStatus === "authenticated";

  useEffect(() => {
    void fetchUserData();

    // Listen for profile changes
    const handleProfileUpdate = () => void fetchUserData();
    window.addEventListener("profileUpdated", handleProfileUpdate);

    return () => {
      window.removeEventListener("profileUpdated", handleProfileUpdate);
    };
  }, [fetchUserData]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut();
    clearUserData();
    setDropdownOpen(false);
    router.push("/login");
  };

  const getFilteredNavItems = () => {
    // Before login: show NO nav links at all
    if (!isLoggedIn) return [];

    return navItems.filter((item) => {
      if (item.href.startsWith("/admin")) {
        return userRole === "admin";
      }
      if (item.href.startsWith("/doctor")) {
        return userRole === "doctor" || userRole === "admin";
      }
      return true; // Patient, TV Display, AI Assistant visible after login
    });
  };

  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm sticky top-0 z-40 transition-colors">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-3 sm:px-4">
        {/* Logo */}
        <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3 group">
          <SmartQueueLogo size={34} variant="pulse-cross" />
          <div className="min-w-0">
            <p className="font-black text-slate-800 dark:text-white text-base tracking-tight leading-tight">
              Smart<span className="text-blue-600 dark:text-blue-400">Queue</span>
            </p>
            <p className="hidden text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-tight sm:block">
              AI Hospital Flow
            </p>
          </div>
        </Link>

        {/* Dynamic Role-Based Nav Links */}
        <div className="hidden lg:flex items-center gap-1">
          {getFilteredNavItems().map((item) => (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className="px-3 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Right Side */}
        <div
          className="flex shrink-0 items-center gap-1.5 sm:gap-2"
          data-auth-state={authStatus}
        >
          <ThemeToggle />
          {isLoggedIn && <NotificationBell />}

          {authStatus === "checking" ? (
            <div
              role="status"
              aria-label="Checking account session"
              className="flex h-9 w-[5.75rem] items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-1.5 dark:border-slate-700 dark:bg-slate-800 sm:w-28"
            >
              <span className="h-7 w-7 shrink-0 animate-pulse rounded-full bg-slate-300 dark:bg-slate-700" />
              <span className="hidden h-2.5 flex-1 animate-pulse rounded bg-slate-300 dark:bg-slate-700 sm:block" />
            </div>
          ) : isLoggedIn ? (
            <div className="relative" ref={dropdownRef}>
              {/* User Avatar Pill Button */}
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 p-1 sm:pr-3 rounded-full border border-slate-200 dark:border-slate-700 transition"
              >
                {/* Photo / Avatar Circle */}
                <div className="w-7 h-7 rounded-full overflow-hidden bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  {userAvatar &&
                  (userAvatar.startsWith("data:") || userAvatar.startsWith("http")) ? (
                    <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
                  ) : userAvatar ? (
                    <span className="text-sm">{userAvatar}</span>
                  ) : (
                    userName.charAt(0).toUpperCase()
                  )}
                </div>

                <span className="text-xs text-slate-800 dark:text-slate-200 font-bold hidden sm:inline">
                  {userName.split(" ")[0]}
                </span>
                <span className="text-[10px] text-slate-400 hidden sm:inline">▼</span>
              </button>

              {/* User Profile Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-[min(18rem,calc(100vw-1.5rem))] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* User Profile Header Card */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl mb-2 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-600 flex items-center justify-center text-white text-base font-bold flex-shrink-0 shadow">
                      {userAvatar &&
                      (userAvatar.startsWith("data:") || userAvatar.startsWith("http")) ? (
                        <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
                      ) : userAvatar ? (
                        <span>{userAvatar}</span>
                      ) : (
                        userName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold text-slate-900 dark:text-white text-sm truncate">
                        {userName}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-mono font-bold uppercase bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 px-1.5 py-0.2 rounded">
                          {userRole}
                        </span>
                        <span className="text-[11px] text-slate-400 truncate">
                          {userEmail}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Role Navigation */}
                  <div className="space-y-1 text-xs font-semibold lg:hidden">
                    {getFilteredNavItems().map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        prefetch={false}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 transition"
                      >
                        <span>•</span>
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </div>

                  {/* Navigation Links */}
                  <div className="space-y-1 text-xs font-semibold">
                    <Link
                      href="/patient/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 transition"
                    >
                      <span>👤</span>
                      <span>My Profile & Health ID</span>
                    </Link>

                    <Link
                      href="/patient/appointments"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 transition"
                    >
                      <span>📅</span>
                      <span>My Appointments</span>
                    </Link>

                    <Link
                      href="/patient/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 transition"
                    >
                      <span>🎫</span>
                      <span>Live Queue Token</span>
                    </Link>
                  </div>

                  {/* Logout Button */}
                  <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition text-left"
                    >
                      <span>⎋</span>
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 px-2 sm:px-3 py-1.5 rounded-xl hover:bg-blue-50 dark:hover:bg-slate-800 transition"
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => router.push("/signup")}
                className="text-xs sm:text-sm font-bold bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-xl hover:bg-blue-700 transition shadow-sm"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
