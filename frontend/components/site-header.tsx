"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export function SiteHeader() {
  const { user, loading, logout } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="text-lg font-bold tracking-tight text-white">
          Big Boys
        </Link>
        <nav className="flex flex-wrap items-center gap-1 text-sm sm:gap-3">
          <Link
            href="/"
            className="rounded px-2 py-1 text-zinc-300 hover:bg-zinc-800 hover:text-white"
          >
            Inicio
          </Link>
          <Link
            href="/tienda"
            className="rounded px-2 py-1 text-zinc-300 hover:bg-zinc-800 hover:text-white"
          >
            Tienda
          </Link>
          {!loading && user && (
            <>
              <Link
                href="/carrito"
                className="rounded px-2 py-1 font-medium text-amber-400 hover:bg-zinc-800 hover:text-amber-300"
              >
                Carrito
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="rounded px-2 py-1 font-medium text-emerald-400 hover:bg-zinc-800 hover:text-emerald-300"
                >
                  Admin
                </Link>
              )}
            </>
          )}
          {!loading && !user && (
            <>
              <Link
                href="/login"
                className="rounded px-2 py-1 text-zinc-300 hover:bg-zinc-800 hover:text-white"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/registro"
                className="rounded bg-amber-500 px-3 py-1 font-medium text-zinc-950 hover:bg-amber-400"
              >
                Registro
              </Link>
            </>
          )}
          {!loading && user && (
            <button
              type="button"
              onClick={() => logout()}
              className="rounded px-2 py-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              Salir
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
