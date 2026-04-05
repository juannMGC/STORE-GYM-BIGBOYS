# Estado del despliegue — BIG BOYS Store

Documento vivo con las **decisiones de infraestructura** y el avance por fases. Actualizar al cerrar cada fase.

## Stack acordado (Fase 0 — cerrada)

| Capa | Proveedor | Notas |
|------|-----------|--------|
| Frontend | **Vercel** | Next.js; URL típica `*.vercel.app` hasta dominio propio (Fase 5) |
| API (NestJS) | **Render** | Web Service; URL típica `*.onrender.com` |
| Base de datos | **Render PostgreSQL** | Misma cuenta Render; `DATABASE_URL` solo en el servicio API |

**Dominio propio:** opcional en el primer despliegue; Fase 5.

**Repositorio:** código versionado en Git; conectar el mismo repo a Vercel (carpeta `frontend`) y Render (carpeta `backend`).

## Avance

| Fase | Estado |
|------|--------|
| 0 — Prerrequisitos | Cerrada |
| 1 — PostgreSQL Render | Cerrada (host `*.ohio-postgres.render.com`, BD `bigbois`, usuario `admin`) |
| 2 — Prisma PostgreSQL | Cerrada en repo: `provider = postgresql`, migración `20260408120000_init_postgresql`, `.env.example` actualizado |
| 3 — API en Render | **Live:** `https://store-gym-bigboys-api.onrender.com` — [fase-3-render-api.md](./fase-3-render-api.md) |
| 4 — Frontend Vercel | Guía: [fase-4-vercel-frontend.md](./fase-4-vercel-frontend.md) |

**Credenciales:** la contraseña de Postgres **no** va en el repositorio; solo en `.env` local y en variables de entorno de Render.

## Próximo paso

- **Fase 4:** importar repo en Vercel con root `frontend`; `BACKEND_URL` y `NEXT_PUBLIC_API_URL` = `https://store-gym-bigboys-api.onrender.com`; actualizar **`CORS_ORIGIN`** en Render con la URL `https://....vercel.app` del deploy.
- Seed en prod (opcional): `npx prisma db seed` una vez con `ADMIN_PASSWORD` fuerte.

## Enlaces útiles

- [Fase 4 — Vercel](./fase-4-vercel-frontend.md)
- [Checklist New Project Vercel](./vercel-new-project-checklist.md)
- [CORS en Render tras Vercel](./render-cors-tras-vercel.md)
- [Fase 3 — API Render](./fase-3-render-api.md)
- [Plan por fases](./plan-despliegue-fases.md)
- [Render: PostgreSQL](https://render.com/docs/databases)
- [Render: Deploy Web Service](https://render.com/docs/web-services)
- [Vercel: Import Git](https://vercel.com/docs/getting-started-with-vercel/import)
