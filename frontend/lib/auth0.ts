import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { NextResponse } from "next/server";
import type { SdkError } from "@auth0/nextjs-auth0/errors";

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v?.trim()) {
    throw new Error(
      `[Auth0] Falta ${name}. Creá frontend/.env.local (minúsculas) según frontend/.env.example y reiniciá el servidor.`,
    );
  }
  return v.trim();
}

const audience = process.env.AUTH0_AUDIENCE?.trim();

/**
 * URL pública de la app para OAuth (redirect_uri, cookies).
 * - En Vercel no uses APP_BASE_URL=http://localhost; si falta, usamos VERCEL_URL (previews incluidas).
 * - En local sin APP_BASE_URL, el SDK infiere el host desde el request.
 */
function resolveAppBaseUrl(): string | undefined {
  const explicit = process.env.APP_BASE_URL?.trim();
  if (explicit) return explicit;
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const base =
      vercel.startsWith("http://") || vercel.startsWith("https://") ? vercel : `https://${vercel}`;
    return base.replace(/\/$/, "");
  }
  return undefined;
}

/**
 * Texto útil que Auth0 envía en error_description (el SDK a veces solo muestra el mensaje genérico).
 */
function oauthFailureDetail(error: SdkError): string {
  const withCause = error as SdkError & {
    cause?: { message?: string; code?: string };
  };
  const c = withCause.cause;
  if (c && typeof c === "object" && "message" in c && typeof c.message === "string") {
    const code = "code" in c && typeof c.code === "string" ? `[${c.code}] ` : "";
    return `${code}${c.message}`.trim();
  }
  return error.message;
}

function redirectAfterLogin(ctx: { returnTo?: string; appBaseUrl?: string }) {
  const appBaseUrl = ctx.appBaseUrl;
  if (!appBaseUrl) {
    return new NextResponse("appBaseUrl could not be resolved for the callback redirect.", {
      status: 500,
    });
  }
  const path = ctx.returnTo || "/";
  const safePath = path.startsWith("/") ? path : `/${path}`;
  return NextResponse.redirect(new URL(safePath, appBaseUrl));
}

/**
 * Cliente Auth0 (v4): middleware, sesión y tokens.
 */
export const auth0 = new Auth0Client({
  domain: requiredEnv("AUTH0_DOMAIN"),
  clientId: requiredEnv("AUTH0_CLIENT_ID"),
  clientSecret: requiredEnv("AUTH0_CLIENT_SECRET"),
  secret: requiredEnv("AUTH0_SECRET"),
  appBaseUrl: resolveAppBaseUrl(),
  authorizationParameters: {
    scope: "openid profile email offline_access",
    ...(audience ? { audience } : {}),
  },
  async onCallback(error, ctx, _session) {
    if (error) {
      const detail = oauthFailureDetail(error);
      console.error("[Auth0] onCallback:", error.name, detail);
      const base = ctx.appBaseUrl ?? resolveAppBaseUrl() ?? "http://localhost:3000";
      const login = new URL("/login", base);
      login.searchParams.set("error", "auth");
      if (detail) {
        login.searchParams.set("reason", detail.slice(0, 500));
      }
      return NextResponse.redirect(login);
    }
    return redirectAfterLogin(ctx);
  },
});
