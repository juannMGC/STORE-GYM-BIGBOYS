"use client";

import { useUser, getAccessToken } from "@auth0/nextjs-auth0";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AuthUser } from "./types";
import { apiFetch } from "./api-client";
import { auth0LoginHref, auth0SignupHref } from "./auth-routes";

export type Auth0SessionUser = {
  email?: string;
  name?: string;
  sub?: string;
};

type MeResponse = { user: AuthUser };

type AuthContextValue = {
  user: AuthUser | null;
  auth0User: Auth0SessionUser | null | undefined;
  displayName: string;
  isLoggedIn: boolean;
  /** Sesión Auth0 o sync con API en curso */
  loading: boolean;
  /** Alias de `loading` (misma señal) */
  isLoading: boolean;
  login: (returnTo?: string) => void;
  signup: (returnTo?: string) => void;
  logout: () => void;
  refreshUser: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_RETRIES = 3;
const TOKEN_RETRY_MS = 120;

async function fetchAccessTokenOnceOrBriefRetry(): Promise<string | null> {
  for (let i = 0; i < TOKEN_RETRIES; i++) {
    try {
      const token = await getAccessToken();
      if (token && typeof token === "string") return token;
    } catch {}
    await new Promise((r) => setTimeout(r, TOKEN_RETRY_MS));
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user: auth0User, isLoading: auth0Loading } = useUser();
  const auth0Sub = auth0User?.sub ?? null;

  const [meUser, setMeUser] = useState<AuthUser | null>(null);
  const [meLoading, setMeLoading] = useState(true);
  const [syncNonce, setSyncNonce] = useState(0);

  const runIdRef = useRef(0);

  useEffect(() => {
    if (auth0Loading) return;

    if (!auth0Sub) {
      setMeUser(null);
      setMeLoading(false);
      return;
    }

    const runId = ++runIdRef.current;
    let cancelled = false;

    async function sync() {
      setMeLoading(true);
      try {
        const token = await fetchAccessTokenOnceOrBriefRetry();
        if (cancelled || runId !== runIdRef.current) return;
        if (!token) {
          setMeUser(null);
          return;
        }

        await apiFetch<MeResponse>("/auth/auth0", { method: "POST" });
        if (cancelled || runId !== runIdRef.current) return;

        const me = await apiFetch<MeResponse>("/auth/me");
        if (cancelled || runId !== runIdRef.current) return;

        setMeUser(me.user);
      } catch {
        if (cancelled || runId !== runIdRef.current) return;
        setMeUser(null);
      } finally {
        if (!cancelled && runId === runIdRef.current) {
          setMeLoading(false);
        }
      }
    }

    void sync();

    return () => {
      cancelled = true;
    };
  }, [auth0Loading, auth0Sub, syncNonce]);

  const login = useCallback((returnTo = "/") => {
    window.location.assign(auth0LoginHref(returnTo, "login"));
  }, []);

  const signup = useCallback((returnTo = "/") => {
    window.location.assign(auth0SignupHref(returnTo));
  }, []);

  const logout = useCallback(() => {
    setMeUser(null);
    window.location.assign("/auth/logout");
  }, []);

  const refreshUser = useCallback(() => {
    setSyncNonce((n) => n + 1);
  }, []);

  const loading = auth0Loading || (!!auth0Sub && meLoading);
  const isLoggedIn = Boolean(auth0Sub);

  const displayName = useMemo(() => {
    const fromDb = meUser?.name?.trim() || meUser?.email;
    if (fromDb) return fromDb;
    const u = auth0User as { email?: string; name?: string } | undefined;
    return (u?.name?.trim() || u?.email || "").trim();
  }, [meUser, auth0User]);

  const value = useMemo(
    () => ({
      user: meUser,
      auth0User,
      displayName,
      isLoggedIn,
      loading,
      isLoading: loading,
      login,
      signup,
      logout,
      refreshUser,
    }),
    [
      meUser,
      auth0User,
      displayName,
      isLoggedIn,
      loading,
      login,
      signup,
      logout,
      refreshUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
