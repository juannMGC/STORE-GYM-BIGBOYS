# Checklist: New Project Vercel (desde GitHub)

Monorepo `juannMGC/STORE-GYM-BIGBOYS`: solo desplegar **Next.js** desde **`frontend`**. El API Nest está en **Render**, no en Vercel.

## Antes de Deploy

- [ ] **Root Directory:** `frontend` (no `./` ni raíz del repo).
- [ ] **Un solo proyecto** Next.js; no crear Web Service NestJS del `backend` en Vercel.
- [ ] **Framework:** Next.js (auto si el root es `frontend`).
- [ ] Variables **Production** (y opcionalmente **Preview**):

| Key | Value |
|-----|--------|
| `BACKEND_URL` | `https://store-gym-bigboys-api.onrender.com` |
| `NEXT_PUBLIC_API_URL` | `https://store-gym-bigboys-api.onrender.com` |

## Después del primer deploy

- [ ] Copiar URL `https://....vercel.app`.
- [ ] **Render** → API `store-gym-bigboys-api` → **Environment** → `CORS_ORIGIN` incluye esa URL (o lista separada por comas).

## Verificación

- [ ] `https://<proyecto>.vercel.app/api/health` responde JSON.
- [ ] Tienda / login funcionan (Network: `/api/...` en el mismo host).

Guía ampliada: [fase-4-vercel-frontend.md](./fase-4-vercel-frontend.md).
