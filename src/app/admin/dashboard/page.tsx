import Link from "next/link";
import { Navbar } from "@/components/Navbar";

const adminModules = [
  { href: "/admin/hospitals", label: "Hospitals" },
  { href: "/admin/departments", label: "Departments" },
  { href: "/admin/doctors", label: "Doctors" },
  { href: "/admin/schedules", label: "Schedules" },
  { href: "/admin/queues", label: "Queues" },
  { href: "/admin/analytics", label: "Analytics" },
];

export default function AdminDashboardPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />
      <section className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl font-bold text-slate-950">Admin dashboard</h1>
        <p className="mt-2 text-slate-600">
          Manage hospital setup, schedules, queues and analytics.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {adminModules.map((module) => (
            <Link
              key={module.href}
              href={module.href}
              className="rounded-lg border border-slate-200 bg-white p-5 font-semibold text-slate-800 hover:border-blue-300 hover:text-blue-700"
            >
              {module.label}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
