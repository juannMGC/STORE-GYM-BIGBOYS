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
        {categories.map((c) => {
          const url = c.imageUrl?.trim();
          return (
            <li key={c.id}>
              <Link
                href={`/categoria/${c.id}`}
                className="panel-brand block overflow-hidden transition hover:border-brand-red"
              >
                <div className="w-full overflow-hidden bg-brand-black">
                  {url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={url}
                      alt={c.name}
                      style={{
                        width: "100%",
                        height: "160px",
                        objectFit: "cover",
                        display: "block",
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        const next = e.currentTarget.nextElementSibling as HTMLElement | null;
                        if (next) next.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    style={{
                      display: url ? "none" : "flex",
                      width: "100%",
                      height: "160px",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "#1a1a1a",
                      fontSize: "4rem",
                      color: "#d91920",
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                </div>
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
          );
        })}
      </ul>
      {categories.length === 0 && (
        <p className="mt-10 text-zinc-500">
          No hay categorías todavía. Creá algunas desde el panel admin (API).
        </p>
      )}
    </div>
  );
}
