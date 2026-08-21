"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/lib/supabase";

type Token = {
  id: string;
  token_number: number;
  status: string;
  priority: string;
  joined_at: string;
  queue_id: string;
  profiles: { full_name: string; phone: string };
};

type Queue = {
  id: string;
  current_token_number: number;
  status: string;
  queue_date: string;
};

export default function DoctorDashboardPage() {
  const [queue, setQueue] = useState<Queue | null>(null);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [doctorName, setDoctorName] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();
    setDoctorName(profile?.full_name || "");

    const { data: doctor } = await supabase
      .from("doctors")
      .select("id")
      .eq("profile_id", user.id)
      .single();

    if (doctor) {
      const today = new Date().toISOString().split("T")[0];
      const { data: q } = await supabase
        .from("queues")
        .select("*")
        .eq("doctor_id", doctor.id)
        .eq("queue_date", today)
        .eq("status", "active")
        .single();

      setQueue(q);

      if (q) {
        const { data: t } = await supabase
          .from("tokens")
          .select("*, profiles(full_name, phone)")
          .eq("queue_id", q.id)
          .order("token_number");
        setTokens(t || []);
      }
    }
    setLoading(false);
  };

  const updateToken = async (id: string, status: string) => {
    const updates: Record<string, string> = { status };
    if (status === "called") updates.called_at = new Date().toISOString();
    if (status === "completed") updates.completed_at = new Date().toISOString();
    if (status === "skipped") updates.skipped_at = new Date().toISOString();

    await supabase.from("tokens").update(updates).eq("id", id);

    if (status === "called" && queue) {
      const token = tokens.find((t) => t.id === id);
      if (token) {
        await supabase
          .from("queues")
          .update({ current_token_number: token.token_number })
          .eq("id", queue.id);
      }
    }
    fetchData();
  };

  const waitingTokens = tokens.filter((t) => t.status === "waiting");
  const calledToken = tokens.find((t) => t.status === "called");
  const completedCount = tokens.filter((t) => t.status === "completed").length;

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      <Navbar />
      <section className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-3xl font-bold text-slate-950 dark:text-white">Doctor Dashboard</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">Welcome, {doctorName}</p>

        {loading ? (
          <p className="mt-6 text-slate-500 dark:text-slate-400">Loading...</p>
        ) : !queue ? (
          <div className="mt-6 rounded-lg border border-yellow-200 dark:border-yellow-900/50 bg-yellow-50 dark:bg-yellow-950/30 p-6">
            <p className="text-yellow-700 dark:text-yellow-400">
              No active queue for today. Ask admin to create one.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">Waiting</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {waitingTokens.length}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">Completed</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {completedCount}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">Current Token</p>
                <p className="text-3xl font-bold text-slate-800 dark:text-white">
                  #{queue.current_token_number}
                </p>
              </div>
            </div>

            {calledToken && (
              <div className="mt-6 rounded-lg border border-yellow-200 dark:border-yellow-900/50 bg-yellow-50 dark:bg-yellow-950/30 p-6">
                <h2 className="font-semibold text-yellow-800 dark:text-yellow-300">
                  Currently Serving
                </h2>
                <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400 mt-1">
                  #{calledToken.token_number} —{" "}
                  {calledToken.profiles?.full_name}
                </p>
                <button
                  onClick={() => updateToken(calledToken.id, "completed")}
                  className="mt-3 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                >
                  Complete Consultation
                </button>
              </div>
            )}

            <div className="mt-6">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">
                Waiting Patients ({waitingTokens.length})
              </h2>
              {waitingTokens.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400">No patients waiting.</p>
              ) : (
                <div className="grid gap-3">
                  {waitingTokens.map((t, index) => (
                    <div
                      key={t.id}
                      className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-slate-800 dark:text-white">
                          #{t.token_number}
                        </span>
                        <span className="ml-3 text-slate-600 dark:text-slate-300">
                          {t.profiles?.full_name}
                        </span>
                        {index === 0 && (
                          <span className="ml-3 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            Next
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {!calledToken && (
                          <button
                            onClick={() => updateToken(t.id, "called")}
                            className="rounded px-3 py-1 text-sm bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                          >
                            Call
                          </button>
                        )}
                        <button
                          onClick={() => updateToken(t.id, "skipped")}
                          className="rounded px-3 py-1 text-sm bg-slate-100 text-slate-700 hover:bg-slate-200"
                        >
                          Skip
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
