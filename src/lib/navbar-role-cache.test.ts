import { describe, expect, it } from "vitest";
import {
  cacheNavbarRole,
  clearCachedNavbarRole,
  readCachedNavbarRole,
} from "./navbar-role-cache";

function createStorage() {
  const values = new Map<string, string>();

  return {
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
    removeItem(key: string) {
      values.delete(key);
    },
  };
}

describe("navbar role display cache", () => {
  it("restores and clears a verified role for the same user", () => {
    const storage = createStorage();

    cacheNavbarRole("user-1", "admin", storage);
    expect(readCachedNavbarRole("user-1", storage)).toBe("admin");

    clearCachedNavbarRole("user-1", storage);
    expect(readCachedNavbarRole("user-1", storage)).toBeNull();
  });

  it("ignores an unknown cached role", () => {
    const storage = createStorage();
    storage.setItem("smartqueue:navbar-role:user-1", "super-admin");

    expect(readCachedNavbarRole("user-1", storage)).toBeNull();
  });
});
