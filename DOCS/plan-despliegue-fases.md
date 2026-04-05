# Plan de despliegue por fases — Vercel (FE) + Render (API) + Render PostgreSQL

Este documento organiza el despliegue en fases secuenciales, al estilo de una implementación por hitos.

**Stack registrado (Fase 0):** frontend en **Vercel**, API en **Render**, base **PostgreSQL en Render** (misma cuenta). Detalle en [despliegue-estado.md](./despliegue-estado.md).

---

## Visión general

| Capa | Servicio | Rol |
|------|-----------|-----|
| Base de datos | **Render PostgreSQL** | Persistencia; backups y conexión desde el Web Service en Render |
| API | **Render** (Web Service) | NestJS, variables de entorno, URL `https://*.onrender.com` o dominio custom |
| Frontend | **Vercel** | Next.js, dominio principal, rewrites `/api` → API |

**Flujo de tráfico:** el usuario entra por el dominio en Vercel; las peticiones a `/api/*` las reescribe Next hacia la URL del backend (`BACKEND_URL`). El navegador sigue viendo mismo origen para `/api` si usáis rewrites (recomendado).

```text
Usuario → https://www.tudominio.com (Vercel)
              → /api/* reescrito en servidor a https://api.tudominio.com/api/*
API → PostgreSQL (connection string solo en backend)
```

---

## Fase 0 — Prerrequisitos

**Estado: completada** (cuentas y decisiones cerradas).

**Objetivo:** tener cuentas y decisiones mínimas antes de tocar código o consolas.

