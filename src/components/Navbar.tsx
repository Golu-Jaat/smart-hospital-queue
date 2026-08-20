import Link from "next/link";
import { NotificationBell } from "./NotificationBell";

const navItems = [
  { href: "/patient/dashboard", label: "Patient" },
  { href: "/doctor/dashboard", label: "Doctor" },
  { href: "/admin/dashboard", label: "Admin" },
  { href: "/ai-assistant", label: "AI Assistant" },
];

export function Navbar() {
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
          <NotificationBell />
        </div>
      </nav>
    </header>
  );
}
