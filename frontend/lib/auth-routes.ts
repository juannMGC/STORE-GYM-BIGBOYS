/** Slugs por defecto: /login/entrar, /registrar/cuenta */
export const DEFAULT_LOGIN_SLUG = "entrar";
export const DEFAULT_REGISTRO_SLUG = "cuenta";

/**
 * Rutas canónicas para <a href> (navegación completa del documento).
 * Auth0 / sesión: no usar client-side router ni prefetch hacia estas rutas.
 */
export const LOGIN_ENTRY_HREF = `/login/${DEFAULT_LOGIN_SLUG}`;
export const REGISTRO_ENTRY_HREF = `/registrar/${DEFAULT_REGISTRO_SLUG}`;

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
