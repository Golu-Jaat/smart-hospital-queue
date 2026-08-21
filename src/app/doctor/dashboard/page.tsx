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
  const [delayMinutes, setDelayMinutes] = useState<number>(0);
  const [delayReason, setDelayReason] = useState<string>("");
  const [showDelayModal, setShowDelayModal] = useState<boolean>(false);
  const [consultNotes, setConsultNotes] = useState<string>("");
  const [completingTokenId, setCompletingTokenId] = useState<string | null>(null);

  const setDoctorDelay = (mins: number, reason: string) => {
    setDelayMinutes(mins);
    setDelayReason(reason);
    setShowDelayModal(false);
  };

  const handleCompleteWithNotes = async () => {
    if (!completingTokenId) return;
    await updateToken(completingTokenId, "completed");
    setCompletingTokenId(null);
    setConsultNotes("");
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      <Navbar />
      <section className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-950 dark:text-white">Doctor Dashboard</h1>
            <p className="mt-1 text-slate-600 dark:text-slate-400">Welcome, {doctorName}</p>
          </div>

          {/* Delay Broadcast Controls */}
          {queue && (
            <div className="flex items-center gap-2">
              {delayMinutes > 0 ? (
                <div className="flex items-center gap-2 bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-xl text-xs font-semibold">
                  <span>⚠️ Delay: +{delayMinutes}m ({delayReason})</span>
                  <button
                    onClick={() => setDoctorDelay(0, "")}
                    className="ml-2 hover:text-white font-bold"
                  >
                    ✕ Clear
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowDelayModal(true)}
                  className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 hover:bg-amber-100 px-3 py-1.5 rounded-xl text-xs font-semibold transition"
                >
                  ⏱️ Broadcast Delay
                </button>
              )}
            </div>
          )}
        </div>

        {/* Delay Selector Modal */}
        {showDelayModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-700 shadow-2xl">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Broadcast OPD Delay</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Patients in queue will automatically be notified of updated estimated wait time.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {[
                  { mins: 15, label: "+15 min (Minor Delay)" },
                  { mins: 30, label: "+30 min (Ward Visit)" },
                  { mins: 45, label: "+45 min (Emergency Case)" },
                  { mins: 60, label: "+60 min (Surgery)" },
                ].map((item) => (
                  <button
                    key={item.mins}
                    onClick={() => setDoctorDelay(item.mins, item.label.split(" ")[1])}
                    className="p-3 bg-slate-50 dark:bg-slate-700/50 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-slate-200 dark:border-slate-600 hover:border-amber-400 rounded-xl text-xs font-semibold text-left transition"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowDelayModal(false)}
                className="mt-4 w-full py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Consultation Notes Modal */}
        {completingTokenId && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-700 shadow-2xl">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Complete Consultation</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Add optional consultation notes or prescription advice for patient pass.
              </p>
              <textarea
                value={consultNotes}
                onChange={(e) => setConsultNotes(e.target.value)}
                placeholder="Prescription / Advice (e.g. Paracetamol 500mg TDS, Rest for 3 days)..."
                className="w-full mt-3 p-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-sm outline-none focus:border-blue-500"
                rows={4}
              />
              <div className="mt-4 flex gap-2 justify-end">
                <button
                  onClick={() => setCompletingTokenId(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCompleteWithNotes}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-semibold"
                >
                  Confirm & Complete
                </button>
              </div>
            </div>
          </div>
        )}

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
              <div className="mt-6 rounded-2xl border border-yellow-200 dark:border-yellow-900/50 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/20 p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-yellow-800 dark:text-yellow-300">
                    Currently In Room (Serving)
                  </h2>
                  <span className="bg-yellow-400 text-yellow-950 text-xs px-2.5 py-0.5 rounded-full font-bold animate-pulse">
                    IN PROGRESS
                  </span>
                </div>
                <p className="text-2xl font-black text-yellow-800 dark:text-yellow-300 mt-2 font-mono">
                  Token #{calledToken.token_number} —{" "}
                  <span className="font-sans font-bold">{calledToken.profiles?.full_name}</span>
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setCompletingTokenId(calledToken.id)}
                    className="rounded-xl bg-green-600 px-5 py-2.5 text-white font-semibold text-sm hover:bg-green-700 shadow-sm"
                  >
                    ✅ Complete Consultation
                  </button>
                  <button
                    onClick={() => updateToken(calledToken.id, "skipped")}
                    className="rounded-xl bg-slate-200 dark:bg-slate-700 px-4 py-2.5 text-slate-700 dark:text-slate-200 font-semibold text-sm hover:bg-slate-300 dark:hover:bg-slate-600"
                  >
                    Skip
                  </button>
                </div>
              </div>
            )}

            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
                  Waiting Patients ({waitingTokens.length})
                </h2>
                <span className="text-xs text-slate-500">
                  Priority cases can be called immediately
                </span>
              </div>

              {waitingTokens.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 py-6 text-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  No patients waiting in queue.
                </p>
              ) : (
                <div className="grid gap-3">
                  {waitingTokens.map((t, index) => {
                    const isPriority = t.priority && t.priority !== "normal";

                    return (
                      <div
                        key={t.id}
                        className={`rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition shadow-sm ${
                          isPriority
                            ? "bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50"
                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-black text-lg text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-700/60 px-3 py-1.5 rounded-xl">
                            #{t.token_number}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-slate-800 dark:text-white">
                                {t.profiles?.full_name}
                              </p>
                              {t.priority === "emergency" && (
                                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  🚨 EMERGENCY
                                </span>
                              )}
                              {t.priority === "senior_citizen" && (
                                <span className="bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  👵 SENIOR CITIZEN
                                </span>
                              )}
                              {index === 0 && !isPriority && (
                                <span className="bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  NEXT
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Joined: {new Date(t.joined_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateToken(t.id, "called")}
                            className="rounded-xl px-4 py-2 text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm"
                          >
                            Call Patient →
                          </button>
                          <button
                            onClick={() => updateToken(t.id, "skipped")}
                            className="rounded-xl px-3 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                          >
                            Skip
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
