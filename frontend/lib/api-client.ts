/**
 * Cliente HTTP hacia rutas `/api/*` (rewrites → Nest).
 * Authorization: access token de Auth0 (misma audience que el API Nest).
 */

import { getAccessToken } from "@auth0/nextjs-auth0";

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

/**
 * En el navegador, si existe NEXT_PUBLIC_API_URL, el fetch va directo al Nest (CORS + Bearer).
 * El rewrite /api de Next en Vercel a veces no reenvía Authorization y Nest responde 401 aunque haya sesión Auth0.
 */
function resolveApiUrl(path: string): string {
  const apiPath = path.startsWith("/api")
    ? path
    : `/api${path.startsWith("/") ? path : `/${path}`}`;
  if (typeof window !== "undefined") {
    const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
    if (base) {
      return `${base}${apiPath}`;
    }
  }
  return apiPath;
}

/** Mensajes claros para carrito/checkout cuando falla el API con Auth0. */
export function formatShopApiError(
  e: unknown,
  opts?: { sessionActive?: boolean },
): string {
  if (e instanceof ApiError) {
    if (e.status === 401) {
      if (opts?.sessionActive) {
        return "Tenés sesión en la tienda pero el API rechazó el pedido (401). En Vercel definí NEXT_PUBLIC_API_URL=https://tu-api.onrender.com (URL directa del Nest) y NEXT_PUBLIC_AUTH0_AUDIENCE. Luego redeploy. Si ya está, cerrá sesión y volvé a entrar.";
      }
      return "Necesitás iniciar sesión o la sesión expiró. Usá Entrar y volvé a intentar.";
    }
    const m = e.message.toLowerCase();
    if (m.includes("email") || m.includes("token")) {
      return "Tu cuenta no pudo validarse con el servidor. Cerrá sesión (Salir), volvé a entrar, o revisá en Auth0 que el access token incluya el email (Actions → Post-login).";
    }
  }
  return e instanceof Error ? e.message : "Error";
}

type FetchOptions = RequestInit & { skipAuth?: boolean };

export async function apiFetch<T = unknown>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const url = resolveApiUrl(path);
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (!options.skipAuth) {
    try {
      const audience =
        process.env.NEXT_PUBLIC_AUTH0_AUDIENCE?.trim() ||
        process.env.AUTH0_AUDIENCE?.trim();
      const token = await getAccessToken(audience ? { audience } : undefined);
      if (token) headers.set("Authorization", `Bearer ${token}`);
      else if (process.env.NODE_ENV === "development") {
        console.warn(
          "[apiFetch] Sin access token para esta API. Revisá Auth0 → Applications → tu app → APIs (autorizar el Identifier igual a NEXT_PUBLIC_AUTH0_AUDIENCE) y probá cerrar sesión y volver a entrar.",
          path,
        );
      }
    } catch (e) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[apiFetch] getAccessToken falló (mirá también GET /auth/access-token en Red):", e);
      }
    }
  }
  const res = await fetch(url, {
    ...options,
    headers,
    credentials: url.startsWith("http") ? "omit" : "same-origin",
  });
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
