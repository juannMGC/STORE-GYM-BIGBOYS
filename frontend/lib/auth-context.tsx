"use client";

import { useUser } from "@auth0/nextjs-auth0";

/** Perfil mínimo de la sesión Auth0 (useUser) para saludo en header. */
export type Auth0SessionUser = {
  email?: string;
  name?: string;
  sub?: string;
};
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthUser } from "./types";
import { ApiError, apiFetch } from "./api-client";
import { LOGIN_ENTRY_HREF, registroUrlWithReturnTo } from "./auth-routes";

type AuthContextValue = {
  /** Usuario en la API (DB); null si /auth/me falla o aún no cargó. */
  user: AuthUser | null;
  /** Sesión Auth0 (Universal Login); si existe, el usuario ya inició sesión aunque la API falle. */
  auth0User: Auth0SessionUser | null | undefined;
  /** Texto para saludo en UI: prioriza nombre/email de la DB y si no, de Auth0. */
  displayName: string;
  /** Hay sesión Auth0 activa (sirve para mostrar Entrar vs menú de cuenta). */
  isLoggedIn: boolean;
  loading: boolean;
  /** Redirige a Auth0 Login (usar asignación de location, no Link de Next). */
  login: (returnTo?: string) => void;
  /** Registro vía Auth0 Universal Login. */
  signup: (returnTo?: string) => void;
  logout: () => void;
  refreshUser: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user: auth0User, isLoading: auth0Loading } = useUser();
  const [meUser, setMeUser] = useState<AuthUser | null>(null);
  const [meLoading, setMeLoading] = useState(true);

  const loadMe = useCallback(async () => {
    if (!auth0User) {
      setMeUser(null);
      setMeLoading(false);
      return;
    }
    setMeLoading(true);
    try {
      const res = await apiFetch<{ user: AuthUser }>("/auth/me");
      setMeUser(res.user);
    } catch (e) {
      const detail =
        e instanceof ApiError ? `${e.status} ${e.message}` : String(e);
      console.error(
        "[AuthProvider] /auth/me falló — la tienda no verá rol/datos de DB hasta que el API acepte el token (NEXT_PUBLIC_AUTH0_AUDIENCE, backend encendido, CORS).",
        detail,
      );
      setMeUser(null);
    } finally {
      setMeLoading(false);
    }
  }, [auth0User]);

  useEffect(() => {
    if (auth0Loading) return;
    void loadMe();
  }, [auth0User, auth0Loading, loadMe]);

  const login = useCallback((returnTo = "/") => {
    const q = returnTo === "/" ? "" : `?returnTo=${encodeURIComponent(returnTo)}`;
    window.location.assign(`${LOGIN_ENTRY_HREF}${q}`);
  }, []);

  const signup = useCallback((returnTo = "/") => {
    window.location.assign(registroUrlWithReturnTo(returnTo));
  }, []);

  const logout = useCallback(() => {
    window.location.assign("/auth/logout");
  }, []);

  const refreshUser = useCallback(() => {
    void loadMe();
  }, [loadMe]);

  const loading = auth0Loading || (!!auth0User && meLoading);
  const isLoggedIn = Boolean(auth0User);

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
