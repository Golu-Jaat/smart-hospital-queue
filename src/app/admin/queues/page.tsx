"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/lib/supabase";

type Doctor = {
  id: string;
  specialization: string;
  profiles: { full_name: string };
};
type Queue = {
  id: string;
  queue_date: string;
  current_token_number: number;
  status: string;
  doctors: { specialization: string; profiles: { full_name: string } };
  hospitals: { name: string };
  departments: { name: string };
};
type Token = {
  id: string;
  token_number: number;
  status: string;
  priority: string;
  joined_at: string;
  profiles: { full_name: string };
};

export default function AdminQueuesPage() {
  const [queues, setQueues] = useState<Queue[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedQueue, setSelectedQueue] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [doctorId, setDoctorId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    if (selectedQueue) fetchTokens(selectedQueue);
  }, [selectedQueue]);

  const fetchAll = async () => {
    setLoading(true);
    const { data: d } = await supabase
      .from("doctors")
      .select("id, specialization, profiles(full_name)")
      .eq("is_active", true);
    setDoctors(d || []);

    const { data: q } = await supabase
      .from("queues")
      .select(
        "*, doctors(specialization, profiles(full_name)), hospitals(name), departments(name)",
      )
      .order("created_at", { ascending: false });
    setQueues(q || []);
    setLoading(false);
  };

  const fetchTokens = async (queueId: string) => {
    const { data } = await supabase
      .from("tokens")
      .select("*, profiles(full_name)")
      .eq("queue_id", queueId)
      .order("token_number");
    setTokens(data || []);
  };

  const createQueue = async () => {
    setSaving(true);
    const doc = doctors.find((d) => d.id === doctorId);
    const { data: docData } = await supabase
      .from("doctors")
      .select("hospital_id, department_id")
      .eq("id", doctorId)
      .single();

    await supabase.from("queues").insert({
      doctor_id: doctorId,
      hospital_id: docData?.hospital_id,
      department_id: docData?.department_id,
      queue_date: new Date().toISOString().split("T")[0],
      current_token_number: 0,
      status: "active",
    });

    setShowForm(false);
    setDoctorId("");
    fetchAll();
    setSaving(false);
  };

  const updateQueueStatus = async (id: string, status: string) => {
    await supabase.from("queues").update({ status }).eq("id", id);
    fetchAll();
  };

  const updateTokenStatus = async (
    id: string,
    status: string,
    queueId: string,
  ) => {
    const updates: Record<string, string> = { status };
    if (status === "called") updates.called_at = new Date().toISOString();
    if (status === "completed") updates.completed_at = new Date().toISOString();
    if (status === "skipped") updates.skipped_at = new Date().toISOString();

    await supabase.from("tokens").update(updates).eq("id", id);

    if (status === "called") {
      const token = tokens.find((t) => t.id === id);
      if (token) {
        await supabase
          .from("queues")
          .update({ current_token_number: token.token_number })
          .eq("id", queueId);
      }
    }
    fetchTokens(queueId);
    fetchAll();
  };

  const getStatusColor = (status: string) => {
    if (status === "active") return "bg-green-100 text-green-700";
    if (status === "paused") return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  const getTokenColor = (status: string) => {
    if (status === "waiting") return "bg-blue-100 text-blue-700";
    if (status === "called") return "bg-yellow-100 text-yellow-700";
    if (status === "completed") return "bg-green-100 text-green-700";
    if (status === "skipped") return "bg-slate-100 text-slate-700";
    return "bg-red-100 text-red-700";
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-950">
            Queue Management
          </h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-lg bg-blue-700 px-4 py-2 text-white hover:bg-blue-800"
          >
            {showForm ? "Cancel" : "+ Create Queue"}
          </button>
        </div>

        {showForm && (
          <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold mb-4">Create New Queue</h2>
            <select
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2"
            >
              <option value="">Select Doctor</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.profiles?.full_name} — {d.specialization}
                </option>
              ))}
            </select>
            <button
              onClick={createQueue}
              disabled={saving || !doctorId}
              className="mt-4 rounded-lg bg-blue-700 px-6 py-2 text-white hover:bg-blue-800 disabled:bg-slate-300"
            >
              {saving ? "Creating..." : "Create Queue"}
            </button>
          </div>
        )}

        <div className="mt-6 grid gap-4">
          {loading ? (
            <p className="text-slate-500">Loading...</p>
          ) : queues.length === 0 ? (
            <p className="text-slate-500">No queues created yet.</p>
          ) : (
            queues.map((q) => (
              <div
                key={q.id}
                className="rounded-lg border border-slate-200 bg-white p-5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-800">
                      {q.doctors?.profiles?.full_name} —{" "}
                      {q.doctors?.specialization}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {q.hospitals?.name} • {q.queue_date} • Current Token: #
                      {q.current_token_number}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(q.status)}`}
                    >
                      {q.status}
                    </span>
                    {q.status === "active" && (
                      <button
                        onClick={() => updateQueueStatus(q.id, "paused")}
                        className="rounded px-3 py-1 text-xs bg-yellow-100 text-yellow-700"
                      >
                        Pause
                      </button>
                    )}
                    {q.status === "paused" && (
                      <button
                        onClick={() => updateQueueStatus(q.id, "active")}
                        className="rounded px-3 py-1 text-xs bg-green-100 text-green-700"
                      >
                        Resume
                      </button>
                    )}
                    <button
                      onClick={() =>
                        setSelectedQueue(selectedQueue === q.id ? "" : q.id)
                      }
                      className="rounded px-3 py-1 text-xs bg-blue-100 text-blue-700"
                    >
                      {selectedQueue === q.id ? "Hide Tokens" : "View Tokens"}
                    </button>
                  </div>
                </div>

                {selectedQueue === q.id && (
                  <div className="mt-4 border-t pt-4">
                    <h4 className="font-semibold text-slate-700 mb-3">
                      Tokens
                    </h4>
                    {tokens.length === 0 ? (
                      <p className="text-slate-500 text-sm">No tokens yet.</p>
                    ) : (
                      <div className="grid gap-2">
                        {tokens.map((t) => (
                          <div
                            key={t.id}
                            className="flex items-center justify-between bg-slate-50 rounded p-3"
                          >
                            <div>
                              <span className="font-semibold text-slate-800">
                                #{t.token_number}
                              </span>
                              <span className="ml-3 text-sm text-slate-600">
                                {t.profiles?.full_name}
                              </span>
                              <span
                                className={`ml-3 rounded-full px-2 py-0.5 text-xs ${getTokenColor(t.status)}`}
                              >
                                {t.status}
                              </span>
                            </div>
                            {t.status === "waiting" && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() =>
                                    updateTokenStatus(t.id, "called", q.id)
                                  }
                                  className="rounded px-2 py-1 text-xs bg-yellow-100 text-yellow-700"
                                >
                                  Call
                                </button>
                                <button
                                  onClick={() =>
                                    updateTokenStatus(t.id, "skipped", q.id)
                                  }
                                  className="rounded px-2 py-1 text-xs bg-slate-100 text-slate-700"
                                >
                                  Skip
                                </button>
                              </div>
                            )}
                            {t.status === "called" && (
                              <button
                                onClick={() =>
                                  updateTokenStatus(t.id, "completed", q.id)
                                }
                                className="rounded px-2 py-1 text-xs bg-green-100 text-green-700"
                              >
                                Complete
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
