# Actualizar CORS en Render tras desplegar Vercel

Pasos manuales en el dashboard de Render (no se puede automatizar desde el repo sin API keys).

1. Abrí [Render Dashboard](https://dashboard.render.com) → servicio web **`store-gym-bigboys-api`** (o el nombre que usaste).
2. **Environment** → localizá **`CORS_ORIGIN`**.
3. Valor: la URL **exacta** del sitio en Vercel, sin path, por ejemplo:
   - `https://store-gym-bigboys.vercel.app`
   - O varias: `https://xxx.vercel.app,https://www.tudominio.com` (coma, sin espacios extra).
4. **Save Changes**; Render redeploya el servicio.

Sin este paso, el navegador mostrará errores CORS al llamar al API desde el dominio de Vercel.
