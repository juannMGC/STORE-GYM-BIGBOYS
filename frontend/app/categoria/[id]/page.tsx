"use client";

import Link from "next/link";
import { BackButton } from "@/components/back-button";
import { notFound, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import type { ProductListItem } from "@/lib/types";

export default function CategoriaPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryMissing, setCategoryMissing] = useState(false);

  useEffect(() => {
    if (!id) {
      setCategoryMissing(true);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const categories = await apiFetch<{ id: string }[]>("/categories", {
          skipAuth: true,
        });
        if (!categories.some((c) => c.id === id)) {
          if (!cancelled) setCategoryMissing(true);
          return;
        }
        const qs = new URLSearchParams({ categoryId: id });
        const data = await apiFetch<ProductListItem[]>(`/products?${qs.toString()}`, {
          skipAuth: true,
        });
        if (!cancelled) setProducts(data);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Error al cargar productos");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (categoryMissing) {
    notFound();
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center text-zinc-500">
        Cargando…
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center text-brand-red">
        {error}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div style={{ padding: "16px 0 8px", marginBottom: "8px" }}>
        <BackButton href="/tienda" label="← Tienda" />
      </div>
      <nav className="text-sm text-zinc-500">
        <Link href="/tienda" className="hover:text-brand-yellow">
          Tienda
        </Link>
        <span className="mx-2 text-zinc-600">/</span>
        <span className="text-zinc-300">Productos</span>
      </nav>
      <h1 className="mt-4 font-display text-5xl uppercase tracking-wide text-white">
        Productos
      </h1>
      <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <li key={p.id}>
            <Link
              href={
                p.slug
                  ? `/tienda/productos/${encodeURIComponent(p.slug)}`
                  : `/producto/${p.id}`
              }
              className="panel-brand flex flex-col overflow-hidden transition hover:border-brand-red"
            >
              <div className="relative aspect-square bg-brand-black">
                {p.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.images[0].url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-zinc-600">
                    Sin foto
                  </div>
                )}
                {(p.stock ?? 0) === 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                      background: "#d91920",
                      color: "white",
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "3px 8px",
                      fontFamily: "var(--font-display)",
                      letterSpacing: "1px",
                      textTransform: "uppercase",
                    }}
                  >
                    AGOTADO
                  </div>
                )}
              </div>
              <div className="border-t-2 border-brand-border p-4">
                <span className="font-display text-xl uppercase leading-tight text-white">
                  {p.title}
                </span>
                <span className="mt-2 block font-display text-2xl text-brand-yellow">
                  ${" "}
                  {p.price.toLocaleString("es-CO", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {products.length === 0 && (
        <p className="mt-10 text-zinc-500">No hay productos en esta categoría.</p>
      )}
    </div>
  );
}
