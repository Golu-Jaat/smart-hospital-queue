"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { AccessGuard } from "@/components/AccessGuard";

type Hospital = { id: string; name: string };
type Department = { id: string; name: string; hospital_id: string };
type Doctor = {
  id: string;
  specialization: string;
  room_number: string;
  average_consultation_minutes: number;
  is_active: boolean;
  profiles: { full_name: string };
  departments: { name: string };
  hospitals: { name: string };
};

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filteredDepts, setFilteredDepts] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [hospitalId, setHospitalId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [room, setRoom] = useState("");
  const [avgTime, setAvgTime] = useState("10");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    setFilteredDepts(departments.filter((d) => d.hospital_id === hospitalId));
    setDepartmentId("");
  }, [hospitalId, departments]);

  const fetchAll = async () => {
    setLoading(true);
    const { data: h } = await supabase
      .from("hospitals")
      .select("id, name")
      .eq("is_active", true);
    setHospitals(h || []);
    const { data: d } = await supabase
      .from("departments")
      .select("id, name, hospital_id")
      .eq("is_active", true);
    setDepartments(d || []);
    const { data: doc } = await supabase
      .from("doctors")
      .select("*, profiles(full_name), departments(name), hospitals(name)");
    setDoctors(doc || []);
    setLoading(false);
  };

  const handleAdd = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          hospitalId,
          departmentId,
          specialization,
          roomNumber: room,
          averageConsultationMinutes: Number(avgTime),
        }),
      });
      const result = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        setError(result.error || "Failed to create doctor.");
        return;
      }

      setSuccess(result.message || "Doctor invitation sent.");
    } catch {
      setError("Unable to reach the doctor invitation service.");
      return;
    } finally {
      setSaving(false);
    }

    setShowForm(false);
    setFullName("");
    setEmail("");
    setSpecialization("");
    setRoom("");
    setAvgTime("10");
    setHospitalId("");
    setDepartmentId("");
    await fetchAll();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("doctors").update({ is_active: !current }).eq("id", id);
    fetchAll();
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />
      <AccessGuard requiredRole="admin">
        <section className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-slate-950 sm:text-3xl">
            Doctor Management
          </h1>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setError("");
              setSuccess("");
            }}
            className="w-full rounded-lg bg-blue-700 px-4 py-2 text-white hover:bg-blue-800 sm:w-auto"
          >
            {showForm ? "Cancel" : "+ Add Doctor"}
          </button>
        </div>

        {success && (
          <p className="mt-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            {success}
          </p>
        )}

        {showForm && (
          <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
            <h2 className="text-lg font-semibold mb-4">Add New Doctor</h2>
            {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="rounded-lg border border-slate-300 px-4 py-2"
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-lg border border-slate-300 px-4 py-2"
              />
              <select
                value={hospitalId}
                onChange={(e) => setHospitalId(e.target.value)}
                className="rounded-lg border border-slate-300 px-4 py-2"
              >
                <option value="">Select Hospital</option>
                {hospitals.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="rounded-lg border border-slate-300 px-4 py-2"
                disabled={!hospitalId}
              >
                <option value="">Select Department</option>
                {filteredDepts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <input
                placeholder="Specialization"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                className="rounded-lg border border-slate-300 px-4 py-2"
              />
              <input
                placeholder="Room Number"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="rounded-lg border border-slate-300 px-4 py-2"
              />
              <input
                placeholder="Avg Consultation Time (minutes)"
                value={avgTime}
                onChange={(e) => setAvgTime(e.target.value)}
                type="number"
                className="rounded-lg border border-slate-300 px-4 py-2"
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              The doctor will receive a secure email invitation to set a password.
            </p>
            <button
              onClick={handleAdd}
              disabled={
                saving ||
                !fullName ||
                !email ||
                !hospitalId ||
                !departmentId ||
                !specialization
              }
              className="mt-4 w-full rounded-lg bg-blue-700 px-6 py-2 text-white hover:bg-blue-800 disabled:bg-slate-300 sm:w-auto"
            >
              {saving ? "Saving..." : "Save Doctor"}
            </button>
          </div>
        )}

        <div className="mt-6 grid gap-4">
          {loading ? (
            <p className="text-slate-500">Loading...</p>
          ) : doctors.length === 0 ? (
            <p className="text-slate-500">No doctors added yet.</p>
          ) : (
            doctors.map((d) => (
              <div
                key={d.id}
                className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
              >
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-800">
                    {d.profiles?.full_name}
                  </h3>
                  <p className="break-words text-sm text-slate-500">
                    {d.specialization} • {d.departments?.name} •{" "}
                    {d.hospitals?.name}
                  </p>
                  <p className="text-sm text-slate-500">
                    Room: {d.room_number} • Avg:{" "}
                    {d.average_consultation_minutes} min
                  </p>
                </div>
                <button
                  onClick={() => toggleActive(d.id, d.is_active)}
                  className={`w-full rounded px-3 py-1 text-sm sm:w-auto ${d.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                >
                  {d.is_active ? "Active" : "Inactive"}
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </AccessGuard>
  </main>
);
}
