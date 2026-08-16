"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/lib/supabase";

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

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: "Doctor@123",
    });

    if (authError || !authData.user) {
      setError(authError?.message || "Failed to create user");
      setSaving(false);
      return;
    }

    // Create profile
    await supabase.from("profiles").insert({
      id: authData.user.id,
      full_name: fullName,
      email,
      role: "doctor",
      hospital_id: hospitalId,
    });

    // Create doctor
    await supabase.from("doctors").insert({
      hospital_id: hospitalId,
      department_id: departmentId,
      profile_id: authData.user.id,
      specialization,
      room_number: room,
      average_consultation_minutes: parseInt(avgTime),
      is_active: true,
    });

    setShowForm(false);
    setFullName("");
    setEmail("");
    setSpecialization("");
    setRoom("");
    setAvgTime("10");
    setHospitalId("");
    setDepartmentId("");
    fetchAll();
    setSaving(false);
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("doctors").update({ is_active: !current }).eq("id", id);
    fetchAll();
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-950">
            Doctor Management
          </h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-lg bg-blue-700 px-4 py-2 text-white hover:bg-blue-800"
          >
            {showForm ? "Cancel" : "+ Add Doctor"}
          </button>
        </div>

        {showForm && (
          <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
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
              Default password: Doctor@123 (doctor can change later)
            </p>
            <button
              onClick={handleAdd}
              disabled={
                saving || !fullName || !email || !hospitalId || !departmentId
              }
              className="mt-4 rounded-lg bg-blue-700 px-6 py-2 text-white hover:bg-blue-800 disabled:bg-slate-300"
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
                className="rounded-lg border border-slate-200 bg-white p-5 flex items-center justify-between"
              >
                <div>
                  <h3 className="font-semibold text-slate-800">
                    {d.profiles?.full_name}
                  </h3>
                  <p className="text-sm text-slate-500">
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
                  className={`rounded px-3 py-1 text-sm ${d.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                >
                  {d.is_active ? "Active" : "Inactive"}
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
