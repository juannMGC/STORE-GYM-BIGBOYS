"use client";

import { useUser } from "@auth0/nextjs-auth0";
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
import { apiFetch } from "./api-client";
import { loginPath, registroPath } from "./auth-routes";

type AuthContextValue = {
  user: AuthUser | null;
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
    } catch {
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
    window.location.assign(
      `${loginPath()}?returnTo=${encodeURIComponent(returnTo)}`,
    );
  }, []);

  const signup = useCallback((returnTo = "/") => {
    window.location.assign(
      `${registroPath()}?returnTo=${encodeURIComponent(returnTo)}`,
    );
  }, []);

  const logout = useCallback(() => {
    window.location.assign("/auth/logout");
  }, []);

  const refreshUser = useCallback(() => {
    void loadMe();
  }, [loadMe]);

  const loading = auth0Loading || (!!auth0User && meLoading);

  const value = useMemo(
    () => ({
      user: meUser,
      loading,
      login,
      signup,
      logout,
      refreshUser,
    }),
    [meUser, loading, login, signup, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
