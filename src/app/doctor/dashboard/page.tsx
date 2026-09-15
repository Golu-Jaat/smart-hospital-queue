"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { AccessGuard } from "@/components/AccessGuard";
import { playChime } from "@/lib/sound";
import { getIndiaDate } from "@/lib/scheduling";

type Token = {
  id: string;
  token_number: number;
  status: string;
  priority: string;
  joined_at: string;
  queue_id: string;
  profiles?: { full_name?: string; phone?: string };
};

type DoctorInfo = {
  id: string;
  specialization: string;
  room_number: string;
  average_consultation_minutes: number;
  profile_id?: string;
  profiles?: { full_name?: string };
  hospitals?: { name?: string };
  departments?: { name?: string };
};

type Queue = {
  id: string;
  doctor_id: string;
  current_token_number: number;
  status: string;
  queue_date: string;
};

export default function DoctorDashboardPage() {
  const [doctorsList, setDoctorsList] = useState<DoctorInfo[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorInfo | null>(null);
  const [queue, setQueue] = useState<Queue | null>(null);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingQueue, setStartingQueue] = useState(false);
  const [userName, setUserName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [actionError, setActionError] = useState("");

  // Modals & Broadcast
  const [delayMinutes, setDelayMinutes] = useState<number>(0);
  const [delayReason, setDelayReason] = useState<string>("");
  const [showDelayModal, setShowDelayModal] = useState<boolean>(false);
  const [consultNotes, setConsultNotes] = useState<string>("");
  const [completingTokenId, setCompletingTokenId] = useState<string | null>(null);

  useEffect(() => {
    initDoctorDashboard();
  }, []);

  const initDoctorDashboard = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch user profile
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .single();

      setUserName(userProfile?.full_name || "Doctor");
      const userIsAdmin = userProfile?.role === "admin";
      setIsAdmin(userIsAdmin);

      // Fetch all active doctors with department and hospital
      const { data: allDoctors } = await supabase
        .from("doctors")
        .select("id, specialization, room_number, average_consultation_minutes, profile_id, profiles(full_name), hospitals(name), departments(name)")
        .eq("is_active", true);

      const docs = (allDoctors || []) as unknown as DoctorInfo[];
      setDoctorsList(docs);

      // Check if logged in user is linked to a doctor
      let targetDoctor = docs.find((d) => d.profile_id === user.id);
      if (!targetDoctor && docs.length > 0) {
        targetDoctor = docs[0]; // Default to first doctor if admin or unlinked
      }

      if (targetDoctor) {
        setSelectedDoctorId(targetDoctor.id);
        setSelectedDoctor(targetDoctor);
        await loadDoctorQueue(targetDoctor.id);
      }
    } catch (err) {
      console.error("Error loading doctor dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadDoctorQueue = async (doctorId: string) => {
    const today = new Date().toISOString().split("T")[0];

    const { data: q } = await supabase
      .from("queues")
      .select("*")
      .eq("doctor_id", doctorId)
      .eq("queue_date", today)
      .eq("status", "active")
      .maybeSingle();

    setQueue(q);

    if (q) {
      const { data: t } = await supabase
        .from("tokens")
        .select("*, profiles(full_name, phone)")
        .eq("queue_id", q.id)
        .order("token_number");
      setTokens(t || []);
    } else {
      setTokens([]);
    }
  };

  // Real-time Supabase Subscription
  useEffect(() => {
    if (!queue?.id) return;

    const channel = supabase
      .channel(`doctor_queue_${queue.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tokens",
          filter: `queue_id=eq.${queue.id}`,
        },
        () => {
          if (selectedDoctorId) loadDoctorQueue(selectedDoctorId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queue?.id, selectedDoctorId]);

  const handleDoctorChange = async (doctorId: string) => {
    setSelectedDoctorId(doctorId);
    const doc = doctorsList.find((d) => d.id === doctorId) || null;
    setSelectedDoctor(doc);
    setLoading(true);
    await loadDoctorQueue(doctorId);
    setLoading(false);
  };

  // 1-Click: Start / Create Today's OPD Queue
  const handleStartTodayQueue = async () => {
    if (!selectedDoctor) return;
    setStartingQueue(true);
    setActionError("");
    try {
      const { error } = await supabase.rpc("ensure_doctor_queue", {
        target_doctor_id: selectedDoctor.id,
        requested_date: getIndiaDate(),
      });

      if (error) throw error;

      await loadDoctorQueue(selectedDoctor.id);
    } catch (err: unknown) {
      setActionError(
        err instanceof Error ? err.message : "Unable to start the doctor queue.",
      );
    } finally {
      setStartingQueue(false);
    }
  };

  const updateToken = async (id: string, status: string) => {
    setActionError("");
    const { error } = await supabase.rpc("transition_token_status", {
      target_token_id: id,
      requested_status: status,
    });

    if (error) {
      setActionError(error.message);
      return;
    }

    if (status === "called") playChime();
    if (selectedDoctorId) await loadDoctorQueue(selectedDoctorId);
  };

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

  const waitingTokens = tokens.filter((t) => t.status === "waiting");
  const calledToken = tokens.find((t) => t.status === "called");
  const completedCount = tokens.filter((t) => t.status === "completed").length;

  const docName = Array.isArray(selectedDoctor?.profiles)
    ? selectedDoctor?.profiles[0]?.full_name
    : selectedDoctor?.profiles?.full_name || selectedDoctor?.specialization || "Doctor";

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors pb-16">
      <Navbar />
      <AccessGuard requiredRole="doctor">
        <section className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
          {/* Header & Doctor Cabin Switcher */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">👨‍⚕️</span>
                <h1 className="text-2xl font-black text-slate-950 dark:text-white sm:text-3xl">
                  Doctor OPD Cabin
                </h1>
              </div>
              <p className="mt-1 text-slate-600 dark:text-slate-400 text-sm">
                Logged in as <strong className="text-slate-900 dark:text-white">{userName}</strong>
                {isAdmin && <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400">Super Admin Access</span>}
              </p>
            </div>

            {/* Doctor / Cabin Dropdown Selector */}
            {doctorsList.length > 0 && (
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline">
                  Select Cabin:
                </span>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => handleDoctorChange(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white p-2.5 text-xs font-bold text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white sm:max-w-sm"
                >
                  {doctorsList.map((d) => {
                    const name = Array.isArray(d.profiles) ? d.profiles[0]?.full_name : d.profiles?.full_name;
                    return (
                      <option key={d.id} value={d.id}>
                        👨‍⚕️ {name || "Doctor"} — {d.specialization} (Room {d.room_number || "OPD"})
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
          </div>

          {actionError && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
              {actionError}
            </div>
          )}

          {/* Delay Broadcast Controls */}
          {queue && (
            <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold text-slate-800 dark:text-white">
                  OPD Cabin Active (Room {selectedDoctor?.room_number || "4"})
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-500 dark:text-slate-400">
                  {selectedDoctor?.specialization}
                </span>
              </div>

              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                {delayMinutes > 0 ? (
                  <div className="flex items-center gap-2 bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-xl text-xs font-semibold">
                    <span>⚠️ Delay: +{delayMinutes}m ({delayReason})</span>
                    <button
                      onClick={() => setDoctorDelay(0, "")}
                      className="ml-1 hover:text-slate-900 dark:hover:text-white font-bold"
                    >
                      ✕ Clear
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowDelayModal(true)}
                    className="w-full rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-1.5 text-xs font-bold text-amber-700 transition hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-400 sm:w-auto"
                  >
                    ⏱️ Broadcast OPD Delay
                  </button>
                )}

              </div>
            </div>
          )}

          {/* Delay Selector Modal */}
          {showDelayModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-700 shadow-2xl">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Broadcast OPD Delay</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Waiting patients & TV Display will immediately show updated wait times.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {[
                    { mins: 15, label: "+15 min (Minor Delay)" },
                    { mins: 30, label: "+30 min (Ward Round)" },
                    { mins: 45, label: "+45 min (Emergency)" },
                    { mins: 60, label: "+60 min (OT Surgery)" },
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
                  className="mt-4 w-full py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Consultation Notes Modal */}
          {completingTokenId && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-700 shadow-2xl">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Complete Consultation</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Add optional prescription notes / advice for patient's digital record.
                </p>
                <textarea
                  value={consultNotes}
                  onChange={(e) => setConsultNotes(e.target.value)}
                  placeholder="Prescription / Advice (e.g. Tab Paracetamol 650mg TDS, follow up in 3 days)..."
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
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold shadow-md"
                  >
                    Confirm & Finish
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Main Dashboard States */}
          {loading ? (
            <div className="py-20 text-center text-slate-500 dark:text-slate-400 animate-pulse">
              Loading doctor cabin information...
            </div>
          ) : !queue ? (
            /* Empty Queue State with 1-Click Initialize */
            <div className="mt-8 rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-slate-900/5 dark:bg-slate-900 p-8 sm:p-12 text-center shadow-lg">
              <div className="w-16 h-16 rounded-3xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-3xl flex items-center justify-center mx-auto mb-4">
                🩺
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                Queue Not Started for Today
              </h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Cabin for <strong>{docName}</strong> ({selectedDoctor?.specialization}) is ready. Click below to start today's active OPD queue!
              </p>

              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={handleStartTodayQueue}
                  disabled={startingQueue}
                  className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-500/25 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  {startingQueue ? "Starting Queue..." : "⚡ Start Today's OPD Queue"}
                </button>
              </div>
            </div>
          ) : (
            /* Active Live OPD Queue Console */
            <>
              {/* Top Stats Cards */}
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 text-center shadow-sm">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Waiting
                  </p>
                  <p className="text-3xl font-black text-blue-600 dark:text-blue-400 mt-1 font-mono">
                    {waitingTokens.length}
                  </p>
                </div>
                <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 text-center shadow-sm">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Completed
                  </p>
                  <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                    {completedCount}
                  </p>
                </div>
                <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 text-center shadow-sm">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Current Token
                  </p>
                  <p className="text-3xl font-black text-slate-900 dark:text-white mt-1 font-mono">
                    #{queue.current_token_number}
                  </p>
                </div>
              </div>

              {/* Now Calling Banner */}
              {calledToken ? (
                <div className="mt-6 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white shadow-xl relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 uppercase tracking-wider">
                          Now Inside Cabin
                        </span>
                        {calledToken.priority === "emergency" && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white animate-pulse">
                            🚨 Emergency
                          </span>
                        )}
                      </div>
                      <h2 className="mt-2 font-mono text-3xl font-black sm:text-4xl">
                        Token #{calledToken.token_number}
                      </h2>
                      <p className="text-sm text-blue-100 mt-1">
                        Patient: <strong>{calledToken.profiles?.full_name || "Patient"}</strong> • {calledToken.profiles?.phone || "No phone"}
                      </p>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => setCompletingTokenId(calledToken.id)}
                        className="flex-1 sm:flex-none rounded-2xl bg-emerald-500 hover:bg-emerald-600 px-6 py-3 font-bold text-sm transition shadow-lg"
                      >
                        ✓ Done (Complete)
                      </button>
                      <button
                        onClick={() => updateToken(calledToken.id, "skipped")}
                        className="rounded-2xl bg-white/20 hover:bg-white/30 px-4 py-3 text-xs font-semibold transition"
                      >
                        Skip
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-center shadow-sm">
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    No patient is currently inside the cabin. Call the next token below!
                  </p>
                </div>
              )}

              {/* Waiting Tokens Queue List */}
              <div className="mt-8">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">
                    Waiting Patients ({waitingTokens.length})
                  </h2>
                  <button
                    onClick={() => selectedDoctorId && loadDoctorQueue(selectedDoctorId)}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                  >
                    🔄 Refresh List
                  </button>
                </div>

                {waitingTokens.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-8 text-center bg-white/50 dark:bg-slate-900/50">
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                      Waiting queue is empty.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {waitingTokens.map((t) => {
                      const isEmergency = t.priority === "emergency";
                      const isUrgent = t.priority === "urgent";

                      return (
                        <div
                          key={t.id}
                          className={`rounded-2xl border p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                            isEmergency
                              ? "bg-red-500/10 border-red-500/30"
                              : isUrgent
                              ? "bg-purple-500/10 border-purple-500/30"
                              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                          }`}
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div
                              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-mono font-black text-lg shadow-sm ${
                                isEmergency
                                  ? "bg-red-600 text-white"
                                  : isUrgent
                                  ? "bg-purple-600 text-white"
                                  : "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400"
                              }`}
                            >
                              #{t.token_number}
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                                  {t.profiles?.full_name || "Patient"}
                                </h3>
                                {isEmergency && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white animate-pulse">
                                    🚨 Urgent
                                  </span>
                                )}
                                {isUrgent && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-600 text-white">
                                    Urgent
                                  </span>
                                )}
                              </div>
                              <p className="break-words text-xs text-slate-400">
                                Phone: {t.profiles?.phone || "N/A"} • Joined: {new Date(t.joined_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button
                              onClick={() => updateToken(t.id, "called")}
                              className="flex-1 sm:flex-none rounded-xl px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition shadow-sm"
                            >
                              Call Patient →
                            </button>
                            <button
                              onClick={() => updateToken(t.id, "skipped")}
                              className="rounded-xl px-3 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
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
      </AccessGuard>
    </main>
  );
}
