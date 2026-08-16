import { Navbar } from "@/components/Navbar";
import { QueueStatus } from "@/components/QueueStatus";

export default function AdminQueuesPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />
      <section className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl font-bold text-slate-950">Queue management</h1>
        <div className="mt-6">
          <QueueStatus currentToken={24} peopleAhead={8} estimatedWait="64-104 min" />
        </div>
      </section>
    </main>
  );
}
