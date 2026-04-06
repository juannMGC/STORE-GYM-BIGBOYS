/** Slugs por defecto: /login/entrar, /registrar/cuenta */
export const DEFAULT_LOGIN_SLUG = "entrar";
export const DEFAULT_REGISTRO_SLUG = "cuenta";

/**
 * Login OAuth de @auth0/nextjs-auth0 v4 (ruta interna del SDK).
 * El proxy `/api/*` → Nest captura `/api/auth/...` salvo que el middleware redirija antes
 * (ver LEGACY_AUTH0_TO_V4): `/api/auth/login` → `/auth/login`.
 */
export const AUTH0_LOGIN_HREF = "/auth/login";

/**
 * Ruta “pública” (nombre típico v3). El middleware la reescribe a {@link AUTH0_LOGIN_HREF}
 * conservando query (`screen_hint`, `returnTo`, etc.).
 * Registro: `?screen_hint=signup` para Universal Login (pestaña signup; requiere New Universal Login en Auth0).
 */
export const AUTH0_API_LOGIN_HREF = "/api/auth/login";

/**
 * Rutas canónicas para <a href> (navegación completa del documento).
 * Auth0 / sesión: no usar client-side router ni prefetch hacia estas rutas.
 */
export const LOGIN_ENTRY_HREF = `/login/${DEFAULT_LOGIN_SLUG}`;
export const REGISTRO_ENTRY_HREF = `/registrar/${DEFAULT_REGISTRO_SLUG}`;

export type Auth0LoginIntent = "login" | "signup";

/**
 * Signup en Auth0: siempre `screen_hint=signup` (no uses esta URL sin eso: abriría login).
 * Query recomendada: `screen_hint=signup&returnTo=/ruta`
 */
export function auth0SignupHref(returnTo: string | null | undefined): string {
  const rt = (typeof returnTo === "string" && returnTo.trim()) || "/";
  const params = new URLSearchParams();
  params.set("screen_hint", "signup");
  params.set("returnTo", rt);
  return `${AUTH0_API_LOGIN_HREF}?${params.toString()}`;
}

/**
 * URL al endpoint que redirige a Auth0 (/authorize).
 * - login: `/auth/login` + screen_hint=login + prompt=login
 * - signup: delega en {@link auth0SignupHref} (`/api/auth/login?...` → middleware → `/auth/login?...`)
 */
export function auth0LoginHref(
  returnTo: string | null | undefined,
  intent: Auth0LoginIntent,
): string {
  if (intent === "signup") {
    return auth0SignupHref(returnTo);
  }
  const rt = (typeof returnTo === "string" && returnTo.trim()) || "/";
  const params = new URLSearchParams();
  params.set("returnTo", rt);
  params.set("screen_hint", "login");
  params.set("prompt", "login");
  return `${AUTH0_LOGIN_HREF}?${params.toString()}`;
}

export function loginPath(slug: string = DEFAULT_LOGIN_SLUG) {
  return `/login/${encodeURIComponent(slug)}`;
}

export function registroPath(slug: string = DEFAULT_REGISTRO_SLUG) {
  return `/registrar/${encodeURIComponent(slug)}`;
}

/** Construye URL de registro con returnTo opcional (ej. /registrar/cuenta?returnTo=/tienda) */
export function registroUrlWithReturnTo(returnTo: string) {
  const base = registroPath();
  if (!returnTo || returnTo === "/") return base;
  return `${base}?returnTo=${encodeURIComponent(returnTo)}`;
}
