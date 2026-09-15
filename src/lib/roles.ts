export type UserRole = "admin" | "doctor" | "patient";

export const roleRoutes: Record<UserRole, string> = {
  admin: "/admin/dashboard",
  doctor: "/doctor/dashboard",
  patient: "/patient/dashboard",
};

export function isKnownRole(value: unknown): value is UserRole {
  return value === "admin" || value === "doctor" || value === "patient";
}

export function isRoleAuthorized(
  userRole: unknown,
  requiredRole: UserRole,
): boolean {
  if (!isKnownRole(userRole)) return false;
  if (userRole === "admin") return true;
  if (requiredRole === "admin") return false;
  if (requiredRole === "doctor") return userRole === "doctor";
  return true;
}

export function canAccessRolePath(pathname: string, role: UserRole): boolean {
  if (pathname.startsWith("/admin")) return isRoleAuthorized(role, "admin");
  if (pathname.startsWith("/doctor")) return isRoleAuthorized(role, "doctor");
  if (pathname.startsWith("/patient")) return isRoleAuthorized(role, "patient");
  return true;
}
