"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import type { Category } from "@/lib/types";

export default function TiendaPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiFetch<Category[]>("/categories", { skipAuth: true });
        if (!cancelled) setCategories(data);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "No se pudieron cargar las categorías");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 text-zinc-600">Cargando categorías…</div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 text-red-600">
        {error}{" "}
        <span className="text-zinc-500">
          (¿Está el backend en <code className="rounded bg-zinc-200 px-1">localhost:3001</code>?)
        </span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-zinc-900">Tienda</h1>
      <p className="mt-2 text-zinc-600">
        Elegí una categoría para ver los productos.
      </p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <li key={c.id}>
            <Link
              href={`/categoria/${c.id}`}
              className="block rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-amber-400 hover:shadow-md"
            >
              <span className="text-lg font-semibold text-zinc-900">{c.name}</span>
              {c.slug && (
                <span className="mt-1 block text-sm text-zinc-500">{c.slug}</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
      {categories.length === 0 && (
        <p className="mt-8 text-zinc-500">
          No hay categorías todavía. Creá algunas desde el panel admin (API).
        </p>
      )}
    </div>
  );
}
