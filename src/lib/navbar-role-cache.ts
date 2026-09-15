import { isKnownRole, type UserRole } from "./roles";

const ROLE_CACHE_PREFIX = "smartqueue:navbar-role:";

type RoleStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function getBrowserStorage(storage?: RoleStorage): RoleStorage | null {
  if (storage) return storage;
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

function roleCacheKey(userId: string): string {
  return `${ROLE_CACHE_PREFIX}${userId}`;
}

export function readCachedNavbarRole(
  userId: string,
  storage?: RoleStorage,
): UserRole | null {
  const target = getBrowserStorage(storage);
  if (!target) return null;

  const role = target.getItem(roleCacheKey(userId));
  return isKnownRole(role) ? role : null;
}

export function cacheNavbarRole(
  userId: string,
  role: UserRole,
  storage?: RoleStorage,
): void {
  getBrowserStorage(storage)?.setItem(roleCacheKey(userId), role);
}

export function clearCachedNavbarRole(
  userId: string,
  storage?: RoleStorage,
): void {
  getBrowserStorage(storage)?.removeItem(roleCacheKey(userId));
}
