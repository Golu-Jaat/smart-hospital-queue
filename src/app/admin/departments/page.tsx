"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { AccessGuard } from "@/components/AccessGuard";

type Hospital = { id: string; name: string };
type Department = {
  id: string;
  hospital_id: string;
  name: string;
  description: string;
  is_active: boolean;
  hospitals: { name: string };
};

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [hospitalId, setHospitalId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const { data: h } = await supabase
      .from("hospitals")
      .select("id, name")
      .eq("is_active", true);
    setHospitals(h || []);
    const { data: d } = await supabase
      .from("departments")
      .select("*, hospitals(name)")
      .order("name");
    setDepartments(d || []);
    setLoading(false);
  };

  const handleAdd = async () => {
    setSaving(true);
    await supabase.from("departments").insert({
      hospital_id: hospitalId,
      name,
      description,
      is_active: true,
    });
    setName("");
    setDescription("");
    setHospitalId("");
    setShowForm(false);
    fetchAll();
    setSaving(false);
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase
      .from("departments")
      .update({ is_active: !current })
      .eq("id", id);
    fetchAll();
  };

  const deleteDept = async (id: string) => {
    await supabase.from("departments").delete().eq("id", id);
    fetchAll();
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />
      <AccessGuard requiredRole="admin">
        <section className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-slate-950 sm:text-3xl">
            Department Management
          </h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="w-full rounded-lg bg-blue-700 px-4 py-2 text-white hover:bg-blue-800 sm:w-auto"
          >
            {showForm ? "Cancel" : "+ Add Department"}
          </button>
        </div>

        {showForm && (
          <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
            <h2 className="text-lg font-semibold mb-4">Add New Department</h2>
            <div className="grid gap-4 sm:grid-cols-2">
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
              <input
                placeholder="Department Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-lg border border-slate-300 px-4 py-2"
              />
              <input
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="rounded-lg border border-slate-300 px-4 py-2 sm:col-span-2"
              />
            </div>
            <button
              onClick={handleAdd}
              disabled={saving || !name || !hospitalId}
              className="mt-4 w-full rounded-lg bg-blue-700 px-6 py-2 text-white hover:bg-blue-800 disabled:bg-slate-300 sm:w-auto"
            >
              {saving ? "Saving..." : "Save Department"}
            </button>
          </div>
        )}

        <div className="mt-6 grid gap-4">
          {loading ? (
            <p className="text-slate-500">Loading...</p>
          ) : departments.length === 0 ? (
            <p className="text-slate-500">No departments added yet.</p>
          ) : (
            departments.map((d) => (
              <div
                key={d.id}
                className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
              >
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-800">{d.name}</h3>
                  <p className="break-words text-sm text-slate-500">
                    {d.hospitals?.name} • {d.description}
                  </p>
                </div>
                <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:flex-nowrap">
                  <button
                    onClick={() => toggleActive(d.id, d.is_active)}
                    className={`flex-1 rounded px-3 py-1 text-sm sm:flex-none ${d.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                  >
                    {d.is_active ? "Active" : "Inactive"}
                  </button>
                  <button
                    onClick={() => deleteDept(d.id)}
                    className="flex-1 rounded bg-red-100 px-3 py-1 text-sm text-red-700 sm:flex-none"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </AccessGuard>
  </main>
);
}
