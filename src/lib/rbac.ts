import { supabase } from "./supabase";
import { isKnownRole, isRoleAuthorized, type UserRole } from "./roles";

export { isRoleAuthorized };
export type { UserRole };

export interface UserSessionData {
  role: UserRole;
  fullName: string;
  userId: string | null;
  email: string | null;
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

    const role = isKnownRole(profile?.role) ? profile.role : "patient";
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
