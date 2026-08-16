import { Navbar } from "@/components/Navbar";

const hospitals = [
  "City Government Hospital",
  "Green Valley Private Hospital",
  "Metro Care Multi-speciality",
];

export default function PatientHospitalsPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />
      <section className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl font-bold text-slate-950">Select hospital</h1>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {hospitals.map((hospital) => (
            <article key={hospital} className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="font-semibold text-slate-950">{hospital}</h2>
              <p className="mt-2 text-sm text-slate-600">Departments, doctors and queues available.</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
