"use client";

import { useCallback, useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { AccessGuard } from "@/components/AccessGuard";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  type AdminAnalytics,
  type AnalyticsRecentToken,
  emptyAdminAnalytics,
} from "@/lib/admin-analytics";
import { getIndiaDate } from "@/lib/scheduling";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalTokens: 0,
    completed: 0,
    waiting: 0,
    skipped: 0,
    totalDoctors: 0,
    totalPatients: 0,
    totalAppointments: 0,
    avgWaitTime: 0,
  });
  const [departmentData, setDepartmentData] = useState<
    { name: string; value: number }[]
  >([]);
  const [tokenTrend, setTokenTrend] = useState<
    { time: string; tokens: number; completed: number }[]
  >([]);
  const [recentTokens, setRecentTokens] = useState<AnalyticsRecentToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    const today = getIndiaDate();
    const { data, error } = await supabase.rpc("get_admin_analytics", {
      requested_start: today,
      requested_end: today,
    });

    if (error) {
      setLoadError(error.message);
      setLoading(false);
      return;
    }

    const analytics = (data || emptyAdminAnalytics) as AdminAnalytics;
    setStats({
      totalTokens: analytics.totalTokens,
      completed: analytics.completed,
      waiting: analytics.waiting,
      skipped: analytics.skipped,
      totalDoctors: analytics.totalDoctors,
      totalPatients: analytics.totalPatients,
      totalAppointments: analytics.totalAppointments,
      avgWaitTime: analytics.avgWaitMinutes,
    });
    setDepartmentData(analytics.byDepartment);
    setTokenTrend(
      analytics.byHour.map((point) => ({
        time: point.time || "",
        tokens: point.tokens,
        completed: point.completed,
      })),
    );
    setRecentTokens(analytics.recentTokens);
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchDashboardData();
  }, [fetchDashboardData]);

  const statCards = [
    {
      label: "Total Tokens Today",
      value: stats.totalTokens,
      icon: "🎫",
      color: "bg-blue-500",
      change: "Today",
    },
    {
      label: "Served Tokens",
      value: stats.completed,
      icon: "✅",
      color: "bg-green-500",
      change: "Actual",
    },
    {
      label: "Avg Waiting Time",
      value: `${stats.avgWaitTime} mins`,
      icon: "⏱️",
      color: "bg-orange-500",
      change: "Actual",
    },
    {
      label: "Active Doctors",
      value: stats.totalDoctors,
      icon: "👨‍⚕️",
      color: "bg-purple-500",
      change: "Active",
    },
    {
      label: "Total Patients",
      value: stats.totalPatients,
      icon: "🚶",
      color: "bg-cyan-500",
      change: "All time",
    },
  ];

  const getStatusColor = (status: string) => {
    if (status === "waiting") return "bg-blue-100 text-blue-700";
    if (status === "called") return "bg-yellow-100 text-yellow-700";
    if (status === "completed") return "bg-green-100 text-green-700";
    if (status === "skipped") return "bg-gray-100 text-gray-700";
    return "bg-red-100 text-red-700";
  };

  return (
    <main className="min-h-screen bg-slate-100 dark:bg-slate-950 transition-colors">
      <Navbar />
      <AccessGuard requiredRole="admin">
        <div className="flex min-w-0">
          {/* Sidebar */}
        <aside className="w-64 min-h-screen bg-blue-900 text-white p-4 hidden lg:block">
          <div className="mb-8">
            <h2 className="text-xl font-bold">Smart Hospital</h2>
            <p className="text-blue-300 text-sm">Queue Management System</p>
          </div>
          <nav className="space-y-2">
            {[
              { href: "/admin/dashboard", label: "Dashboard", icon: "🏠" },
              { href: "/admin/queues", label: "Live Queue", icon: "📋" },
              { href: "/admin/hospitals", label: "Hospitals", icon: "🏥" },
              { href: "/admin/departments", label: "Departments", icon: "🏢" },
              { href: "/admin/doctors", label: "Doctors", icon: "👨‍⚕️" },
              { href: "/admin/schedules", label: "Schedules", icon: "📅" },
              { href: "/admin/analytics", label: "Analytics", icon: "📊" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-800 transition"
              >
                <span>{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>
          <div className="mt-8 p-4 bg-blue-800 rounded-lg">
            <p className="text-blue-200 text-xs">
              Reduce Waiting Time. Improve Service Flow. Deliver Better Patient
              Experience.
            </p>
          </div>
        </aside>

        {/* Main Content */}
        <div className="min-w-0 flex-1 p-4 sm:p-6">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Dashboard</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Monitor your queue system performance in real-time
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {new Date().toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  loadError
                    ? "bg-red-100 text-red-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {loadError ? "Analytics unavailable" : "Live data connected"}
              </span>
            </div>
          </div>

          {loadError && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
              {loadError}
            </div>
          )}

          {loading ? (
            <p className="text-slate-500">Loading dashboard...</p>
          ) : (
            <>
              {/* Stat Cards */}
              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                {statCards.map((card) => (
                  <div
                    key={card.label}
                    className={`${card.color} rounded-xl p-4 text-white`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{card.icon}</span>
                      <span className="rounded-full bg-white/20 px-2 py-1 text-xs">
                        {card.change}
                      </span>
                    </div>
                    <p className="text-2xl font-bold">{card.value}</p>
                    <p className="text-xs opacity-80 mt-1">{card.label}</p>
                  </div>
                ))}
              </div>

              {/* Charts Row */}
              <div className="grid lg:grid-cols-2 gap-6 mb-6">
                {/* Line Chart */}
                <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
                  <h3 className="font-semibold text-slate-800 dark:text-white mb-4">
                    Tokens Overview
                  </h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={tokenTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="tokens"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={false}
                        name="Total Tokens"
                      />
                      <Line
                        type="monotone"
                        dataKey="completed"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={false}
                        name="Served Tokens"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Pie Chart */}
                <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
                  <h3 className="font-semibold text-slate-800 dark:text-white mb-4">
                    Tokens by Department
                  </h3>
                  {departmentData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={departmentData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          dataKey="value"
                        >
                          {departmentData.map((_, index) => (
                            <Cell
                              key={index}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-48 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-slate-300 dark:text-slate-600">
                          {stats.totalTokens}
                        </div>
                        <p className="text-slate-400 text-sm mt-2">
                          Total Tokens
                        </p>
                        <div className="mt-4 space-y-2">
                          {[
                            {
                              label: "Completed",
                              value: stats.completed,
                              color: "bg-green-500",
                            },
                            {
                              label: "Waiting",
                              value: stats.waiting,
                              color: "bg-blue-500",
                            },
                            {
                              label: "Skipped",
                              value: stats.skipped,
                              color: "bg-red-500",
                            },
                          ].map((item) => (
                            <div
                              key={item.label}
                              className="flex items-center gap-2 text-sm"
                            >
                              <div
                                className={`w-3 h-3 rounded-full ${item.color}`}
                              />
                              <span className="text-slate-600 dark:text-slate-300">
                                {item.label}: {item.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Row */}
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Live Queue Table */}
                <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6 lg:col-span-2">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-800 dark:text-white">Live Queue</h3>
                    <Link
                      href="/admin/queues"
                      className="text-blue-600 dark:text-blue-400 text-sm hover:underline"
                    >
                      View All
                    </Link>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[520px]">
                      <thead>
                        <tr className="border-b border-slate-200 text-left text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                          <th className="pb-2">Token No.</th>
                          <th className="pb-2">Patient</th>
                          <th className="pb-2">Department</th>
                          <th className="pb-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentTokens.length === 0 ? (
                          <tr>
                            <td
                              colSpan={4}
                              className="py-4 text-center text-sm text-slate-400"
                            >
                              No tokens yet
                            </td>
                          </tr>
                        ) : (
                          recentTokens.map((t) => (
                            <tr key={t.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                              <td className="py-3">
                                <span className="rounded bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700">
                                  #{t.token_number}
                                </span>
                              </td>
                              <td className="py-3 text-sm text-slate-700 dark:text-slate-200">
                                {t.patient_name || "Patient"}
                              </td>
                              <td className="py-3 text-sm text-slate-500 dark:text-slate-400">
                                {t.department_name || t.specialization || "General"}
                              </td>
                              <td className="py-3">
                                <span
                                  className={`rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(t.status)}`}
                                >
                                  {t.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                  <h3 className="font-semibold text-slate-800 dark:text-white mb-4">
                    System Overview
                  </h3>
                  <div className="space-y-4">
                    {[
                      {
                        label: "Total Appointments",
                        value: stats.totalAppointments,
                        icon: "📅",
                        color: "text-blue-600",
                      },
                      {
                        label: "Waiting Patients",
                        value: stats.waiting,
                        icon: "⏳",
                        color: "text-orange-600",
                      },
                      {
                        label: "Completed Today",
                        value: stats.completed,
                        icon: "✅",
                        color: "text-green-600",
                      },
                      {
                        label: "Skipped",
                        value: stats.skipped,
                        icon: "⏭️",
                        color: "text-red-600",
                      },
                      {
                        label: "Active Doctors",
                        value: stats.totalDoctors,
                        icon: "👨‍⚕️",
                        color: "text-purple-600",
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800"
                      >
                        <div className="flex items-center gap-2">
                          <span>{item.icon}</span>
                          <span className="text-sm text-slate-600 dark:text-slate-300">
                            {item.label}
                          </span>
                        </div>
                        <span className={`font-bold ${item.color}`}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div
                    className={`mt-4 rounded-lg p-3 ${
                      loadError ? "bg-red-50" : "bg-green-50"
                    }`}
                  >
                    <p
                      className={`text-xs font-semibold ${
                        loadError ? "text-red-700" : "text-green-700"
                      }`}
                    >
                      System Status
                    </p>
                    <p
                      className={`text-sm font-bold ${
                        loadError ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {loadError ? "Database check failed" : "Operational"}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AccessGuard>
  </main>
);
}
