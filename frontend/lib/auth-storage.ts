import type { AuthUser } from "./types";

const TOKEN_KEY = "bb_access_token";
const USER_KEY = "bb_user";

/** Cookie legible por middleware (MVP; en producción preferir httpOnly vía backend). */
const COOKIE_NAME = "bb_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function persistSession(token: string, user: AuthUser) {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  const safe = encodeURIComponent(token);
  document.cookie = `${COOKIE_NAME}=${safe}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function clearSession() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  document.cookie = `${COOKIE_NAME}=; Path=/; Max-Age=0`;
}
