/**
 * Carga variables de entorno del backend antes de los e2e (DATABASE_URL, ADMIN_*, JWT_SECRET, etc.).
 * Las credenciales de admin no deben commitearse: solo en `.env` local (ver `test/LOCAL.txt`).
 */
import { resolve } from 'path';
import { config } from 'dotenv';

config({ path: resolve(__dirname, '../.env') });
