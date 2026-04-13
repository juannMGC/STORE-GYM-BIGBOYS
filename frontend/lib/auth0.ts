import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { NextResponse } from "next/server";
import type { SdkError } from "@auth0/nextjs-auth0/errors";
import { LOGIN_ENTRY_HREF } from "@/lib/auth-routes";

const DEFAULT_APP_BASE_URL = "https://bigboysgym.com";

const AUTH0_ENV_KEYS = [
  "AUTH0_DOMAIN",
  "AUTH0_CLIENT_ID",
  "AUTH0_CLIENT_SECRET",
  "AUTH0_SECRET",
  "AUTH0_AUDIENCE",
] as const;

function isAuth0Configured(): boolean {
  return AUTH0_ENV_KEYS.every((k) => Boolean(process.env[k]?.trim()));
}

/** Qué variables faltan (solo nombres) — útil para depurar Vercel Production vs Preview. */
export function missingAuth0EnvKeys(): string[] {
  return [...AUTH0_ENV_KEYS.filter((k) => !process.env[k]?.trim())];
}

function resolveAppBaseUrl(): string {
  return process.env.APP_BASE_URL?.trim() || DEFAULT_APP_BASE_URL;
}

function createAuth0Client(): Auth0Client {
  return new Auth0Client({
    domain: process.env.AUTH0_DOMAIN!,
    clientId: process.env.AUTH0_CLIENT_ID!,
    clientSecret: process.env.AUTH0_CLIENT_SECRET!,
    appBaseUrl: process.env.APP_BASE_URL?.trim() || DEFAULT_APP_BASE_URL,
    secret: process.env.AUTH0_SECRET!,
    authorizationParameters: {
      audience: process.env.AUTH0_AUDIENCE!,
      scope: "openid profile email offline_access",
    },
    async onCallback(error, ctx, _session) {
      if (error) {
        const detail = oauthFailureDetail(error);
        console.error("[Auth0] onCallback:", error.name, detail);
        const base = ctx.appBaseUrl ?? resolveAppBaseUrl();
        const login = new URL(LOGIN_ENTRY_HREF, base);
        login.searchParams.set("error", "auth");
        if (detail) {
          login.searchParams.set("reason", detail.slice(0, 500));
        }
        return NextResponse.redirect(login);
      }
      return redirectAfterLogin(ctx);
    },
  });
}

/**
 * Cliente Auth0 v4 (servidor). `appBaseUrl` = `APP_BASE_URL` o `https://bigboysgym.com`.
 */
let _auth0: Auth0Client | null = null;
if (isAuth0Configured()) {
  try {
    _auth0 = createAuth0Client();
  } catch (e) {
    console.error("[auth0] No se pudo crear Auth0Client:", e);
  }
}
export const auth0: Auth0Client | null = _auth0;

export function getAuth0Client(): Auth0Client | null {
  return auth0;
}

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

function safeReturnPath(returnTo: string | undefined): string {
  const raw = (returnTo ?? "").trim();
  if (!raw || raw === "/auth/callback") return "/";
  const path = raw.startsWith("/") ? raw : `/${raw}`;
  if (path.startsWith("/auth/callback")) return "/";
  if (path.includes("//") || path.includes("://")) return "/";
  return path;
}

function redirectAfterLogin(ctx: { returnTo?: string; appBaseUrl?: string }) {
  const appBaseUrl = ctx.appBaseUrl;
  if (!appBaseUrl) {
    return new NextResponse("appBaseUrl could not be resolved for the callback redirect.", {
      status: 500,
    });
  }
  const safePath = safeReturnPath(ctx.returnTo);
  return NextResponse.redirect(new URL(safePath, appBaseUrl));
}
