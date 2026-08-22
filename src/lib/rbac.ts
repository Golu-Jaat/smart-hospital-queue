import { supabase } from "./supabase";

export type UserRole = "admin" | "doctor" | "patient";

export interface UserSessionData {
  role: UserRole;
  fullName: string;
  userId: string | null;
  email: string | null;
}

// In-Memory Fast Cache for 0ms Route Transitions
let inMemorySession: UserSessionData | null = null;

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
 * Synchronously get cached user session in 0ms (from Memory or LocalStorage)
 */
export function getCachedUserRoleSync(): UserSessionData | null {
  if (inMemorySession) return inMemorySession;

  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("smart_user_session");
      if (saved) {
        const parsed = JSON.parse(saved);
        inMemorySession = parsed;
        return parsed;
      }
    } catch (e) {}
  }

  return null;
}

/**
 * Fetch current authenticated user's profile role from Supabase and cache it
 */
export async function getCurrentUserRole(): Promise<UserSessionData> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      inMemorySession = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem("smart_user_session");
      }
      return { role: "patient", fullName: "", userId: null, email: null };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", user.id)
      .single();

    const role = (profile?.role || user.user_metadata?.role || "patient") as UserRole;
    const fullName = profile?.full_name || user.user_metadata?.full_name || "User";

    const sessionData: UserSessionData = {
      role,
      fullName,
      userId: user.id,
      email: user.email || null,
    };

    // Save in memory & localStorage for instant 0ms access on subsequent clicks
    inMemorySession = sessionData;
    if (typeof window !== "undefined") {
      localStorage.setItem("smart_user_session", JSON.stringify(sessionData));
    }

    return sessionData;
  } catch (err) {
    console.error("Error checking role:", err);
    return { role: "patient", fullName: "", userId: null, email: null };
  }
}
