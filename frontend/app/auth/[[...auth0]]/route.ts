import type { NextRequest } from "next/server";
import { getAuth0Client, missingAuth0EnvKeys } from "@/lib/auth0";

/**
 * Rutas /auth/* (login, callback, profile, access-token, …) cuando el middleware
 * no intercepta o devuelve next() — evita 404 en /auth/profile en producción (Vercel / Next 16).
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
  const auth0 = getAuth0Client();
  if (!auth0) {
    return notConfiguredResponse();
  }
  return auth0.middleware(request);
}

export async function POST(request: NextRequest) {
  const auth0 = getAuth0Client();
  if (!auth0) {
    return notConfiguredResponse();
  }
  return auth0.middleware(request);
}
