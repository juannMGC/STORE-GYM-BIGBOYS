"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import type { Category } from "@/lib/types";

/** Imagen de categoría con `c.imageUrl`; fallback si falla la carga o no hay URL. */
function CategoryCardMedia({ imageUrl, name }: { imageUrl: string | null | undefined; name: string }) {
  const [loadFailed, setLoadFailed] = useState(false);
  const url = imageUrl?.trim() ?? "";
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  useEffect(() => {
    setLoadFailed(false);
  }, [url]);

  if (!url || loadFailed) {
    return (
      <div
        className="flex h-40 w-full flex-col items-center justify-center gap-1 bg-gradient-to-b from-[#1a1a1a] to-[#2a2a2a] px-3"
        aria-hidden
      >
        <span className="text-center font-display text-lg uppercase leading-tight tracking-wide text-zinc-400">
          {name}
        </span>
        <span className="font-display text-4xl text-[#d91920]">{initial}</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={name}
      className="h-40 w-full object-cover"
      onError={() => setLoadFailed(true)}
    />
  );
}

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
      <div className="mx-auto max-w-6xl px-4 py-16 text-center text-zinc-500">
        Cargando categorías…
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-brand-red">
        {error}{" "}
        <span className="text-zinc-500">
          (¿Está el backend en{" "}
          <code className="rounded bg-brand-steel px-1 text-brand-yellow">localhost:3001</code>
          ?)
        </span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-5xl uppercase tracking-wide text-white md:text-6xl">
        Tienda
      </h1>
      <p className="mt-3 max-w-xl text-zinc-400">
        Elegí una categoría y encontrá lo que necesitás para el entrenamiento.
      </p>
      <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <li key={c.id}>
            <Link
              href={`/categoria/${c.id}`}
              className="panel-brand block overflow-hidden transition hover:border-brand-red"
            >
              <CategoryCardMedia imageUrl={c.imageUrl} name={c.name} />
              <div className="p-6">
                <span className="font-display text-2xl uppercase tracking-wide text-brand-yellow">
                  {c.name}
                </span>
                {c.slug ? (
                  <span className="mt-2 block font-mono text-xs text-zinc-500">{c.slug}</span>
                ) : null}
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {categories.length === 0 && (
        <p className="mt-10 text-zinc-500">
          No hay categorías todavía. Creá algunas desde el panel admin (API).
        </p>
      )}
    </div>
  );
}
