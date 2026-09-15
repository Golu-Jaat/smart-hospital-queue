import { describe, expect, it } from "vitest";
import { canAccessRolePath, isRoleAuthorized, roleRoutes } from "./roles";

describe("role access", () => {
  it("allows admins to open every protected portal", () => {
    expect(canAccessRolePath(roleRoutes.admin, "admin")).toBe(true);
    expect(canAccessRolePath(roleRoutes.doctor, "admin")).toBe(true);
    expect(canAccessRolePath(roleRoutes.patient, "admin")).toBe(true);
  });

  it("keeps doctor and patient restrictions intact", () => {
    expect(isRoleAuthorized("doctor", "admin")).toBe(false);
    expect(isRoleAuthorized("doctor", "doctor")).toBe(true);
    expect(isRoleAuthorized("doctor", "patient")).toBe(true);
    expect(isRoleAuthorized("patient", "doctor")).toBe(false);
    expect(isRoleAuthorized("patient", "patient")).toBe(true);
  });

  it("rejects unknown role values", () => {
    expect(isRoleAuthorized("super-admin", "patient")).toBe(false);
  });
});
