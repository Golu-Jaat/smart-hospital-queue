"use client";

import Link from "next/link";
import { NotificationBell } from "./NotificationBell";
import { ThemeToggle } from "./ThemeToggle";
import { signOut } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setIsLoggedIn(true);
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();
        setUserName(profile?.full_name || "");
      }
    };
    checkUser();
  }, []);

  const handleLogout = async () => {
    await signOut();
    setIsLoggedIn(false);
    router.push("/login");
  };

  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm sticky top-0 z-40 transition-colors">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🏥</span>
          <div>
            <p className="font-bold text-slate-800 dark:text-white text-sm leading-tight">
              Smart Hospital
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 leading-tight">Queue System</p>
          </div>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition"
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
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-slate-700 dark:text-slate-200 font-medium">
                  {userName.split(" ")[0]}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 px-3 py-1.5 rounded-full text-sm hover:bg-red-100 dark:hover:bg-red-900/50 transition font-medium"
              >
                <span>⎋</span>
                <span className="hidden md:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-sm text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 px-3 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-800 transition"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded-full hover:bg-blue-700 transition font-medium"
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
