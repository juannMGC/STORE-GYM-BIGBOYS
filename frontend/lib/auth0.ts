import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { NextResponse } from "next/server";
import type { SdkError } from "@auth0/nextjs-auth0/errors";
import { LOGIN_ENTRY_HREF } from "@/lib/auth-routes";

const AUTH0_ENV_KEYS = [
  "AUTH0_DOMAIN",
  "AUTH0_CLIENT_ID",
  "AUTH0_CLIENT_SECRET",
  "AUTH0_SECRET",
] as const;

/**
 * URL canónica opcional. Si no está definida, el SDK infiere la base desde cada request
 * (Host / x-forwarded-host), así el redirect_uri coincide con la URL real del navegador.
 */
function resolveAppBaseUrl(): string | undefined {
  const explicit =
    process.env.APP_BASE_URL?.trim() || process.env.AUTH0_BASE_URL?.trim();
  if (explicit) return explicit;
  return undefined;
}

function isAuth0Configured(): boolean {
  return AUTH0_ENV_KEYS.every((k) => Boolean(process.env[k]?.trim()));
}

/** Qué variables faltan (solo nombres) — útil para depurar Vercel Production vs Preview. */
export function missingAuth0EnvKeys(): string[] {
  return [...AUTH0_ENV_KEYS.filter((k) => !process.env[k]?.trim())];
}

function createAuth0Client(): Auth0Client | null {
  if (!isAuth0Configured()) {
    if (process.env.VERCEL) {
      console.warn("[auth0] Faltan variables:", missingAuth0EnvKeys().join(", ") || "(desconocido)");
    }
    return null;
  }

  /** Solo en servidor (middleware + /auth/*). Obligatorio para que el access token sea JWT del API Nest. */
  const audience = process.env.AUTH0_AUDIENCE?.trim();
  if (!audience && process.env.NODE_ENV === "development") {
    console.warn(
      "[auth0] AUTH0_AUDIENCE no está definido: el login no pedirá token para tu API. Definilo en .env.local (mismo Identifier que en Auth0 → APIs).",
    );
  }

  try {
    return new Auth0Client({
      domain: process.env.AUTH0_DOMAIN!.trim(),
      clientId: process.env.AUTH0_CLIENT_ID!.trim(),
      clientSecret: process.env.AUTH0_CLIENT_SECRET!.trim(),
      secret: process.env.AUTH0_SECRET!.trim(),
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
  } catch (e) {
    console.error("[auth0] No se pudo crear Auth0Client:", e);
    return null;
  }
}

/**
 * Lazy singleton solo si el cliente se creó bien — no cachear `null` (Edge vs Node ven env distinto).
 */
let cached: Auth0Client | undefined;

export function getAuth0Client(): Auth0Client | null {
  if (cached) {
    return cached;
  }
  const c = createAuth0Client();
  if (c) {
    cached = c;
  }
  return c;
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
