"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  startTransition,
  useState,
  type ReactNode,
} from "react";
import type { AuthUser } from "./types";
import { clearSession, getStoredToken, getStoredUser, persistSession } from "./auth-storage";
import { apiFetch } from "./api-client";

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(() => {
    const t = getStoredToken();
    const u = getStoredUser();
    setToken(t);
    setUser(u);
  }, []);

  useEffect(() => {
    startTransition(() => {
      refreshUser();
      setLoading(false);
    });
  }, [refreshUser]);

  /** Sincroniza cookie para middleware si solo hay sesión en sessionStorage. */
  useEffect(() => {
    if (typeof document === "undefined") return;
    const t = getStoredToken();
    const u = getStoredUser();
    if (t && u && !document.cookie.includes("bb_token=")) {
      persistSession(t, u);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiFetch<{ accessToken: string; user: AuthUser }>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
        skipAuth: true,
      },
    );
    persistSession(res.accessToken, res.user);
    setToken(res.accessToken);
    setUser(res.user);
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const res = await apiFetch<{ accessToken: string; user: AuthUser }>(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
        skipAuth: true,
      },
    );
    persistSession(res.accessToken, res.user);
    setToken(res.accessToken);
    setUser(res.user);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, token, loading, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
