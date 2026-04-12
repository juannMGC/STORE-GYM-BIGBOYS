import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getAuth0Client } from "@/lib/auth0";
import { LOGIN_ENTRY_HREF, auth0LoginHref } from "@/lib/auth-routes";

const PROTECTED_PREFIXES = [
  "/carrito",
  "/checkout",
  "/admin",
  "/perfil",
  "/mis-pedidos",
];

/** v3 y docs antiguas usaban /api/auth/*; el rewrite /api/* → Nest captura eso y el login no llega al SDK. */
const LEGACY_AUTH0_TO_V4: Record<string, string> = {
  "/api/auth/login": "/auth/login",
  "/api/auth/logout": "/auth/logout",
  "/api/auth/callback": "/auth/callback",
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const legacyTarget = LEGACY_AUTH0_TO_V4[pathname];
  if (legacyTarget) {
    const url = request.nextUrl.clone();
    url.pathname = legacyTarget;
    return NextResponse.redirect(url);
  }

  const auth0 = getAuth0Client();

  if (!auth0) {
    const needsAuth = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
    if (needsAuth) {
      const url = request.nextUrl.clone();
      url.pathname = LOGIN_ENTRY_HREF;
      url.searchParams.set("error", "config");
      url.searchParams.set(
        "reason",
        "Auth0 no está configurado en el servidor (faltan variables en Vercel).",
      );
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  try {
    const authRes = await auth0.middleware(request);

    if (pathname.startsWith("/auth")) {
      return authRes;
    }

    const needsAuth = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
    if (!needsAuth) {
      return authRes;
    }

    const session = await auth0.getSession(request);
    if (!session) {
      const returnPath = pathname + request.nextUrl.search;
      const loginTarget = auth0LoginHref(returnPath, "login");
      return NextResponse.redirect(new URL(loginTarget, request.url));
    }

    /** Carrito y checkout solo para CLIENT: ADMIN → panel admin */
    if (pathname.startsWith("/carrito") || pathname.startsWith("/checkout")) {
      try {
        const { token } = await auth0.getAccessToken(request, authRes);
        if (token) {
          const meRes = await fetch(new URL("/api/auth/me", request.url), {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          });
          if (meRes.ok) {
            const meData = (await meRes.json()) as { user?: { role?: string } };
            if (meData?.user?.role === "ADMIN") {
              return NextResponse.redirect(new URL("/admin", request.url));
            }
          }
        }
      } catch {
        /* no bloquear si falla el rol */
      }
    }

    return authRes;
  } catch (err) {
    console.error("[middleware] Auth0:", err);
    const needsAuth = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
    const msg = err instanceof Error ? err.message.slice(0, 280) : "Error en middleware";
    if (needsAuth || pathname.startsWith("/auth")) {
      const url = request.nextUrl.clone();
      url.pathname = LOGIN_ENTRY_HREF;
      url.searchParams.set("error", "config");
      url.searchParams.set("reason", msg);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
