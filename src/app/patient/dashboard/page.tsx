import Link from "next/link";
import { AppointmentCard } from "@/components/AppointmentCard";
import { Navbar } from "@/components/Navbar";
import { QueueStatus } from "@/components/QueueStatus";

export default function PatientDashboardPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-950">Patient dashboard</h1>
            <p className="mt-2 text-slate-600">
              Book appointments, collect tokens and monitor live queue updates.
            </p>
          </div>
          <Link
            href="/ai-assistant"
            className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
          >
            Open AI assistant
          </Link>
        </div>
        <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_0.8fr]">
          <QueueStatus currentToken={24} peopleAhead={3} estimatedWait="24-39 min" />
          <AppointmentCard
            doctor="Dr. Asha Mehta"
            department="General Medicine"
            time="Today, 11:30 AM"
            status="Booked"
          />
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Link className="rounded-lg border border-slate-200 bg-white p-5" href="/patient/hospitals">
            Select hospital
          </Link>
          <Link className="rounded-lg border border-slate-200 bg-white p-5" href="/patient/doctors">
            Find doctor
          </Link>
          <Link className="rounded-lg border border-slate-200 bg-white p-5" href="/patient/appointments">
            My appointments
          </Link>
        </div>
      </section>
    </main>
  );
}
