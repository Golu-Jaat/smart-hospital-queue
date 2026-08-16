import { supabase } from "./supabase";
import type { UserRole } from "@/types/database";

export async function signUp(
  email: string,
  password: string,
  fullName: string,
  phone: string,
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone: phone,
      },
    },
  });

  if (error || !data.user) {
    return { data, error };
  }

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: data.user.id,
    full_name: fullName,
    email,
    phone,
    role: "patient" satisfies UserRole,
  });

  return { data, error: profileError };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return { data, error };
}
