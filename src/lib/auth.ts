import { supabase } from "./supabase";

function normalizeAuthError(error: unknown) {
  if (error instanceof Error) {
    if (/failed to fetch|networkerror|load failed/i.test(error.message)) {
      return new Error(
        "Unable to connect to the login service. Check your internet and try again.",
      );
    }

    return error;
  }

  return new Error("Network request failed. Please try again.");
}

// Signup
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
  return { data, error };
}

// Login
export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    return { data, error };
  } catch (error) {
    return { data: null, error: normalizeAuthError(error) };
  }
}

// Logout
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

// Get current user
export async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// Get user profile
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return { data, error };
}

// Forgot Password
export async function forgotPassword(email: string) {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: `${window.location.origin}/reset-password`,
      },
    );
    return { data, error };
  } catch (error) {
    return { data: null, error: normalizeAuthError(error) };
  }
}

// Reset Password
export async function resetPassword(newPassword: string) {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { data, error };
  } catch (error) {
    return { data: null, error: normalizeAuthError(error) };
  }
}
