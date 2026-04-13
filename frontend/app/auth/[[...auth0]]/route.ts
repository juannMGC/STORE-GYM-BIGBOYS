import type { NextRequest } from "next/server";
import { auth0, missingAuth0EnvKeys } from "@/lib/auth0";

/**
 * v4: no hay handlers sin configurar del SDK; se usa `auth0` desde `lib/auth0.ts`
 * (`Auth0Client` con `authorizationParameters` / AUTH0_AUDIENCE).
 * Aquí se delega a `middleware(request)` para /auth/login, /auth/callback, /auth/access-token, etc.
 *
 * Rutas /auth/* cuando el middleware no cubre el path — evita 404 en producción (Vercel / Next 16).
 */
export const dynamic = "force-dynamic";

function notConfiguredResponse() {
  const missing = missingAuth0EnvKeys();
  return new Response(
    JSON.stringify({
      error: "Auth0 no configurado",
      hint: "En Vercel → Settings → Environment Variables (Production): definí AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, AUTH0_SECRET. Luego Redeploy.",
      missingEnv: missing,
    }),
    {
      status: 503,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    },
  );
}

export async function GET(request: NextRequest) {
  if (!auth0) {
    return notConfiguredResponse();
  }
  return auth0.middleware(request);
}

export async function POST(request: NextRequest) {
  if (!auth0) {
    return notConfiguredResponse();
  }
  return auth0.middleware(request);
}
