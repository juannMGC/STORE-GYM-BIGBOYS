"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import type { ProductDetail } from "@/lib/types";

export default function ProductoPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { user } = useAuth();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sizeId, setSizeId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const needsSize = (product?.sizes?.length ?? 0) > 0;

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await apiFetch<ProductDetail>(`/products/${id}`, {
          skipAuth: true,
        });
        if (!cancelled) {
          setProduct(data);
          if (data.sizes.length === 1) {
            setSizeId(data.sizes[0].size.id);
          }
        }
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Producto no encontrado");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function addToCart() {
    if (!product || !user) return;
    setMsg(null);
    if (needsSize && !sizeId) {
      setMsg("Elegí una talla.");
      return;
    }
    setAdding(true);
    try {
      await apiFetch("/orders/cart/items", {
        method: "POST",
        body: JSON.stringify({
          productId: product.id,
          quantity: 1,
          ...(needsSize && sizeId ? { sizeId } : {}),
        }),
      });
      router.push("/carrito");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "No se pudo añadir");
    } finally {
      setAdding(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 text-zinc-600">Cargando…</div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 text-red-600">
        {error ?? "No encontrado"}
      </div>
    );
  }

  const canAdd = Boolean(user) && (!needsSize || Boolean(sizeId));

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <nav className="text-sm text-zinc-500">
        <Link href="/tienda" className="hover:text-amber-600">
          Tienda
        </Link>
        <span className="mx-2">/</span>
        <Link
          href={`/categoria/${product.categoryId}`}
          className="hover:text-amber-600"
        >
          Categoría
        </Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-800">{product.title}</span>
      </nav>

      <div className="mt-8 grid gap-10 md:grid-cols-2">
        <div className="space-y-2">
          {product.images.length > 0 ? (
            product.images.map((im) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={im.id}
                src={im.url}
                alt=""
                className="w-full rounded-xl object-cover"
              />
            ))
          ) : (
            <div className="flex aspect-square items-center justify-center rounded-xl bg-zinc-200 text-zinc-500">
              Sin imagen
            </div>
          )}
        </div>
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">{product.title}</h1>
          <p className="mt-4 text-3xl font-bold text-amber-600">
            ${product.price.toFixed(2)}
          </p>
          {product.description && (
            <p className="mt-6 whitespace-pre-wrap text-zinc-600">{product.description}</p>
          )}

          {needsSize && (
            <div className="mt-8">
              <label className="block text-sm font-medium text-zinc-700">
                Talla
              </label>
              <select
                className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2"
                value={sizeId ?? ""}
                onChange={(e) => setSizeId(e.target.value || null)}
              >
                <option value="">Elegir…</option>
                {product.sizes.map(({ size }) => (
                  <option key={size.id} value={size.id}>
                    {size.name} ({size.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3">
            <button
              type="button"
              disabled={!canAdd || adding}
              onClick={() => void addToCart()}
              className="rounded-lg bg-amber-500 px-6 py-3 font-semibold text-zinc-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {user ? (adding ? "Añadiendo…" : "Añadir al carrito") : "Añadir al carrito"}
            </button>
            {!user && (
              <p className="text-sm text-zinc-500">
                <Link href="/login" className="font-medium text-amber-700 underline">
                  Iniciá sesión
                </Link>{" "}
                o{" "}
                <Link href="/registro" className="font-medium text-amber-700 underline">
                  registrate
                </Link>{" "}
                para comprar. El botón está deshabilitado para visitantes.
              </p>
            )}
            {msg && <p className="text-sm text-red-600">{msg}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
