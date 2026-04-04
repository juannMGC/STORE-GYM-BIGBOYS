"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import type { ProductListItem } from "@/lib/types";

export default function CategoriaPage() {
  const params = useParams();
  const id = params.id as string;
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
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

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 text-zinc-600">Cargando…</div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 text-red-600">{error}</div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <nav className="text-sm text-zinc-500">
        <Link href="/tienda" className="hover:text-amber-600">
          Tienda
        </Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-800">Categoría</span>
      </nav>
      <h1 className="mt-4 text-3xl font-bold text-zinc-900">Productos</h1>
      <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <li key={p.id}>
            <Link
              href={`/producto/${p.id}`}
              className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:border-amber-400"
            >
              <div className="relative aspect-square bg-zinc-100">
                {p.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.images[0].url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-zinc-400">
                    Sin foto
                  </div>
                )}
              </div>
              <div className="p-4">
                <span className="font-semibold text-zinc-900">{p.title}</span>
                <span className="mt-2 block text-lg font-bold text-amber-600">
                  ${p.price.toFixed(2)}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {products.length === 0 && (
        <p className="mt-8 text-zinc-500">No hay productos en esta categoría.</p>
      )}
    </div>
  );
}
