"use client";

import Link from "next/link";
import { NotificationBell } from "./NotificationBell";
import { ThemeToggle } from "./ThemeToggle";
import { SmartQueueLogo, LogoVariant } from "./SmartQueueLogo";
import { signOut } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";

const navItems = [
  { href: "/patient/dashboard", label: "Patient" },
  { href: "/doctor/dashboard", label: "Doctor" },
  { href: "/admin/dashboard", label: "Admin" },
  { href: "/display", label: "TV Display" },
  { href: "/ai-assistant", label: "AI Assistant" },
];

export function Navbar() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("patient");
  const [userAvatar, setUserAvatar] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchUserData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      setIsLoggedIn(true);
      setUserEmail(user.email || "");

      // Check localStorage for quick avatar cache
      const localProfile = localStorage.getItem(`user_profile_${user.id}`);
      if (localProfile) {
        try {
          const parsed = JSON.parse(localProfile);
          if (parsed.avatar_url) setUserAvatar(parsed.avatar_url);
        } catch (e) {}
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .single();

      setUserName(profile?.full_name || user.user_metadata?.full_name || "User");
      setUserRole(profile?.role || user.user_metadata?.role || "patient");

      if (user.user_metadata?.avatar_url && !userAvatar) {
        setUserAvatar(user.user_metadata.avatar_url);
      }
    } else {
      setIsLoggedIn(false);
    }
  };

  useEffect(() => {
    fetchUserData();

    // Listen for profile changes
    const handleProfileUpdate = () => fetchUserData();
    window.addEventListener("profileUpdated", handleProfileUpdate);

    return () => {
      window.removeEventListener("profileUpdated", handleProfileUpdate);
    };
  }, []);

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
    setIsLoggedIn(false);
    setDropdownOpen(false);
    router.push("/login");
  };

  const getFilteredNavItems = () => {
    return navItems.filter((item) => {
      if (item.href.startsWith("/admin")) {
        return isLoggedIn && userRole === "admin";
      }
      if (item.href.startsWith("/doctor")) {
        return isLoggedIn && (userRole === "doctor" || userRole === "admin");
      }
      if (item.href.startsWith("/patient")) {
        return true;
      }
      return true; // TV Display and AI Assistant are public
    });
  };

  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm sticky top-0 z-40 transition-colors">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <SmartQueueLogo size={38} variant="pulse-cross" />
          <div>
            <p className="font-black text-slate-800 dark:text-white text-base tracking-tight leading-tight">
              Smart<span className="text-blue-600 dark:text-blue-400">Queue</span>
            </p>
            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-tight">
              AI Hospital Flow
            </p>
          </div>
        </Link>

        {/* Dynamic Role-Based Nav Links */}
        <div className="hidden md:flex items-center gap-1">
          {getFilteredNavItems().map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {isLoggedIn && <NotificationBell />}

          {isLoggedIn ? (
            <div className="relative" ref={dropdownRef}>
              {/* User Avatar Pill Button */}
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 p-1 sm:pr-3 rounded-full border border-slate-200 dark:border-slate-700 transition"
              >
                {/* Photo / Avatar Circle */}
                <div className="w-7 h-7 rounded-full overflow-hidden bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  {userAvatar && userAvatar.startsWith("data:") ? (
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
                <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* User Profile Header Card */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl mb-2 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-600 flex items-center justify-center text-white text-base font-bold flex-shrink-0 shadow">
                      {userAvatar && userAvatar.startsWith("data:") ? (
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
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 px-3 py-1.5 rounded-xl hover:bg-blue-50 dark:hover:bg-slate-800 transition"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="text-sm font-bold bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition shadow-sm"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
