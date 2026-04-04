"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import type { ReactNode } from "react";

export function AdminShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-zinc-600">
        Cargando…
      </div>
    );
  }

  if (user?.role !== "ADMIN") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-zinc-900">Acceso denegado</h1>
        <p className="mt-2 text-zinc-600">
          Esta sección es solo para administradores de la tienda.
        </p>
        <Link
          href="/tienda"
          className="mt-6 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-800"
        >
          Volver a la tienda
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-6xl flex-col gap-6 px-4 py-8 md:flex-row">
      <aside className="w-full shrink-0 rounded-xl border border-zinc-200 bg-white p-4 md:w-52">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Panel
        </p>
        <nav className="flex flex-col gap-1 text-sm">
          <Link
            href="/admin"
            className="rounded px-2 py-1.5 text-zinc-700 hover:bg-zinc-100"
          >
            Resumen
          </Link>
          <Link
            href="/admin/pedidos"
            className="rounded px-2 py-1.5 text-zinc-700 hover:bg-zinc-100"
          >
            Pedidos
          </Link>
        </nav>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
