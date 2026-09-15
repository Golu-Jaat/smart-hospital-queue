"use client";

import { useState, useEffect, useRef } from "react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

const PRESET_AVATARS = [
  "👨‍⚕️", "👩‍⚕️", "🧑", "👧", "👨", "👵", "🩺", "🦸‍♂️"
];

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

type ProfileData = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  avatar_url?: string;
  blood_group?: string;
  age?: string;
  gender?: string;
  allergies?: string;
  emergency_name?: string;
  emergency_phone?: string;
  address?: string;
};

type HealthProfileRow = {
  avatar_path: string | null;
  avatar_emoji: string | null;
  blood_group: string | null;
  age: number | null;
  gender: string | null;
  allergies: string | null;
  emergency_name: string | null;
  emergency_phone: string | null;
  address: string | null;
};

function isImageAvatar(value?: string) {
  return Boolean(
    value && (value.startsWith("data:") || value.startsWith("http")),
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Failed to update profile";
}

export default function PatientProfilePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [pendingAvatar, setPendingAvatar] = useState<Blob | null>(null);
  const [storedAvatarPath, setStoredAvatarPath] = useState<string | null>(null);
  const [avatarEmoji, setAvatarEmoji] = useState<string | null>(null);

  const [profile, setProfile] = useState<ProfileData>({
    id: "",
    full_name: "",
    email: "",
    phone: "",
    role: "patient",
    avatar_url: "",
    blood_group: "O+",
    age: "",
    gender: "Male",
    allergies: "",
    emergency_name: "",
    emergency_phone: "",
    address: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      // Read legacy browser data once so existing users can migrate it to Supabase.
      const savedLocal = localStorage.getItem(`user_profile_${user.id}`);
      let localData: Partial<ProfileData> = {};
      if (savedLocal) {
        try {
          localData = JSON.parse(savedLocal) as Partial<ProfileData>;
        } catch {}
      }

      const [profileResult, healthResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, phone, role")
          .eq("id", user.id)
          .single(),
        supabase
          .from("patient_health_profiles")
          .select(
            "avatar_path, avatar_emoji, blood_group, age, gender, allergies, emergency_name, emergency_phone, address",
          )
          .eq("patient_id", user.id)
          .maybeSingle<HealthProfileRow>(),
      ]);

      if (profileResult.error) throw profileResult.error;
      if (healthResult.error) throw healthResult.error;

      const dbProfile = profileResult.data;
      const healthProfile = healthResult.data;

      const meta = user.user_metadata || {};

      let avatarUrl = healthProfile?.avatar_emoji || "";
      if (healthProfile?.avatar_path) {
        const { data: signedAvatar, error: avatarError } = await supabase.storage
          .from("profile-avatars")
          .createSignedUrl(healthProfile.avatar_path, 3600);
        if (!avatarError) avatarUrl = signedAvatar.signedUrl;
      }

      setStoredAvatarPath(healthProfile?.avatar_path || null);
      setAvatarEmoji(healthProfile?.avatar_emoji || null);
      setProfile({
        id: user.id,
        full_name: dbProfile?.full_name || meta.full_name || localData.full_name || "",
        email: user.email || "",
        phone: dbProfile?.phone || meta.phone || localData.phone || "",
        role: dbProfile?.role || "patient",
        avatar_url: avatarUrl || localData.avatar_url || meta.avatar_url || "",
        blood_group:
          healthProfile?.blood_group || localData.blood_group || meta.blood_group || "O+",
        age: String(healthProfile?.age ?? localData.age ?? meta.age ?? ""),
        gender: healthProfile?.gender || localData.gender || meta.gender || "Male",
        allergies:
          healthProfile?.allergies || localData.allergies || meta.allergies || "",
        emergency_name:
          healthProfile?.emergency_name ||
          localData.emergency_name ||
          meta.emergency_name ||
          "",
        emergency_phone:
          healthProfile?.emergency_phone ||
          localData.emergency_phone ||
          meta.emergency_phone ||
          "",
        address: healthProfile?.address || localData.address || meta.address || "",
      });
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  };

  // Compress the preview before uploading it to the private avatar bucket.
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("Image size should be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 250;
        const scale = Math.min(MAX_WIDTH / img.width, 1);
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);

        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.85);

        setProfile((prev) => ({ ...prev, avatar_url: compressedBase64 }));
        setAvatarEmoji(null);
        canvas.toBlob(
          (blob) => {
            if (blob) setPendingAvatar(blob);
          },
          "image/jpeg",
          0.85,
        );
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPresetAvatar = (avatar: string) => {
    setProfile((prev) => ({ ...prev, avatar_url: avatar }));
    setAvatarEmoji(avatar);
    setPendingAvatar(null);
  };

  const handleRemovePhoto = () => {
    setProfile((prev) => ({ ...prev, avatar_url: "" }));
    setAvatarEmoji(null);
    setPendingAvatar(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
        })
        .eq("id", profile.id);
      if (profileError) throw profileError;

      let avatarPath = storedAvatarPath;
      let savedAvatarEmoji = avatarEmoji;

      if (pendingAvatar) {
        avatarPath = `${profile.id}/avatar.jpg`;
        const { error: uploadError } = await supabase.storage
          .from("profile-avatars")
          .upload(avatarPath, pendingAvatar, {
            upsert: true,
            contentType: "image/jpeg",
            cacheControl: "3600",
          });
        if (uploadError) throw uploadError;
        savedAvatarEmoji = null;
      } else if (avatarEmoji || !profile.avatar_url) {
        if (storedAvatarPath) {
          const { error: removeError } = await supabase.storage
            .from("profile-avatars")
            .remove([storedAvatarPath]);
          if (removeError) throw removeError;
        }
        avatarPath = null;
      }

      const parsedAge = profile.age ? Number(profile.age) : null;
      if (
        parsedAge !== null &&
        (!Number.isInteger(parsedAge) || parsedAge < 0 || parsedAge > 130)
      ) {
        throw new Error("Age must be a whole number between 0 and 130.");
      }

      const { error: healthError } = await supabase
        .from("patient_health_profiles")
        .upsert({
          patient_id: profile.id,
          avatar_path: avatarPath,
          avatar_emoji: savedAvatarEmoji,
          blood_group: profile.blood_group || null,
          age: parsedAge,
          gender: profile.gender || null,
          allergies: profile.allergies?.trim() || null,
          emergency_name: profile.emergency_name?.trim() || null,
          emergency_phone: profile.emergency_phone?.trim() || null,
          address: profile.address?.trim() || null,
          updated_at: new Date().toISOString(),
        });
      if (healthError) throw healthError;

      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          full_name: profile.full_name,
          phone: profile.phone,
          avatar_url: null,
          blood_group: null,
          age: null,
          gender: null,
          allergies: null,
          emergency_name: null,
          emergency_phone: null,
          address: null,
        },
      });
      if (metadataError) throw metadataError;

      localStorage.removeItem(`user_profile_${profile.id}`);
      setStoredAvatarPath(avatarPath);
      setAvatarEmoji(savedAvatarEmoji);
      setPendingAvatar(null);

      if (avatarPath) {
        const { data: signedAvatar } = await supabase.storage
          .from("profile-avatars")
          .createSignedUrl(avatarPath, 3600);
        if (signedAvatar) {
          setProfile((current) => ({
            ...current,
            avatar_url: signedAvatar.signedUrl,
          }));
        }
      }

      window.dispatchEvent(new Event("profileUpdated"));

      setSuccessMsg("✅ Profile and Health Card updated successfully!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: unknown) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      <Navbar />

      <section className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">👤</span>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white">
                My Profile & Health ID
              </h1>
            </div>
            <p className="mt-1 text-slate-500 dark:text-slate-400 text-sm">
              Manage your personal information, profile photo, and emergency medical details.
            </p>
          </div>

          <Link
            href="/patient/dashboard"
            className="self-start sm:self-auto text-xs font-semibold px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-500 transition"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-500 dark:text-slate-400 animate-pulse">
            Loading your profile information...
          </div>
        ) : (
          <form onSubmit={handleSaveProfile} className="mt-8 grid lg:grid-cols-12 gap-8">
            {/* Left Column: Avatar & Digital Health ID Card */}
            <div className="lg:col-span-4 space-y-6">
              {/* Avatar Upload Box */}
              <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-center shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
                  Profile Picture
                </h3>

                <div className="relative inline-block mx-auto mb-4">
                  <div className="w-28 h-28 rounded-full border-4 border-blue-500/30 overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-4xl shadow-xl">
                    {isImageAvatar(profile.avatar_url) ? (
                      <img
                        src={profile.avatar_url}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : profile.avatar_url ? (
                      <span>{profile.avatar_url}</span>
                    ) : (
                      <span className="font-bold">
                        {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : "U"}
                      </span>
                    )}
                  </div>
                  <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                </div>

                {/* Upload & Remove Buttons */}
                <div className="flex items-center justify-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                  >
                    📷 Upload Photo
                  </button>
                  {profile.avatar_url && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-red-500 rounded-xl text-xs font-semibold transition"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {/* Preset Avatar Selector */}
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium">
                    Or select a preset avatar:
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {PRESET_AVATARS.map((av) => (
                      <button
                        key={av}
                        type="button"
                        onClick={() => handleSelectPresetAvatar(av)}
                        className={`w-9 h-9 rounded-xl border text-lg flex items-center justify-center transition-transform hover:scale-110 ${
                          profile.avatar_url === av
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/60 scale-105"
                            : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                        }`}
                      >
                        {av}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3D Digital Health ID Card Preview */}
              <div className="hologram-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span>🏥</span>
                    <span className="text-xs font-bold tracking-wider uppercase text-blue-400">
                      Smart Health Card
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">ID: {profile.id.slice(0, 8)}</span>
                </div>

                <div className="my-4 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-blue-600 flex items-center justify-center text-xl font-bold flex-shrink-0">
                    {isImageAvatar(profile.avatar_url) ? (
                      <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : profile.avatar_url ? (
                      <span>{profile.avatar_url}</span>
                    ) : (
                      profile.full_name ? profile.full_name.charAt(0).toUpperCase() : "U"
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">{profile.full_name || "Patient Name"}</h4>
                    <p className="text-[11px] text-slate-400">{profile.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Blood Group</span>
                    <span className="font-bold text-red-400 font-mono text-sm">{profile.blood_group || "O+"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Emergency Phone</span>
                    <span className="font-bold text-amber-300 font-mono text-xs">{profile.emergency_phone || "Not Set"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Personal & Health Info Edit Forms */}
            <div className="lg:col-span-8 space-y-6">
              {/* Alert Messages */}
              {successMsg && (
                <div className="rounded-2xl p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm font-semibold flex items-center gap-2 animate-bounce">
                  <span>{successMsg}</span>
                </div>
              )}
              {errorMsg && (
                <div className="rounded-2xl p-4 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm font-semibold flex items-center gap-2">
                  <span>⚠️ {errorMsg}</span>
                </div>
              )}

              {/* 1. Personal Information */}
              <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <span>📝</span>
                  <span>Personal Details</span>
                </h3>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={profile.full_name}
                      onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1.5">
                      Email Address (Read-only)
                    </label>
                    <input
                      type="email"
                      disabled
                      value={profile.email}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/50 p-3 text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1.5">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      placeholder="e.g. +91 9876543210"
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1.5">
                      Gender
                    </label>
                    <select
                      value={profile.gender}
                      onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1.5">
                      Age / Date of Birth
                    </label>
                    <input
                      type="text"
                      value={profile.age}
                      onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                      placeholder="e.g. 28 Years"
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1.5">
                      City / Address
                    </label>
                    <input
                      type="text"
                      value={profile.address}
                      onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                      placeholder="e.g. Jaipur, Rajasthan"
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Medical & Emergency Details */}
              <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <span>🩸</span>
                  <span>Medical & Emergency Info</span>
                </h3>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1.5">
                      Blood Group
                    </label>
                    <select
                      value={profile.blood_group}
                      onChange={(e) => setProfile({ ...profile, blood_group: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-sm font-bold text-red-600 dark:text-red-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {BLOOD_GROUPS.map((bg) => (
                        <option key={bg} value={bg}>
                          {bg}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1.5">
                      Known Allergies / Medical Notes
                    </label>
                    <input
                      type="text"
                      value={profile.allergies}
                      onChange={(e) => setProfile({ ...profile, allergies: e.target.value })}
                      placeholder="e.g. Penicillin, Asthma, None"
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1.5">
                      Emergency Contact Person
                    </label>
                    <input
                      type="text"
                      value={profile.emergency_name}
                      onChange={(e) => setProfile({ ...profile, emergency_name: e.target.value })}
                      placeholder="e.g. Father / Spouse Name"
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1.5">
                      Emergency Contact Phone
                    </label>
                    <input
                      type="tel"
                      value={profile.emergency_phone}
                      onChange={(e) => setProfile({ ...profile, emergency_phone: e.target.value })}
                      placeholder="e.g. +91 9829012345"
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-500/25 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  {saving ? "Saving Changes..." : "💾 Save Profile Changes"}
                </button>
              </div>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}
