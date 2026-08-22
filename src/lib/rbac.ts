import { supabase } from "./supabase";

export type UserRole = "admin" | "doctor" | "patient";

/**
 * Check if the user's role has permission for a specific area.
 * - Admin has Superuser access to EVERYTHING ('admin', 'doctor', 'patient', etc.)
 * - Doctor has access to 'doctor' and 'patient'
 * - Patient has access to 'patient' only
 */
export function isRoleAuthorized(userRole: string, requiredRole: "admin" | "doctor" | "patient"): boolean {
  if (userRole === "admin") return true; // Superuser: Admin can access everything!
  
  if (requiredRole === "admin") {
    return userRole === "admin";
  }

  if (requiredRole === "doctor") {
    return userRole === "doctor" || userRole === "admin";
  }

  if (requiredRole === "patient") {
    return true; // Everyone can view patient portal
  }

  return false;
}

/**
 * Fetch current authenticated user's profile role from Supabase and cache
 */
export async function getCurrentUserRole(): Promise<{
  role: UserRole;
  fullName: string;
  userId: string | null;
  email: string | null;
}> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { role: "patient", fullName: "", userId: null, email: null };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", user.id)
      .single();

    const role = (profile?.role || user.user_metadata?.role || "patient") as UserRole;
    const fullName = profile?.full_name || user.user_metadata?.full_name || "User";

    return {
      role,
      fullName,
      userId: user.id,
      email: user.email || null,
    };
  } catch (err) {
    console.error("Error checking role:", err);
    return { role: "patient", fullName: "", userId: null, email: null };
  }
}
