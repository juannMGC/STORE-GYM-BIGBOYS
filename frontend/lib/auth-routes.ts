/** Slug por defecto para URLs amigables: /login/entrar, /registrar/cuenta */
export const DEFAULT_LOGIN_SLUG = "entrar";
export const DEFAULT_REGISTRO_SLUG = "cuenta";

export function loginPath(slug: string = DEFAULT_LOGIN_SLUG) {
  return `/login/${encodeURIComponent(slug)}`;
}

export function registroPath(slug: string = DEFAULT_REGISTRO_SLUG) {
  return `/registrar/${encodeURIComponent(slug)}`;
}
