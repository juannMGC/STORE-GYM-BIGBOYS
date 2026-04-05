# Fase 3 — API en Render

Objetivo: NestJS público en **HTTPS** (p. ej. `https://store-gym-bigboys-api.onrender.com`).

## Requisitos previos

- Fase 2 lista: Prisma con PostgreSQL, migración `20260408120000_init_postgresql` aplicada (local o ya en la misma BD de Render).
- Cuenta Render y repositorio en GitHub/GitLab conectado.

## Opción A — Blueprint (`render.yaml`)

1. En [Render Dashboard](https://dashboard.render.com): **New** → **Blueprint**.
2. Conectá el repositorio; Render detecta [render.yaml](../render.yaml) en la raíz del monorepo.
3. Revisá el nombre del servicio y la región (**ohio** alineada con Postgres en Ohio).
4. En el asistente, completá variables marcadas como **sync: false**:
   - **`DATABASE_URL`**: Internal Database URL de tu instancia PostgreSQL en Render (recomendado si el API y la BD están en Render), o External si hace falta.
   - **`CORS_ORIGIN`**: URL del frontend sin `/` final, p. ej. `https://tu-app.vercel.app` o `https://www.tudominio.com`.  
     Varias URLs (preview + prod): separadas por coma, sin espacios extra:  
     `https://tu-app.vercel.app,https://www.tudominio.com`
5. **`JWT_SECRET`**: el Blueprint puede generar una con `generateValue`; si preferís, borrá esa entrada y pegá un secreto largo manualmente (una sola fuente de verdad).
6. Desplegá; esperá el build y el health check.

## Opción B — Web Service manual

1. **New** → **Web Service** → conectá el mismo repo.
2. Configuración sugerida:

| Campo | Valor |
|--------|--------|
| **Root Directory** | `backend` |
| **Runtime** | Node |
| **Build Command** | `NPM_CONFIG_PRODUCTION=false npm ci && npm run build` (evita que se salten devDependencies con `NODE_ENV=production`) |
| **Start Command** | `npx prisma migrate deploy && npm run start:prod` |
| **Region** | Ohio (o la misma región que tu Postgres) |

3. **Environment** → añadí:

| Variable | Valor |
|----------|--------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Connection string de Render Postgres (Internal recomendada) |
| `JWT_SECRET` | Cadena larga aleatoria (única) |
| `JWT_EXPIRES_DAYS` | `7` (opcional) |
| `CORS_ORIGIN` | URL(s) del frontend Vercel (ver arriba) |

4. Opcional: en el mismo proyecto, **Link** la base PostgreSQL existente para que Render sugiera `DATABASE_URL`.

5. **Health check**: path `/api/health` (el API usa prefijo global `api`).

## Variables resumidas

| Variable | Obligatorio | Notas |
|----------|-------------|--------|
| `DATABASE_URL` | Sí | Misma BD que ya migraste; SSL según URL de Render |
| `JWT_SECRET` | Sí | No reutilizar el de desarrollo |
| `CORS_ORIGIN` | Sí en prod | Debe coincidir con el origen del navegador (Vercel) |
| `JWT_EXPIRES_DAYS` | No | Por defecto el código puede usar fallback |
| `PORT` | No | Render lo inyecta; [main.ts](../backend/src/main.ts) usa `process.env.PORT` |
| `NODE_ENV` | Recomendado | `production` |

No hace falta `ADMIN_*` en el servicio salvo que ejecutes seed en el servidor (mejor seed local contra prod una vez, o job manual).

## Verificación (3.3)

1. Abrí en el navegador:  
   `https://<tu-servicio>.onrender.com/api/health`  
   Respuesta esperada: JSON con `status: "ok"`.
2. Desde la consola del navegador en tu sitio Vercel (mismo origen configurado en `CORS_ORIGIN`), probá un `fetch` a la API o usá login en la app.
3. Si falla CORS: revisá que `CORS_ORIGIN` sea exactamente el origen (esquema + host, sin path), o la lista separada por comas.

## Si el deploy falla en “Build”

Revisá el log en Render. Si aparece `nest: not found`, `Cannot find module 'typescript'` o similar, suele ser porque con `NODE_ENV=production` npm **no instala devDependencies**. El [render.yaml](../render.yaml) usa `NPM_CONFIG_PRODUCTION=false npm ci` en el build para evitarlo. Si configuraste el servicio a mano, usá ese mismo comando de build.

## Cold start (plan gratuito)

El primer request tras inactividad puede tardar ~1 minuto. Es normal en free tier.

## Salida de Fase 3

- URL base HTTPS del API guardada para Vercel: `BACKEND_URL` / `NEXT_PUBLIC_API_URL` (Fase 4).
- Migraciones aplicadas en cada deploy vía `startCommand`.
