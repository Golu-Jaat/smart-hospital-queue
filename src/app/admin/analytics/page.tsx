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

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-950">Analytics</h1>
          <button
            onClick={fetchStats}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="mt-6 text-slate-500">Loading...</p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {cards.map((card) => (
              <div
                key={card.label}
                className={`rounded-lg border border-slate-200 ${card.bg} p-5 text-center`}
              >
                <p className="text-sm text-slate-500">{card.label}</p>
                <p className={`text-3xl font-bold mt-1 ${card.color}`}>
                  {card.value}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="font-semibold text-slate-800 mb-4">
              Token Status Breakdown
            </h2>
            <div className="space-y-3">
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
                  color: "bg-green-400",
                },
                {
                  label: "Skipped",
                  value: stats.skipped,
                  total: stats.totalTokens,
                  color: "bg-red-400",
                },
                {
                  label: "Cancelled",
                  value: stats.cancelled,
                  total: stats.totalTokens,
                  color: "bg-rose-400",
                },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">{item.label}</span>
                    <span className="font-semibold">{item.value}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className={`${item.color} h-2 rounded-full`}
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

          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="font-semibold text-slate-800 mb-4">
              System Overview
            </h2>
            <div className="space-y-3">
              {[
                { label: "Active Hospitals", value: stats.totalHospitals },
                { label: "Active Doctors", value: stats.totalDoctors },
                { label: "Active Departments", value: stats.totalDepartments },
                { label: "Total Patients", value: stats.totalPatients },
                { label: "Total Appointments", value: stats.totalAppointments },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex justify-between py-2 border-b border-slate-100"
                >
                  <span className="text-slate-600 text-sm">{item.label}</span>
                  <span className="font-semibold text-slate-800">
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
