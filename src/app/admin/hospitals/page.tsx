import { Navbar } from "@/components/Navbar";

export default function AdminHospitalsPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />
      <section className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl font-bold text-slate-950">Hospital management</h1>
        <p className="mt-2 text-slate-600">CRUD screen placeholder for government and private hospitals.</p>
      </section>
    </main>
  );
}
