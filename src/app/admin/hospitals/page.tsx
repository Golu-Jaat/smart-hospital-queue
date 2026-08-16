"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/lib/supabase";

type Hospital = {
  id: string;
  name: string;
  type: "government" | "private";
  address: string;
  city: string;
  contact_phone: string;
  is_active: boolean;
};

export default function AdminHospitalsPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<"government" | "private">("government");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("hospitals")
      .select("*")
      .order("created_at", { ascending: false });
    setHospitals(data || []);
    setLoading(false);
  };

  const handleAdd = async () => {
    setSaving(true);
    await supabase.from("hospitals").insert({
      name,
      type,
      address,
      city,
      contact_phone: phone,
      is_active: true,
    });
    setName("");
    setType("government");
    setAddress("");
    setCity("");
    setPhone("");
    setShowForm(false);
    fetchHospitals();
    setSaving(false);
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase
      .from("hospitals")
      .update({ is_active: !current })
      .eq("id", id);
    fetchHospitals();
  };

  const deleteHospital = async (id: string) => {
    await supabase.from("hospitals").delete().eq("id", id);
    fetchHospitals();
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-950">
            Hospital Management
          </h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-lg bg-blue-700 px-4 py-2 text-white hover:bg-blue-800"
          >
            {showForm ? "Cancel" : "+ Add Hospital"}
          </button>
        </div>

        {showForm && (
          <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold mb-4">Add New Hospital</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                placeholder="Hospital Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-lg border border-slate-300 px-4 py-2"
              />
              <select
                value={type}
                onChange={(e) =>
                  setType(e.target.value as "government" | "private")
                }
                className="rounded-lg border border-slate-300 px-4 py-2"
              >
                <option value="government">Government</option>
                <option value="private">Private</option>
              </select>
              <input
                placeholder="Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="rounded-lg border border-slate-300 px-4 py-2"
              />
              <input
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="rounded-lg border border-slate-300 px-4 py-2"
              />
              <input
                placeholder="Contact Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="rounded-lg border border-slate-300 px-4 py-2"
              />
            </div>
            <button
              onClick={handleAdd}
              disabled={saving || !name || !city}
              className="mt-4 rounded-lg bg-blue-700 px-6 py-2 text-white hover:bg-blue-800 disabled:bg-slate-300"
            >
              {saving ? "Saving..." : "Save Hospital"}
            </button>
          </div>
        )}

        <div className="mt-6 grid gap-4">
          {loading ? (
            <p className="text-slate-500">Loading...</p>
          ) : hospitals.length === 0 ? (
            <p className="text-slate-500">No hospitals added yet.</p>
          ) : (
            hospitals.map((h) => (
              <div
                key={h.id}
                className="rounded-lg border border-slate-200 bg-white p-5 flex items-center justify-between"
              >
                <div>
                  <h3 className="font-semibold text-slate-800">{h.name}</h3>
                  <p className="text-sm text-slate-500">
                    {h.type} • {h.city} • {h.address}
                  </p>
                  <p className="text-sm text-slate-500">{h.contact_phone}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleActive(h.id, h.is_active)}
                    className={`rounded px-3 py-1 text-sm ${h.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                  >
                    {h.is_active ? "Active" : "Inactive"}
                  </button>
                  <button
                    onClick={() => deleteHospital(h.id)}
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
    </main>
  );
}
