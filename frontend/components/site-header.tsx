"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { auth0LoginHref, auth0SignupHref } from "@/lib/auth-routes";

/**
 * Auth en nav: usa `useAuth` (no `useUser` de Auth0).
 * Entrar / Registro = <a> navegación completa (Auth0).
 */
export function SiteHeader() {
  const pathname = usePathname() ?? "/";
  const returnTo = pathname || "/";
  const entrarHref = auth0LoginHref(returnTo, "login");
  const registroHref = auth0SignupHref(returnTo);
  const { user, displayName, isLoggedIn, isLoading } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const showGuestNav = !isLoggedIn && !isLoading;
  const greet =
    displayName.trim() ||
    (isLoggedIn ? "Sesión activa" : "");

  return (
    <header className="sticky top-0 z-[100] border-b-4 border-brand-red bg-brand-black/95 shadow-[0_4px_24px_rgba(0,0,0,0.6)] backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:h-[4.5rem]">
        <Link
          href="/"
          className="flex items-center gap-3 transition hover:opacity-90"
        >
          <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-sm border-2 border-brand-yellow/80 bg-black sm:h-14 sm:w-14">
            <Image
              src="/brand/logo-bigboys.jpg"
              alt="BIG BOYS GYM"
              fill
              className="object-cover"
              sizes="56px"
            />
          </span>
          <span className="font-display text-2xl leading-none tracking-wide text-brand-yellow sm:text-3xl">
            BIG BOYS
            <span className="block font-display text-sm text-zinc-400 sm:text-base">
              GYM · TIENDA
            </span>
          </span>
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-1 text-sm sm:gap-2">
          <Link
            href="/"
            className="rounded-sm px-2 py-1.5 font-medium uppercase tracking-wide text-zinc-300 hover:bg-brand-steel hover:text-brand-yellow"
          >
            Inicio
          </Link>
          <Link
            href="/tienda"
            className="rounded-sm px-2 py-1.5 font-medium uppercase tracking-wide text-zinc-300 hover:bg-brand-steel hover:text-brand-yellow"
          >
            Tienda
          </Link>
          {isLoggedIn && greet && (
            <span
              className="inline max-w-[10rem] truncate text-xs font-medium text-brand-yellow/90 sm:max-w-[14rem]"
              title={greet}
            >
              Hola, {greet}
            </span>
          )}
          {isLoading && !isLoggedIn && (
            <span className="text-xs text-zinc-500">Cargando…</span>
          )}
          {isLoggedIn ? (
            <>
              <Link
                href="/carrito"
                className="rounded-sm px-2 py-1.5 font-semibold uppercase tracking-wide text-brand-yellow hover:bg-brand-red/20"
              >
                Carrito
              </Link>
              {user?.role === "CLIENT" && (
                <Link
                  href="/mis-pedidos"
                  className="rounded-sm px-2 py-1.5 font-medium uppercase tracking-wide text-zinc-300 hover:bg-brand-steel hover:text-brand-yellow"
                >
                  Mis pedidos
                </Link>
              )}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="rounded-sm border border-brand-yellow/40 px-2 py-1.5 font-semibold uppercase tracking-wide text-brand-yellow hover:bg-brand-yellow/10"
                >
                  Admin
                </Link>
              )}
              <a
                href="/auth/logout"
                className="rounded-sm px-2 py-1.5 text-xs uppercase text-zinc-500 hover:text-zinc-300"
              >
                Salir
              </a>
            </>
          ) : showGuestNav ? (
            <>
              <a
                href={entrarHref}
                className="rounded-sm px-2 py-1.5 font-medium text-zinc-400 hover:text-white"
              >
                Entrar
              </a>
              <a
                href={registroHref}
                className="rounded-sm border-2 border-brand-red bg-brand-red px-3 py-1.5 font-display text-sm uppercase tracking-wide text-white hover:bg-brand-red-dark"
              >
                Registro
              </a>
            </>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
