import { Navbar } from "@/components/Navbar";
import { TokenCard } from "@/components/TokenCard";

const actions = ["Call Next", "Start Consultation", "Complete", "Skip"];

export default function DoctorDashboardPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />
      <section className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl font-bold text-slate-950">Doctor dashboard</h1>
        <p className="mt-2 text-slate-600">
          Manage today&apos;s queue with call, start, complete and skip actions.
        </p>
        <div className="mt-8 grid gap-5 lg:grid-cols-[0.8fr_1fr]">
          <TokenCard tokenNumber={24} doctor="Dr. Asha Mehta - Room 204" status="Called" />
          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="font-semibold text-slate-950">Queue actions</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {actions.map((action) => (
                <button
                  key={action}
                  className="rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-800 hover:border-blue-300 hover:text-blue-700"
                >
                  {action}
                </button>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
