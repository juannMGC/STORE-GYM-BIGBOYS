/**
 * Carga variables de entorno del backend antes de los e2e (DATABASE_URL, ADMIN_*, AUTH0_*, etc.).
 * Las credenciales de admin no deben commitearse: solo en `.env` local (ver `test/LOCAL.txt`).
 */
import { resolve } from 'path';
import { config } from 'dotenv';

config({ path: resolve(__dirname, '../.env') });

/** Valores dummy para instanciar Auth0Strategy en e2e (las rutas protegidas usan guard mock o no llaman a Auth0). */
if (!process.env.AUTH0_DOMAIN) {
  process.env.AUTH0_DOMAIN = 'e2e-placeholder.auth0.com';
}
if (!process.env.AUTH0_AUDIENCE) {
  process.env.AUTH0_AUDIENCE = 'https://e2e-placeholder-api/';
}
