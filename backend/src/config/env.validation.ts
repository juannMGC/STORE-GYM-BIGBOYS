/**
 * Falla al arrancar con un mensaje explícito si faltan variables (p. ej. Render sin env configurados).
 */
export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const required = [
    'DATABASE_URL',
    'AUTH0_DOMAIN',
    'AUTH0_AUDIENCE',
  ] as const;
  const missing = required.filter((key) => {
    const v = config[key];
    return v === undefined || v === null || String(v).trim() === '';
  });
  if (missing.length > 0) {
    throw new Error(
      `Faltan variables de entorno obligatorias: ${missing.join(', ')}. ` +
        'En Render: Dashboard del Web Service → Environment → añadir cada una (ver backend/.env.example). ' +
        'Valores: los mismos que en tu .env local (AUTH0_DOMAIN sin https, AUTH0_AUDIENCE = API Identifier).',
    );
  }
  return config;
}
