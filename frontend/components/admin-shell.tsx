"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import type { ReactNode } from "react";

export function AdminShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-zinc-500">
        Cargando…
      </div>
    );
  }

  if (user?.role !== "ADMIN") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-display text-4xl uppercase text-white">Acceso denegado</h1>
        <p className="mt-2 text-zinc-400">
          Esta sección es solo para administradores de la tienda.
        </p>
        <Link href="/tienda" className="btn-brand mt-6 inline-flex">
          Volver a la tienda
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-6xl flex-col gap-6 px-4 py-8 md:flex-row">
      <aside className="panel-brand w-full shrink-0 p-4 md:w-52">
        <p className="mb-3 font-display text-sm uppercase tracking-wide text-brand-yellow">
          Panel
        </p>
        <nav className="flex flex-col gap-1 text-sm">
          <Link
            href="/admin"
            className="px-2 py-1.5 text-zinc-300 hover:bg-brand-black hover:text-brand-yellow"
          >
            Resumen
          </Link>
          <Link
            href="/admin/pedidos"
            className="px-2 py-1.5 text-zinc-300 hover:bg-brand-black hover:text-brand-yellow"
          >
            Pedidos
          </Link>
          <Link
            href="/admin/categorias"
            className="px-2 py-1.5 text-zinc-300 hover:bg-brand-black hover:text-brand-yellow"
          >
            Categorías
          </Link>
          <Link
            href="/admin/tallas"
            className="px-2 py-1.5 text-zinc-300 hover:bg-brand-black hover:text-brand-yellow"
          >
            Tallas
          </Link>
          <Link
            href="/admin/productos"
            className="px-2 py-1.5 text-zinc-300 hover:bg-brand-black hover:text-brand-yellow"
          >
            Productos
          </Link>
        </nav>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
