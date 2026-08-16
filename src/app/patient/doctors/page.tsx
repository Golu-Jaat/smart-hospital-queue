import { DoctorCard } from "@/components/DoctorCard";
import { Navbar } from "@/components/Navbar";

export default function PatientDoctorsPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />
      <section className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl font-bold text-slate-950">Available doctors</h1>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <DoctorCard name="Dr. Asha Mehta" department="General Medicine" room="204" wait="24-39 min" />
          <DoctorCard name="Dr. Rohan Sen" department="Orthopedics" room="118" wait="12-20 min" />
        </div>
      </section>
    </main>
  );
}
