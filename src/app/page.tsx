import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { ServiceCard } from "@/components/ServiceCard";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      <Navbar />
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase text-blue-700 dark:text-blue-400">
            Appointment, token and queue management
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-normal text-slate-950 dark:text-white sm:text-5xl">
            Smart Hospital AI Queue & Appointment Management System
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
            Patients can book appointments, get live queue tokens, track expected
            waiting time, and use AI-assisted department navigation before visiting.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="rounded-md bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800"
            >
              Create patient account
            </Link>
            <Link
              href="/login"
              className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-3 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:border-blue-300 dark:hover:border-blue-500 hover:text-blue-700 dark:hover:text-blue-400"
            >
              Login
            </Link>
          </div>
        </div>
        <div className="grid gap-4">
          <ServiceCard
            title="Live queue"
            description="Token status, people ahead, doctor room and estimated waiting range."
          />
          <ServiceCard
            title="Role dashboards"
            description="Separate patient, doctor and admin workflows for queue operations."
          />
          <ServiceCard
            title="AI safety layer"
            description="Symptom collection and department routing with emergency guidance boundaries."
          />
        </div>
      </section>
    </main>
  );
}
