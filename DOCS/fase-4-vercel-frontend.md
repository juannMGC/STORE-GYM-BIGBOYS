# Fase 4 — Frontend en Vercel

**API de producción (Fase 3):** `https://store-gym-bigboys-api.onrender.com`

## Objetivo

Next.js en HTTPS con **rewrites** de `/api/*` hacia el Nest en Render ([next.config.ts](../frontend/next.config.ts)). El navegador llama a rutas relativas `/api/...` en el mismo dominio Vercel; el servidor de Next reenvía al backend.

## 1. Importar el proyecto en Vercel

1. [vercel.com/new](https://vercel.com/new) → **Import Git Repository** → `juannMGC/STORE-GYM-BIGBOYS`.
2. **Root Directory:** `frontend` (Configuración avanzada / monorepo).
3. **Framework Preset:** Next.js (detectado solo).
4. **Build Command:** `npm run build` (por defecto).
5. **Install Command:** `npm install` o `npm ci` (por defecto en la carpeta `frontend`).

## 2. Variables de entorno (Production)

En **Project → Settings → Environment Variables**, para el entorno **Production** (y **Preview** si querés que los deploys de PR también apunten al API de Render):

| Nombre | Valor (sin barra al final) |
|--------|----------------------------|
| `BACKEND_URL` | `https://store-gym-bigboys-api.onrender.com` |
| `NEXT_PUBLIC_API_URL` | `https://store-gym-bigboys-api.onrender.com` |

- **`BACKEND_URL`:** la usa el **servidor** de Next al resolver los rewrites en build/runtime.
- **`NEXT_PUBLIC_API_URL`:** reserva de respaldo en [next.config.ts](../frontend/next.config.ts) si `BACKEND_URL` no está; conviene definir **ambas** iguales para evitar confusiones.

No incluyas `/` al final de la URL.

## 3. CORS en Render (obligatorio)

El backend valida el origen con `CORS_ORIGIN`. Después del primer deploy en Vercel obtendrás una URL tipo:

`https://store-gym-bigboys-xxxxx.vercel.app`

(o un dominio propio).

En **Render → Web Service `store-gym-bigboys-api` → Environment**:

- Editá **`CORS_ORIGIN`** para incluir esa URL **exacta** (sin path).
- Varias URLs (preview + producción): separadas por coma, sin espacios extra:  
  `https://tu-app.vercel.app,https://www.tudominio.com`

Guardá; Render redeploya el API.

Si no actualizás CORS, el navegador bloqueará las peticiones desde el dominio de Vercel.

## 4. Verificación

1. Abrí `https://<tu-proyecto>.vercel.app` y comprobá que carga la home.
2. En **DevTools → Network**, una acción que use la API (login, tienda) debe ir a **`/api/...`** en el **mismo host** Vercel (status 200/401 según caso), no directamente a `onrender.com` desde el cliente (el rewrite lo hace el servidor Next).
3. Opcional: `GET https://<tu-proyecto>.vercel.app/api/health` debe devolver el JSON del Nest (vía rewrite).

## 5. Salida de Fase 4

- URL pública del frontend en Vercel.
- `CORS_ORIGIN` en Render alineado con esa URL.
- Flujo tienda/login/checkout probado contra la API en producción.

## Notas

- **Cold start Render:** el primer request al API tras inactividad puede tardar ~1 min en plan free.
- **Dominio propio:** Fase 5; añadí el dominio en Vercel y actualizá `CORS_ORIGIN` en Render con la URL final.
