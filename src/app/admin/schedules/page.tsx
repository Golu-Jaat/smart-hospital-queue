"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/lib/supabase";

type Doctor = {
  id: string;
  specialization: string;
  profiles: any;
};
type Schedule = {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  max_patients: number;
  is_active: boolean;
  doctors: { specialization: string; profiles: any };
};

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function AdminSchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [doctorId, setDoctorId] = useState("");
  const [day, setDay] = useState("1");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [maxPatients, setMaxPatients] = useState("20");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const { data: d } = await supabase
      .from("doctors")
      .select("id, specialization, profiles(full_name)")
      .eq("is_active", true);
    setDoctors(d || []);
    const { data: s } = await supabase
      .from("doctor_schedules")
      .select("*, doctors(specialization, profiles(full_name))")
      .order("day_of_week");
    setSchedules(s || []);
    setLoading(false);
  };

  const handleAdd = async () => {
    setSaving(true);
    await supabase.from("doctor_schedules").insert({
      doctor_id: doctorId,
      day_of_week: parseInt(day),
      start_time: startTime,
      end_time: endTime,
      max_patients: parseInt(maxPatients),
      is_active: true,
    });
    setDoctorId("");
    setDay("1");
    setStartTime("09:00");
    setEndTime("17:00");
    setMaxPatients("20");
    setShowForm(false);
    fetchAll();
    setSaving(false);
  };

  const deleteSchedule = async (id: string) => {
    await supabase.from("doctor_schedules").delete().eq("id", id);
    fetchAll();
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-950">
            Schedule Management
          </h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-lg bg-blue-700 px-4 py-2 text-white hover:bg-blue-800"
          >
            {showForm ? "Cancel" : "+ Add Schedule"}
          </button>
        </div>

        {showForm && (
          <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold mb-4">Add Doctor Schedule</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <select
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                className="rounded-lg border border-slate-300 px-4 py-2"
              >
                <option value="">Select Doctor</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.profiles?.full_name} — {d.specialization}
                  </option>
                ))}
              </select>
              <select
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className="rounded-lg border border-slate-300 px-4 py-2"
              >
                {DAYS.map((d, i) => (
                  <option key={i} value={i}>
                    {d}
                  </option>
                ))}
              </select>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="rounded-lg border border-slate-300 px-4 py-2"
              />
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="rounded-lg border border-slate-300 px-4 py-2"
              />
              <input
                type="number"
                placeholder="Max Patients"
                value={maxPatients}
                onChange={(e) => setMaxPatients(e.target.value)}
                className="rounded-lg border border-slate-300 px-4 py-2"
              />
            </div>
            <button
              onClick={handleAdd}
              disabled={saving || !doctorId}
              className="mt-4 rounded-lg bg-blue-700 px-6 py-2 text-white hover:bg-blue-800 disabled:bg-slate-300"
            >
              {saving ? "Saving..." : "Save Schedule"}
            </button>
          </div>
        )}

        <div className="mt-6 grid gap-4">
          {loading ? (
            <p className="text-slate-500">Loading...</p>
          ) : schedules.length === 0 ? (
            <p className="text-slate-500">No schedules added yet.</p>
          ) : (
            schedules.map((s) => (
              <div
                key={s.id}
                className="rounded-lg border border-slate-200 bg-white p-5 flex items-center justify-between"
              >
                <div>
                  <h3 className="font-semibold text-slate-800">
                    {s.doctors?.profiles?.full_name} —{" "}
                    {s.doctors?.specialization}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {DAYS[s.day_of_week]} • {s.start_time} - {s.end_time} • Max:{" "}
                    {s.max_patients} patients
                  </p>
                </div>
                <button
                  onClick={() => deleteSchedule(s.id)}
                  className="rounded px-3 py-1 text-sm bg-red-100 text-red-700"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
