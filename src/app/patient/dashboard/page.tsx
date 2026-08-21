"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

type Appointment = {
  id: string;
  appointment_date: string;
  slot_start: string;
  status: string;
  doctors: { specialization: string; profiles: { full_name: string } };
  departments: { name: string };
};

type Token = {
  id: string;
  token_number: number;
  status: string;
  queues: {
    current_token_number: number;
    doctors: {
      average_consultation_minutes: number;
      room_number: string;
      profiles: { full_name: string };
    };
  };
};

export default function PatientDashboardPage() {
  const [profile, setProfile] = useState<{ full_name: string } | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activeToken, setActiveToken] = useState<Token | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: prof } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();
    setProfile(prof);

    const { data: appts } = await supabase
      .from("appointments")
      .select(
        "*, doctors(specialization, profiles(full_name)), departments(name)",
      )
      .eq("patient_id", user.id)
      .order("appointment_date", { ascending: false })
      .limit(3);
    setAppointments(appts || []);

    const { data: tokens } = await supabase
      .from("tokens")
      .select(
        "*, queues(current_token_number, doctors(average_consultation_minutes, room_number, profiles(full_name)))",
      )
      .eq("patient_id", user.id)
      .eq("status", "waiting")
      .order("joined_at", { ascending: false })
      .limit(1);
    setActiveToken(tokens?.[0] || null);
    setLoading(false);
  };

  const peopleAhead = activeToken
    ? Math.max(
        0,
        activeToken.token_number -
          (activeToken.queues?.current_token_number || 0) -
          1,
      )
    : 0;

  const estimatedWait = activeToken
    ? peopleAhead *
      (activeToken.queues?.doctors?.average_consultation_minutes || 10)
    : 0;

  const getStatusColor = (status: string) => {
    if (status === "pending") return "bg-yellow-100 text-yellow-700";
    if (status === "confirmed") return "bg-green-100 text-green-700";
    if (status === "completed") return "bg-blue-100 text-blue-700";
    return "bg-red-100 text-red-700";
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      <Navbar />

      <section className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <p className="text-blue-600 dark:text-blue-400 font-medium">{getGreeting()} 👋</p>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mt-1">
            {loading
              ? "Loading..."
              : `Welcome, ${profile?.full_name || "Patient"}!`}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Here is your health dashboard overview
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            {
              href: "/patient/hospitals",
              icon: "🏥",
              label: "Find Hospital",
              color: "from-blue-500 to-blue-600",
              desc: "Browse hospitals",
            },
            {
              href: "/patient/doctors",
              icon: "👨‍⚕️",
              label: "Find Doctor",
              color: "from-green-500 to-green-600",
              desc: "Search doctors",
            },
            {
              href: "/patient/appointments",
              icon: "📅",
              label: "Appointments",
              color: "from-purple-500 to-purple-600",
              desc: "Book & manage",
            },
            {
              href: "/ai-assistant",
              icon: "🤖",
              label: "AI Assistant",
              color: "from-orange-500 to-orange-600",
              desc: "Symptom check",
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`bg-gradient-to-br ${item.color} rounded-2xl p-5 text-white hover:shadow-lg hover:scale-105 transition-all duration-200`}
            >
              <span className="text-3xl">{item.icon}</span>
              <p className="font-bold mt-3">{item.label}</p>
              <p className="text-xs opacity-80 mt-1">{item.desc}</p>
            </Link>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Active Token Card */}
          <div className="lg:col-span-1">
            {activeToken ? (
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-blue-100">
                    Live Queue Status
                  </h2>
                  <span className="bg-green-400 text-green-900 text-xs px-2 py-1 rounded-full font-bold animate-pulse">
                    ACTIVE
                  </span>
                </div>
                <div className="text-center my-4">
                  <p className="text-blue-200 text-sm">Your Token</p>
                  <p className="text-6xl font-bold">
                    #{activeToken.token_number}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div className="bg-white bg-opacity-20 rounded-xl p-3 text-center">
                    <p className="text-xs text-blue-200">Serving</p>
                    <p className="font-bold text-lg">
                      #{activeToken.queues?.current_token_number}
                    </p>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-xl p-3 text-center">
                    <p className="text-xs text-blue-200">Ahead</p>
                    <p className="font-bold text-lg">{peopleAhead}</p>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-xl p-3 text-center">
                    <p className="text-xs text-blue-200">Wait</p>
                    <p className="font-bold text-lg">{estimatedWait}m</p>
                  </div>
                </div>
                <div className="mt-4 bg-white bg-opacity-10 rounded-xl p-3">
                  <p className="text-xs text-blue-200">Doctor</p>
                  <p className="font-semibold">
                    {activeToken.queues?.doctors?.profiles?.full_name}
                  </p>
                  <p className="text-xs text-blue-200">
                    Room: {activeToken.queues?.doctors?.room_number}
                  </p>
                </div>
                <Link
                  href={`/patient/queue/${activeToken.id}`}
                  className="mt-4 block text-center bg-white text-blue-700 font-semibold py-2 rounded-xl hover:bg-blue-50 transition"
                >
                  Track Live Queue →
                </Link>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 h-full flex flex-col items-center justify-center text-center">
                <span className="text-5xl mb-4">🎫</span>
                <h3 className="font-semibold text-slate-700 dark:text-slate-200">
                  No Active Token
                </h3>
                <p className="text-slate-400 dark:text-slate-400 text-sm mt-2">
                  Book an appointment to get your token
                </p>
                <Link
                  href="/patient/hospitals"
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-blue-700 transition"
                >
                  Book Now
                </Link>
              </div>
            )}
          </div>

          {/* Recent Appointments */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-slate-800 dark:text-white text-lg">
                  Recent Appointments
                </h2>
                <Link
                  href="/patient/appointments"
                  className="text-blue-600 dark:text-blue-400 text-sm hover:underline"
                >
                  View All →
                </Link>
              </div>

              {loading ? (
                <p className="text-slate-400 text-center py-8">Loading...</p>
              ) : appointments.length === 0 ? (
                <div className="text-center py-8">
                  <span className="text-4xl">📋</span>
                  <p className="text-slate-400 mt-3">No appointments yet</p>
                  <Link
                    href="/patient/doctors"
                    className="mt-3 inline-block bg-blue-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-blue-700"
                  >
                    Book Appointment
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {appointments.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center text-2xl">
                          👨‍⚕️
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-white">
                            {a.doctors?.profiles?.full_name}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {a.departments?.name}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-400">
                            {a.appointment_date} • {a.slot_start}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(a.status)}`}
                      >
                        {a.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Health Tips */}
            <div className="mt-4 bg-gradient-to-r from-green-50 to-teal-50 dark:from-slate-800 dark:to-slate-800 rounded-2xl p-5 border border-green-100 dark:border-slate-700">
              <h3 className="font-semibold text-green-800 dark:text-green-400 mb-3">
                💡 Health Tips
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: "💧", tip: "Drink 8 glasses of water daily" },
                  { icon: "🏃", tip: "30 minutes exercise daily" },
                  { icon: "😴", tip: "Get 7-8 hours of sleep" },
                  { icon: "🥗", tip: "Eat balanced diet" },
                ].map((item) => (
                  <div
                    key={item.tip}
                    className="flex items-center gap-2 bg-white dark:bg-slate-700 rounded-xl p-3"
                  >
                    <span className="text-xl">{item.icon}</span>
                    <p className="text-xs text-slate-600 dark:text-slate-200">{item.tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
