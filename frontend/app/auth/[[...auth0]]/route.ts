import type { NextRequest } from "next/server";
import { auth0 } from "@/lib/auth0";

/**
 * Rutas /auth/* (login, callback, profile, access-token, …) cuando el middleware
 * no intercepta o devuelve next() — evita 404 en /auth/profile en producción (Vercel / Next 16).
 */
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!auth0) {
    return new Response(JSON.stringify({ error: "Auth0 no configurado" }), {
      status: 503,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }
  return auth0.middleware(request);
}

export async function POST(request: NextRequest) {
  if (!auth0) {
    return new Response(JSON.stringify({ error: "Auth0 no configurado" }), {
      status: 503,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }
  return auth0.middleware(request);
}
