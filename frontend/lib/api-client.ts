/**
 * Cliente HTTP hacia rutas `/api/*` (rewrites → Nest).
 * Authorization: access token JWT de Auth0 con la misma `audience` que el API Nest.
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

/** Lanzado cuando no hay token JWT de API (audiencia) o getAccessToken falla antes del fetch. */
export const SESSION_EXPIRED_MESSAGE = "SESSION_EXPIRED";

export function isSessionExpiredError(e: unknown): boolean {
  return e instanceof Error && e.message === SESSION_EXPIRED_MESSAGE;
}

/**
 * Identificador del API (Auth0 API → Identifier). Debe ser idéntico a `AUTH0_AUDIENCE` en Nest.
 * En cliente solo está garantizado `NEXT_PUBLIC_AUTH0_AUDIENCE` (inyectado en build).
 */
export function getAuth0ApiAudience(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_AUTH0_AUDIENCE?.trim() ||
    process.env.AUTH0_AUDIENCE?.trim() ||
    undefined
  );
}

/**
 * Headers para llamadas autenticadas. Exige `NEXT_PUBLIC_AUTH0_AUDIENCE` (mismo valor que `AUTH0_AUDIENCE` en Nest).
 * Sin audiencia, Auth0 puede devolver un token opaco que el backend no valida con JWKS.
 */
export async function getAuthHeaders(): Promise<HeadersInit> {
  const token = await getBearerTokenForApi();
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

/**
 * Cliente `@auth0/nextjs-auth0`: la única forma soportada es `getAccessToken({ audience })`
 * (añade `?audience=` a `/auth/access-token`). No existe `authorizationParams` en el tipo del cliente.
 * El valor devuelto es el JWT string; no hay `{ accessToken }`.
 */
async function getBearerTokenForApi(): Promise<string> {
  const audience = getAuth0ApiAudience();
  if (!audience) {
    throw new Error(SESSION_EXPIRED_MESSAGE);
  }
  try {
    const accessToken = await getAccessToken({ audience });
    if (!accessToken || typeof accessToken !== "string") {
      throw new Error(SESSION_EXPIRED_MESSAGE);
    }
    return accessToken;
  } catch (e) {
    if (isSessionExpiredError(e)) throw e;
    throw new Error(SESSION_EXPIRED_MESSAGE);
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
  if (isSessionExpiredError(e)) {
    return "No se obtuvo un token de acceso válido para el API. Verificá que NEXT_PUBLIC_AUTH0_AUDIENCE coincida con AUTH0_AUDIENCE del servidor y volvé a iniciar sesión.";
  }
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
      const token = await getBearerTokenForApi();
      headers.set("Authorization", `Bearer ${token}`);
    } catch (e) {
      if (isSessionExpiredError(e)) throw e;
      throw new Error(SESSION_EXPIRED_MESSAGE);
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
