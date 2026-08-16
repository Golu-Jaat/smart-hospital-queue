import { Navbar } from "@/components/Navbar";

const metrics = [
  ["Total tokens", "128"],
  ["Completed", "84"],
  ["Waiting", "31"],
  ["Skipped", "6"],
  ["Average wait", "34 min"],
  ["Urgent cases", "7"],
];

export default function AdminAnalyticsPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />
      <section className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl font-bold text-slate-950">Analytics</h1>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map(([label, value]) => (
            <section key={label} className="rounded-lg border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}
