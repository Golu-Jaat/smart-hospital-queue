"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";

type TokenData = {
  id: string;
  token_number: number;
  status: string;
  priority: string;
  joined_at: string;
  queues: {
    id: string;
    current_token_number: number;
    status: string;
    doctors: {
      specialization: string;
      room_number: string;
      average_consultation_minutes: number;
      profiles: { full_name: string };
    };
  };
  profiles: { full_name: string };
};

export default function QueueStatusPage() {
  const params = useParams();
  const tokenId = params.tokenId as string;
  const [token, setToken] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [peopleAhead, setPeopleAhead] = useState(0);

  useEffect(() => {
    fetchToken();
    // Realtime subscription
    const channel = supabase
      .channel("queue-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tokens" },
        fetchToken,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "queues" },
        fetchToken,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tokenId]);

  const fetchToken = async () => {
    const { data } = await supabase
      .from("tokens")
      .select(
        "*, queues(id, current_token_number, status, doctors(specialization, room_number, average_consultation_minutes, profiles(full_name))), profiles(full_name)",
      )
      .eq("id", tokenId)
      .single();

    setToken(data);

    if (data?.queues?.id) {
      const { count } = await supabase
        .from("tokens")
        .select("*", { count: "exact", head: true })
        .eq("queue_id", data.queues.id)
        .eq("status", "waiting")
        .lt("token_number", data.token_number);

      setPeopleAhead(count || 0);
    }

    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    if (status === "waiting") return "bg-blue-100 text-blue-700";
    if (status === "called") return "bg-yellow-100 text-yellow-700";
    if (status === "completed") return "bg-green-100 text-green-700";
    return "bg-red-100 text-red-700";
  };

  const estimatedWait = () => {
    if (!token?.queues?.doctors?.average_consultation_minutes) return "N/A";
    const avg = token.queues.doctors.average_consultation_minutes;
    const low = peopleAhead * avg;
    const high = peopleAhead * (avg + 5);
    return `${low}–${high} min`;
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />
      <section className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-3xl font-bold text-slate-950">Live Queue Status</h1>

        {loading ? (
          <p className="mt-6 text-slate-500">Loading...</p>
        ) : !token ? (
          <p className="mt-6 text-slate-500">Token not found.</p>
        ) : (
          <>
            <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Your Token</p>
                  <p className="text-5xl font-bold text-blue-600">
                    #{token.token_number}
                  </p>
                </div>
                <span
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${getStatusColor(token.status)}`}
                >
                  {token.status.toUpperCase()}
                </span>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Now Serving</p>
                  <p className="text-2xl font-bold text-slate-800">
                    #{token.queues?.current_token_number}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">People Ahead</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {peopleAhead}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Est. Wait</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {estimatedWait()}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="font-semibold text-slate-800">Doctor Info</h2>
              <p className="mt-2 text-slate-600">
                {token.queues?.doctors?.profiles?.full_name}
              </p>
              <p className="text-sm text-slate-500">
                {token.queues?.doctors?.specialization}
              </p>
              <p className="text-sm text-slate-500">
                Room: {token.queues?.doctors?.room_number}
              </p>
            </div>

            {token.status === "called" && (
              <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-6">
                <p className="text-yellow-800 font-semibold text-lg">
                  🔔 Your turn! Please proceed to Room{" "}
                  {token.queues?.doctors?.room_number}
                </p>
              </div>
            )}

            {token.status === "completed" && (
              <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-6">
                <p className="text-green-800 font-semibold">
                  ✅ Consultation completed. Thank you!
                </p>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
