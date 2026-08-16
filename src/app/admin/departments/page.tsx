import { Navbar } from "@/components/Navbar";

export default function AdminDepartmentsPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />
      <section className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl font-bold text-slate-950">Department management</h1>
        <p className="mt-2 text-slate-600">Map departments to hospitals and keep active status updated.</p>
      </section>
    </main>
  );
}
