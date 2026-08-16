import { AppointmentCard } from "@/components/AppointmentCard";
import { Navbar } from "@/components/Navbar";

export default function PatientAppointmentsPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />
      <section className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl font-bold text-slate-950">My appointments</h1>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <AppointmentCard
            doctor="Dr. Asha Mehta"
            department="General Medicine"
            time="Today, 11:30 AM"
            status="Booked"
          />
        </div>
      </section>
    </main>
  );
}
