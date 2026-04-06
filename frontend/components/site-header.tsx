"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { LOGIN_ENTRY_HREF, REGISTRO_ENTRY_HREF } from "@/lib/auth-routes";

/**
 * Auth en nav: siempre visible si no hay `user` (no depende de `loading`).
 * Entrar / Registro = <a> navegación completa (Auth0).
 */
export function SiteHeader() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "ADMIN";

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
              priority
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
          {user ? (
            <>
              <Link
                href="/carrito"
                className="rounded-sm px-2 py-1.5 font-semibold uppercase tracking-wide text-brand-yellow hover:bg-brand-red/20"
              >
                Carrito
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="rounded-sm border border-brand-yellow/40 px-2 py-1.5 font-semibold uppercase tracking-wide text-brand-yellow hover:bg-brand-yellow/10"
                >
                  Admin
                </Link>
              )}
              <button
                type="button"
                onClick={() => logout()}
                className="rounded-sm px-2 py-1.5 text-xs uppercase text-zinc-500 hover:text-zinc-300"
              >
                Salir
              </button>
            </>
          ) : (
            <>
              <a
                href={LOGIN_ENTRY_HREF}
                className="rounded-sm px-2 py-1.5 font-medium text-zinc-400 hover:text-white"
              >
                Entrar
              </a>
              <a
                href={REGISTRO_ENTRY_HREF}
                className="rounded-sm border-2 border-brand-red bg-brand-red px-3 py-1.5 font-display text-sm uppercase tracking-wide text-white hover:bg-brand-red-dark"
              >
                Registro
              </a>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
