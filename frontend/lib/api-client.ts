/**
 * Cliente HTTP hacia rutas `/api/*` (rewrites → Nest).
 * MVP: Bearer desde sessionStorage (riesgo XSS; evolución: cookie httpOnly desde servidor).
 */

import { getStoredToken } from "./auth-storage";

function parseApiMessage(data: unknown, fallback: string): string {
  if (typeof data !== "object" || data === null || !("message" in data)) {
    return fallback;
  }
  const m = (data as { message: unknown }).message;
  if (Array.isArray(m)) return m.map(String).join(", ");
  if (typeof m === "string") return m;
  return fallback;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type FetchOptions = RequestInit & { skipAuth?: boolean };

export async function apiFetch<T = unknown>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const url = path.startsWith("/api") ? path : `/api${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (!options.skipAuth) {
    const token = getStoredToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }
  const res = await fetch(url, { ...options, headers });
  const text = await res.text();
  let data: unknown = undefined;
  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      data = text;
    }
  }
  if (!res.ok) {
    const msg = parseApiMessage(data, res.statusText);
    throw new ApiError(res.status, msg, data);
  }
  return data as T;
}
