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
import { ApiError, apiFetch } from "./api-client";
import {
  AUTH0_LOGIN_HREF,
  auth0LoginHref,
  auth0SignupHref,
} from "./auth-routes";

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
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/** Tras signup DB, el access token puede demorar un instante respecto al perfil. */
const TOKEN_RETRIES = 8;
const TOKEN_RETRY_MS = 150;

const DUPLICATE_EMAIL_CLIENT_MESSAGE =
  "Ya tenés una cuenta con este correo. Iniciá sesión en lugar de registrarte.";

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
  const {
    user: auth0User,
    isLoading: auth0Loading,
    error: auth0ProfileError,
    invalidate: invalidateAuth0Profile,
  } = useUser();

  const auth0Sub = auth0User?.sub ?? null;

  const [meUser, setMeUser] = useState<AuthUser | null>(null);
  const [meLoading, setMeLoading] = useState(true);

  const runIdRef = useRef(0);
  const profile401RetriedRef = useRef(false);
  const auth0EmailConflictRef = useRef(false);

  const [duplicateEmailNotice, setDuplicateEmailNotice] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (auth0ProfileError) {
      if (!profile401RetriedRef.current) {
        profile401RetriedRef.current = true;
        void invalidateAuth0Profile();
      }
    } else {
      profile401RetriedRef.current = false;
    }
  }, [auth0ProfileError, invalidateAuth0Profile]);

  useEffect(() => {
    if (!duplicateEmailNotice) return;
    const t = window.setTimeout(() => {
      const returnTo = `${window.location.origin}${AUTH0_LOGIN_HREF}`;
      window.location.assign(
        `/auth/logout?returnTo=${encodeURIComponent(returnTo)}`,
      );
    }, 3000);
    return () => window.clearTimeout(t);
  }, [duplicateEmailNotice]);

  useEffect(() => {
    if (auth0Loading) return;

    if (!auth0Sub) {
      auth0EmailConflictRef.current = false;
      setMeUser(null);
      setMeLoading(false);
      return;
    }

    if (auth0EmailConflictRef.current) {
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
      } catch (e) {
        if (cancelled || runId !== runIdRef.current) return;
        if (e instanceof ApiError && e.status === 409) {
          auth0EmailConflictRef.current = true;
          setDuplicateEmailNotice(DUPLICATE_EMAIL_CLIENT_MESSAGE);
          setMeUser(null);
          return;
        }
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
  }, [auth0Loading, auth0Sub]);

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

  const refreshUser = useCallback(async () => {
    if (!auth0Sub) return;
    try {
      const token = await fetchAccessTokenOnceOrBriefRetry();
      if (!token) return;
      const me = await apiFetch<MeResponse>("/auth/me");
      setMeUser(me.user);
    } catch {
      /* mantiene el usuario anterior */
    }
  }, [auth0Sub]);

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

  return (
    <AuthContext.Provider value={value}>
      {duplicateEmailNotice ? (
        <div
          role="alert"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            padding: "12px 16px",
            background: "#7f1d1d",
            color: "#fef2f2",
            fontSize: "0.95rem",
            textAlign: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
        >
          {duplicateEmailNotice}{" "}
          <span style={{ opacity: 0.9 }}>
            Cerrando sesión y llevándote al inicio de sesión…
          </span>
        </div>
      ) : null}
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
