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
        <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-950">
            Department Management
          </h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-lg bg-blue-700 px-4 py-2 text-white hover:bg-blue-800"
          >
            {showForm ? "Cancel" : "+ Add Department"}
          </button>
        </div>

        {showForm && (
          <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
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
              className="mt-4 rounded-lg bg-blue-700 px-6 py-2 text-white hover:bg-blue-800 disabled:bg-slate-300"
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
                className="rounded-lg border border-slate-200 bg-white p-5 flex items-center justify-between"
              >
                <div>
                  <h3 className="font-semibold text-slate-800">{d.name}</h3>
                  <p className="text-sm text-slate-500">
                    {d.hospitals?.name} • {d.description}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleActive(d.id, d.is_active)}
                    className={`rounded px-3 py-1 text-sm ${d.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                  >
                    {d.is_active ? "Active" : "Inactive"}
                  </button>
                  <button
                    onClick={() => deleteDept(d.id)}
                    className="rounded px-3 py-1 text-sm bg-red-100 text-red-700"
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
