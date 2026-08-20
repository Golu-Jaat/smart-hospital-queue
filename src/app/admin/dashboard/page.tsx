"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
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
  BarChart,
  Bar,
} from "recharts";

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
  const [recentTokens, setRecentTokens] = useState<
    {
      id: string;
      token_number: number;
      status: string;
      profiles: { full_name: string };
      queues: { doctors: { specialization: string } };
    }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);

    const [
      { count: totalTokens },
      { count: completed },
      { count: waiting },
      { count: skipped },
      { count: totalDoctors },
      { count: totalPatients },
      { count: totalAppointments },
    ] = await Promise.all([
      supabase.from("tokens").select("*", { count: "exact", head: true }),
      supabase
        .from("tokens")
        .select("*", { count: "exact", head: true })
        .eq("status", "completed"),
      supabase
        .from("tokens")
        .select("*", { count: "exact", head: true })
        .eq("status", "waiting"),
      supabase
        .from("tokens")
        .select("*", { count: "exact", head: true })
        .eq("status", "skipped"),
      supabase
        .from("doctors")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true),
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "patient"),
      supabase.from("appointments").select("*", { count: "exact", head: true }),
    ]);

    setStats({
      totalTokens: totalTokens || 0,
      completed: completed || 0,
      waiting: waiting || 0,
      skipped: skipped || 0,
      totalDoctors: totalDoctors || 0,
      totalPatients: totalPatients || 0,
      totalAppointments: totalAppointments || 0,
      avgWaitTime: 10,
    });

    // Department data
    const { data: depts } = await supabase
      .from("departments")
      .select("name, tokens(count)");

    const { data: deptTokens } = await supabase
      .from("tokens")
      .select("queue_id, queues(department_id, departments(name))")
      .limit(100);

    const deptMap: Record<string, number> = {};
    deptTokens?.forEach((t: any) => {
      const name = t.queues?.departments?.name || "Unknown";
      deptMap[name] = (deptMap[name] || 0) + 1;
    });
    setDepartmentData(
      Object.entries(deptMap).map(([name, value]) => ({ name, value })),
    );

    // Token trend (mock hourly data)
    const trend = Array.from({ length: 8 }, (_, i) => ({
      time: `${8 + i}:00`,
      tokens: Math.floor(Math.random() * 50) + 10,
      completed: Math.floor(Math.random() * 40) + 5,
    }));
    setTokenTrend(trend);

    // Recent tokens
    const { data: recent } = await supabase
      .from("tokens")
      .select(
        "id, token_number, status, profiles(full_name), queues(doctors(specialization))",
      )
      .order("joined_at", { ascending: false })
      .limit(5);
    setRecentTokens(recent || []);

    setLoading(false);
  };

  const statCards = [
    {
      label: "Total Tokens Today",
      value: stats.totalTokens,
      icon: "🎫",
      color: "bg-blue-500",
      change: "+12.5%",
    },
    {
      label: "Served Tokens",
      value: stats.completed,
      icon: "✅",
      color: "bg-green-500",
      change: "+10.3%",
    },
    {
      label: "Avg Waiting Time",
      value: `${stats.avgWaitTime} mins`,
      icon: "⏱️",
      color: "bg-orange-500",
      change: "-5.6%",
    },
    {
      label: "Active Doctors",
      value: stats.totalDoctors,
      icon: "👨‍⚕️",
      color: "bg-purple-500",
      change: "+0%",
    },
    {
      label: "Total Patients",
      value: stats.totalPatients,
      icon: "🚶",
      color: "bg-cyan-500",
      change: "+8.7%",
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
    <main className="min-h-screen bg-slate-100">
      <Navbar />
      <div className="flex">
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
        <div className="flex-1 p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
              <p className="text-slate-500 text-sm">
                Monitor your queue system performance in real-time
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500">
                {new Date().toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                All Systems Operational
              </span>
            </div>
          </div>

          {loading ? (
            <p className="text-slate-500">Loading dashboard...</p>
          ) : (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                {statCards.map((card) => (
                  <div
                    key={card.label}
                    className={`${card.color} rounded-xl p-4 text-white`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{card.icon}</span>
                      <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">
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
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="font-semibold text-slate-800 mb-4">
                    Tokens Overview
                  </h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={tokenTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
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
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="font-semibold text-slate-800 mb-4">
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
                        <div className="text-4xl font-bold text-slate-300">
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
                              <span className="text-slate-600">
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
                <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-800">Live Queue</h3>
                    <Link
                      href="/admin/queues"
                      className="text-blue-600 text-sm hover:underline"
                    >
                      View All
                    </Link>
                  </div>
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs text-slate-500 border-b">
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
                            className="py-4 text-center text-slate-400 text-sm"
                          >
                            No tokens yet
                          </td>
                        </tr>
                      ) : (
                        recentTokens.map((t) => (
                          <tr key={t.id} className="border-b last:border-0">
                            <td className="py-3">
                              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">
                                #{t.token_number}
                              </span>
                            </td>
                            <td className="py-3 text-sm text-slate-700">
                              {t.profiles?.full_name}
                            </td>
                            <td className="py-3 text-sm text-slate-500">
                              {t.queues?.doctors?.specialization}
                            </td>
                            <td className="py-3">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(t.status)}`}
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

                {/* Quick Stats */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="font-semibold text-slate-800 mb-4">
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
                        className="flex items-center justify-between py-2 border-b border-slate-50"
                      >
                        <div className="flex items-center gap-2">
                          <span>{item.icon}</span>
                          <span className="text-sm text-slate-600">
                            {item.label}
                          </span>
                        </div>
                        <span className={`font-bold ${item.color}`}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <p className="text-green-700 text-xs font-semibold">
                      System Status
                    </p>
                    <p className="text-green-600 text-sm font-bold">
                      All Systems Operational ✅
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
