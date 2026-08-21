"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/lib/supabase";

type Stats = {
  totalPatients: number;
  totalTokens: number;
  waiting: number;
  completed: number;
  skipped: number;
  cancelled: number;
  totalAppointments: number;
  totalHospitals: number;
  totalDoctors: number;
  totalDepartments: number;
};

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<Stats>({
    totalPatients: 0,
    totalTokens: 0,
    waiting: 0,
    completed: 0,
    skipped: 0,
    cancelled: 0,
    totalAppointments: 0,
    totalHospitals: 0,
    totalDoctors: 0,
    totalDepartments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);

    const [
      { count: totalPatients },
      { count: totalTokens },
      { count: waiting },
      { count: completed },
      { count: skipped },
      { count: cancelled },
      { count: totalAppointments },
      { count: totalHospitals },
      { count: totalDoctors },
      { count: totalDepartments },
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "patient"),
      supabase.from("tokens").select("*", { count: "exact", head: true }),
      supabase
        .from("tokens")
        .select("*", { count: "exact", head: true })
        .eq("status", "waiting"),
      supabase
        .from("tokens")
        .select("*", { count: "exact", head: true })
        .eq("status", "completed"),
      supabase
        .from("tokens")
        .select("*", { count: "exact", head: true })
        .eq("status", "skipped"),
      supabase
        .from("tokens")
        .select("*", { count: "exact", head: true })
        .eq("status", "cancelled"),
      supabase.from("appointments").select("*", { count: "exact", head: true }),
      supabase
        .from("hospitals")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true),
      supabase
        .from("doctors")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true),
      supabase
        .from("departments")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true),
    ]);

    setStats({
      totalPatients: totalPatients || 0,
      totalTokens: totalTokens || 0,
      waiting: waiting || 0,
      completed: completed || 0,
      skipped: skipped || 0,
      cancelled: cancelled || 0,
      totalAppointments: totalAppointments || 0,
      totalHospitals: totalHospitals || 0,
      totalDoctors: totalDoctors || 0,
      totalDepartments: totalDepartments || 0,
    });
    setLoading(false);
  };

  const cards = [
    {
      label: "Total Patients",
      value: stats.totalPatients,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Total Hospitals",
      value: stats.totalHospitals,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Total Doctors",
      value: stats.totalDoctors,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      label: "Total Departments",
      value: stats.totalDepartments,
      color: "text-cyan-600",
      bg: "bg-cyan-50",
    },
    {
      label: "Total Appointments",
      value: stats.totalAppointments,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      label: "Total Tokens",
      value: stats.totalTokens,
      color: "text-slate-600",
      bg: "bg-slate-50",
    },
    {
      label: "Waiting",
      value: stats.waiting,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
    },
    {
      label: "Completed",
      value: stats.completed,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Skipped",
      value: stats.skipped,
      color: "text-red-600",
      bg: "bg-red-50",
    },
    {
      label: "Cancelled",
      value: stats.cancelled,
      color: "text-rose-600",
      bg: "bg-rose-50",
    },
  ];

  const clearanceRate = stats.totalTokens > 0 ? Math.round((stats.completed / stats.totalTokens) * 100) : 0;
  const timeSavedHours = Math.round((stats.completed * 20) / 60);

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      <Navbar />
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-950 dark:text-white">Hospital Analytics</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              OPD throughput, token efficiency and system performance metrics
            </p>
          </div>
          <button
            onClick={fetchStats}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition"
          >
            🔄 Refresh Data
          </button>
        </div>

        {/* Top KPI Banners */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white shadow-md">
            <p className="text-xs uppercase tracking-wider text-blue-200 font-semibold">Queue Clearance Rate</p>
            <p className="text-4xl font-black mt-2 font-mono">{clearanceRate}%</p>
            <p className="text-xs text-blue-100 mt-1">{stats.completed} of {stats.totalTokens} tokens served</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-5 text-white shadow-md">
            <p className="text-xs uppercase tracking-wider text-emerald-200 font-semibold">Patient Wait Time Saved</p>
            <p className="text-4xl font-black mt-2 font-mono">~{timeSavedHours} hrs</p>
            <p className="text-xs text-emerald-100 mt-1">Via automated queue scheduling</p>
          </div>
          <div className="bg-gradient-to-br from-purple-600 to-violet-700 rounded-2xl p-5 text-white shadow-md">
            <p className="text-xs uppercase tracking-wider text-purple-200 font-semibold">Active Doctor Capacity</p>
            <p className="text-4xl font-black mt-2 font-mono">{stats.totalDoctors}</p>
            <p className="text-xs text-purple-100 mt-1">Across {stats.totalDepartments} hospital departments</p>
          </div>
        </div>

        {loading ? (
          <p className="mt-6 text-slate-500 dark:text-slate-400">Loading metrics...</p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {cards.map((card) => (
              <div
                key={card.label}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 text-center shadow-sm"
              >
                <p className="text-xs text-slate-500 dark:text-slate-400">{card.label}</p>
                <p className={`text-3xl font-black mt-1 font-mono ${card.color}`}>
                  {card.value}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <h2 className="font-bold text-slate-800 dark:text-white mb-4">
              Token Status Breakdown
            </h2>
            <div className="space-y-4">
              {[
                {
                  label: "Waiting",
                  value: stats.waiting,
                  total: stats.totalTokens,
                  color: "bg-yellow-400",
                },
                {
                  label: "Completed",
                  value: stats.completed,
                  total: stats.totalTokens,
                  color: "bg-green-500",
                },
                {
                  label: "Skipped",
                  value: stats.skipped,
                  total: stats.totalTokens,
                  color: "bg-red-500",
                },
                {
                  label: "Cancelled",
                  value: stats.cancelled,
                  total: stats.totalTokens,
                  color: "bg-rose-400",
                },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-slate-600 dark:text-slate-300 font-medium">{item.label}</span>
                    <span className="font-bold text-slate-900 dark:text-white">{item.value}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`${item.color} h-2.5 rounded-full transition-all duration-500`}
                      style={{
                        width:
                          item.total > 0
                            ? `${(item.value / item.total) * 100}%`
                            : "0%",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <h2 className="font-bold text-slate-800 dark:text-white mb-4">
              Infrastructure Summary
            </h2>
            <div className="space-y-3">
              {[
                { label: "Active Hospitals", value: stats.totalHospitals, icon: "🏥" },
                { label: "Active Doctors", value: stats.totalDoctors, icon: "👨‍⚕️" },
                { label: "Active Departments", value: stats.totalDepartments, icon: "🏢" },
                { label: "Registered Patients", value: stats.totalPatients, icon: "👥" },
                { label: "Total Appointments", value: stats.totalAppointments, icon: "📅" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0"
                >
                  <span className="text-slate-600 dark:text-slate-300 text-sm flex items-center gap-2">
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </span>
                  <span className="font-bold text-slate-800 dark:text-white font-mono">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
