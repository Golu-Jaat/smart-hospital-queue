"use client";

import Link from "next/link";
import { NotificationBell } from "./NotificationBell";
import { signOut } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const navItems = [
  { href: "/patient/dashboard", label: "Patient" },
  { href: "/doctor/dashboard", label: "Doctor" },
  { href: "/admin/dashboard", label: "Admin" },
  { href: "/ai-assistant", label: "AI Assistant" },
];

export function Navbar() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
    };
    checkUser();
  }, []);

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="font-semibold text-slate-950">
          Smart Hospital Queue
        </Link>
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="hover:text-blue-700"
            >
              {item.label}
            </Link>
          ))}
          {isLoggedIn && <NotificationBell />}
          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600 transition"
            >
              Logout
            </button>
          ) : (
            <Link
              href="/login"
              className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700"
            >
              Login
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