| Requisito | Estado |
|-----------|--------|
| Repositorio Git conectado al remoto | Listo |
| Cuenta [Vercel](https://vercel.com) | Listo |
| Cuenta [Render](https://render.com) | Listo |
| PostgreSQL | **Render PostgreSQL** (misma cuenta Render) |
| Dominio propio | Opcional día 1 (`*.vercel.app` / `*.onrender.com`) — Fase 5 |

**Decisiones fijadas**

- **Frontend:** Vercel (directorio del monorepo: `frontend`).
- **API:** Render Web Service (directorio: `backend`).
- **Base de datos:** instancia **PostgreSQL** creada en Render cuando ejecutéis Fase 1 (no usar SQLite en producción).

**Salida de Fase 0:** registro en [despliegue-estado.md](./despliegue-estado.md). Siguiente: **Fase 1** (crear BD en Render y obtener `DATABASE_URL`).

---

## Fase 1 — PostgreSQL en Render

**Objetivo:** tener `DATABASE_URL` de producción (SSL) sin depender de SQLite.

1. En el [dashboard de Render](https://dashboard.render.com): **New** → **PostgreSQL** (documentación: [Render Postgres](https://render.com/docs/databases)).
2. Elegir nombre, región (p. ej. **Oregon** / **Frankfurt** según latencia; Render indica opciones disponibles) y plan.
3. Tras el aprovisionamiento, copiar la **Internal Database URL** (recomendada si el API vive en Render en la misma región) o **External** si conectáis desde fuera; el servicio Nest usará la que corresponda en Fase 3.
4. **No** commitear la URL; guardarla en **Environment** del Web Service (Fase 3) y en un gestor de secretos interno.
5. Opcional: probar conexión con DBeaver/pgAdmin usando la URL externa.

**Salida de Fase 1:** `DATABASE_URL` válida anotada solo como secreto; BD vacía lista para migraciones Prisma (Fase 2–3).

---

## Fase 2 — Código: Prisma y migraciones para PostgreSQL

**Estado: implementada en el repositorio** (ejecutá `prisma migrate deploy` contra tu Render Postgres cuando tengas `DATABASE_URL` en `.env`).

**Objetivo:** el repo debe usar **PostgreSQL** en producción; eliminar dependencia de SQLite para deploy.

1. En [backend/prisma/schema.prisma](backend/prisma/schema.prisma): `provider = "postgresql"`, `url = env("DATABASE_URL")`.
2. Migración única inicial: [backend/prisma/migrations/20260408120000_init_postgresql/migration.sql](backend/prisma/migrations/20260408120000_init_postgresql/migration.sql) (reemplaza las migraciones SQLite anteriores).
3. En local: copiá [backend/.env.example](backend/.env.example) a `.env` y poné la URL completa de Render (con contraseña del dashboard). Luego: `npx prisma migrate deploy` y `npm run start:dev`.
4. Comandos: `npx prisma migrate dev` (solo desarrollo con cambios de esquema) / `npx prisma migrate deploy` (CI/prod).
5. [backend/.env.example](backend/.env.example) incluye ejemplo `postgresql://...?sslmode=require`.
6. **Seed:** en producción ejecutar `prisma db seed` **una vez** con `ADMIN_PASSWORD` seguro, o crear admin manualmente; no usar `ChangeMe123!` en prod.

**Salida de Fase 2:** migraciones listas; verificación: `npx prisma migrate deploy` + `npm run build` + opcional `npm run test:e2e` con la misma `DATABASE_URL`.

---

## Fase 3 — Despliegue del API en Render

**Objetivo:** NestJS accesible por HTTPS en una URL estable (p. ej. `https://store-gym-bigboys-api.onrender.com`).

**Guía detallada:** [fase-3-render-api.md](fase-3-render-api.md). **Blueprint:** [render.yaml](../render.yaml) en la raíz del monorepo.

### 3.1 Configuración del servicio

1. **Root directory:** `backend` (monorepo).
2. **Build command:** `npm ci && npm run build` (`postinstall` ya ejecuta `prisma generate`).
3. **Start command:** `npx prisma migrate deploy && npm run start:prod` (equivale a `node dist/main`).
4. **Puerto:** Render inyecta `PORT`; [main.ts](backend/src/main.ts) usa `process.env.PORT ?? 3001`.
5. **Health:** `GET /api/health` → `{ "status": "ok", ... }` para health check de Render.

### 3.2 Variables de entorno (API)

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | Connection string PostgreSQL (secreto; Internal URL en Render si API y BD en la misma cuenta) |
| `JWT_SECRET` | Cadena larga aleatoria (secreto; el Blueprint puede usar `generateValue`) |
| `JWT_EXPIRES_DAYS` | Opcional, p. ej. `7` |
| `CORS_ORIGIN` | Origen del front (Vercel). Varias URLs: separadas por coma, sin espacio extra |
| `NODE_ENV` | `production` |

Opcional: `ADMIN_EMAIL` / `ADMIN_PASSWORD` solo si el seed en prod está controlado.

### 3.3 Verificación

1. Abrir `https://<host-api>/api/health`.
2. Probar CORS desde el origen configurado en Vercel.

**Salida de Fase 3:** URL base del API + HTTPS + migraciones aplicadas en cada deploy.

---

## Fase 4 — Despliegue del frontend (Vercel)

**Objetivo:** Next.js en producción con rewrites hacia el API.

1. **Importar proyecto** en Vercel; **root directory:** `frontend`.
2. **Variables de entorno en Vercel:**
   - `BACKEND_URL` = URL HTTPS del API **sin** barra final (p. ej. `https://store-gym-api.onrender.com`).  
     Se usa en servidor para [rewrites](frontend/next.config.ts) de `/api/:path*` → backend.
   - `NEXT_PUBLIC_API_URL` = misma URL si el cliente necesita URL absoluta (cookies/fetch directo).
3. **Build:** `npm run build` (comando por defecto de Vercel con Next).
4. Primera URL: `https://<proyecto>.vercel.app` para pruebas.

**Salida de Fase 4:** sitio público cargando; flujo que pasa por `/api` debe llegar al Nest (revisar Network en DevTools).

---

## Fase 5 — Dominio propio, DNS y CORS fino

**Objetivo:** sustituir URLs provisionales por dominio de marca y cerrar configuración.

1. **Vercel:** añadir dominio `www.tudominio.com` (y redirección de apex `tudominio.com` → `www` si aplica).
2. **API (Render):** custom domain `api.tudominio.com` si el plan lo permite; DNS **CNAME** según [documentación Render](https://render.com/docs/custom-domains).
3. **Actualizar `CORS_ORIGIN`** en el API al origen definitivo del front (exacto: `https://www.tudominio.com`).
4. **Actualizar variables en Vercel** (`BACKEND_URL`, `NEXT_PUBLIC_API_URL`) a la URL HTTPS definitiva del API.
5. Redeploy API y frontend tras cambiar env.

**Salida de Fase 5:** usuarios entran por el dominio final; sin errores de CORS en login/tienda/checkout.

---

## Fase 6 — Seguridad, operación y mejora continua

**Objetivo:** listo para uso real con mínimo profesional.

1. **Secretos:** rotar cualquier `JWT_SECRET` o password de prueba expuesta.
2. **Admin:** usuario administrador con contraseña fuerte; no reutilizar la del seed de desarrollo.
3. **Backups:** confirmar política del proveedor Postgres (PITR, retención).
4. **Monitoreo básico:** UptimeRobot, Better Uptime o similar sobre `https://www...` y `https://api...`.
5. **Logs:** revisar dashboard de Render y Vercel para errores 5xx.
6. **Documentación interna:** copiar a README o wiki las URLs prod y quién tiene acceso a Vercel/Render/DB.

**Salida de Fase 6:** checklist de go-live completado.

---

## Nota: Render (free tier)

- Posible **cold start** en el plan gratuito del Web Service (primera petición lenta tras inactividad).
- **PostgreSQL** en Render: revisar límites de almacenamiento y expiración en el tier gratuito (documentación actualizada en el sitio de Render).

---

## Dependencias entre fases

```text
Fase 0 → Fase 1 → Fase 2 → Fase 3 → Fase 4 → Fase 5 → Fase 6
              ↑         ↑
         (DB lista) (código listo para Postgres)
```

No despleguéis API (Fase 3) sin al menos tener Fase 1 + Fase 2 resueltas para Postgres.

---

## Resumen ejecutivo

| Fase | Qué hacéis |
|------|------------|
| 0 | Cuentas Vercel + Render; decisión **Render PostgreSQL** (hecho — ver [despliegue-estado.md](./despliegue-estado.md)) |
| 1 | Crear **PostgreSQL en Render** + `DATABASE_URL` |
| 2 | Prisma `postgresql` + migraciones + pruebas |
| 3 | API **Render** + env + `migrate deploy` |
| 4 | Vercel `frontend` + `BACKEND_URL` |
| 5 | Dominios + CORS + URLs finales |
| 6 | Seguridad, backups, uptime, docs |

Este documento es la referencia de despliegue para **Vercel + Render + Render PostgreSQL**; ajustad nombres de scripts si el repo evoluciona.
