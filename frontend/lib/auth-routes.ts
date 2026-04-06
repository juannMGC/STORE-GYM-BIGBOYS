/** Slugs por defecto: /login/entrar, /registrar/cuenta */
export const DEFAULT_LOGIN_SLUG = "entrar";
export const DEFAULT_REGISTRO_SLUG = "cuenta";

/**
 * Login OAuth de @auth0/nextjs-auth0 v4 (ruta interna del SDK).
 * No es /api/auth/login (eso era v3): el proxy /api/* va al backend Nest y rompe el flujo.
 */
export const AUTH0_LOGIN_HREF = "/auth/login";

/**
 * Rutas canónicas para <a href> (navegación completa del documento).
 * Auth0 / sesión: no usar client-side router ni prefetch hacia estas rutas.
 */
export const LOGIN_ENTRY_HREF = `/login/${DEFAULT_LOGIN_SLUG}`;
export const REGISTRO_ENTRY_HREF = `/registrar/${DEFAULT_REGISTRO_SLUG}`;

export type Auth0LoginIntent = "login" | "signup";

/**
 * URL al endpoint del SDK que redirige a Auth0 (/authorize).
 * - screen_hint: pestaña login vs registro en Universal Login
 * - prompt=login (solo intent "login"): evita saltarse la pantalla si hay sesión SSO en Auth0
 */
export function auth0LoginHref(
  returnTo: string | null | undefined,
  intent: Auth0LoginIntent,
): string {
  const rt = (typeof returnTo === "string" && returnTo.trim()) || "/";
  const params = new URLSearchParams();
  params.set("returnTo", rt);
  params.set("screen_hint", intent === "login" ? "login" : "signup");
  if (intent === "login") {
    params.set("prompt", "login");
  }
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
