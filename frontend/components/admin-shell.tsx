"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";

const LINKS = [
  { href: "/admin", label: "📊 Resumen" },
  { href: "/admin/pedidos", label: "📦 Pedidos" },
  { href: "/admin/categorias", label: "📁 Categorías" },
  { href: "/admin/tallas", label: "📏 Tallas" },
  { href: "/admin/productos", label: "🛍️ Productos" },
  { href: "/admin/cupones", label: "🏷️ Cupones" },
] as const;

export function AdminShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

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
        <p className="mt-2 text-zinc-400">Esta sección es solo para administradores de la tienda.</p>
        <Link href="/tienda" className="btn-brand mt-6 inline-flex">
          Volver a la tienda
        </Link>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col md:flex-row">
      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="fixed inset-0 z-40 bg-black/70 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <aside
        className={`admin-sidebar fixed left-0 top-0 z-50 flex h-screen w-[260px] shrink-0 flex-col overflow-y-auto border-r border-brand-border bg-[#111111] transition-transform duration-300 ease-out md:sticky md:top-0 md:z-auto md:translate-x-0 md:transition-none ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="px-5 pb-5 pt-6">
          <p
            className="font-display text-lg uppercase tracking-[0.2em] text-brand-yellow"
            style={{ letterSpacing: "3px" }}
          >
            Panel admin
          </p>
        </div>
        <nav className="flex flex-col pb-8">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setSidebarOpen(false)}
              className="block border-b border-[#1a1a1a] px-5 py-3 text-sm text-zinc-200 transition hover:bg-[#1a1a1a]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="admin-main min-w-0 flex-1 p-4">
        <div className="admin-topbar-mobile mb-6 flex items-center gap-3 border-b border-brand-border pb-4 md:hidden">
          <button
            type="button"
            aria-label="Abrir menú"
            onClick={() => setSidebarOpen(true)}
            className="rounded-sm border border-brand-border px-2 py-2 text-zinc-200"
          >
            ☰
          </button>
          <span className="font-display text-sm uppercase tracking-[0.15em] text-brand-yellow">Admin</span>
        </div>
        {children}
      </main>
    </div>
  );
}
