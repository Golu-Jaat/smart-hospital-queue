import { Navbar } from "@/components/Navbar";
import { QueueStatus } from "@/components/QueueStatus";
import { TokenCard } from "@/components/TokenCard";

export default function PatientQueuePage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />
      <section className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl font-bold text-slate-950">Live queue status</h1>
        <div className="mt-6 grid gap-5 lg:grid-cols-[0.8fr_1fr]">
          <TokenCard tokenNumber={27} doctor="Dr. Asha Mehta - Room 204" status="Waiting" />
          <QueueStatus currentToken={24} peopleAhead={3} estimatedWait="24-39 min" />
        </div>
      </section>
    </main>
  );
}
