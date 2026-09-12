import { supabase } from "./supabase";

export type UserRole = "admin" | "doctor" | "patient";

export interface UserSessionData {
  role: UserRole;
  fullName: string;
  userId: string | null;
  email: string | null;
}

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
 * Fetch the current user's database-owned role after Supabase verifies them.
 */
export async function getCurrentUserRole(): Promise<UserSessionData> {
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

    const role = (
      profile?.role === "admin" || profile?.role === "doctor"
        ? profile.role
        : "patient"
    ) as UserRole;
    const fullName = profile?.full_name || user.user_metadata?.full_name || "User";

    const sessionData: UserSessionData = {
      role,
      fullName,
      userId: user.id,
      email: user.email || null,
    };

    return sessionData;
  } catch (err) {
    console.error("Error checking role:", err);
    return { role: "patient", fullName: "", userId: null, email: null };
  }
}
