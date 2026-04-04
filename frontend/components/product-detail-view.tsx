"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import type { ProductDetail } from "@/lib/types";

type Props = {
  apiPath: string;
};

export function ProductDetailView({ apiPath }: Props) {
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
    let cancelled = false;
    (async () => {
      try {
        const data = await apiFetch<ProductDetail>(apiPath, {
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
  }, [apiPath]);

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
      <div className="mx-auto max-w-6xl px-4 py-16 text-center text-zinc-500">
        Cargando…
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center text-brand-red">
        {error ?? "No encontrado"}
      </div>
    );
  }

  const canAdd = Boolean(user) && (!needsSize || Boolean(sizeId));
  const productUrl =
    product.slug != null && product.slug !== ""
      ? `/tienda/productos/${product.slug}`
      : `/producto/${product.id}`;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <nav className="text-sm text-zinc-500">
        <Link href="/tienda" className="hover:text-brand-yellow">
          Tienda
        </Link>
        <span className="mx-2 text-zinc-600">/</span>
        <Link
          href={`/categoria/${product.categoryId}`}
          className="hover:text-brand-yellow"
        >
          Categoría
        </Link>
        <span className="mx-2 text-zinc-600">/</span>
        <Link href={productUrl} className="text-zinc-300 hover:text-brand-yellow">
          {product.title}
        </Link>
      </nav>

      <div className="mt-8 grid gap-10 md:grid-cols-2">
        <div className="panel-brand space-y-3 overflow-hidden rounded-sm p-1">
          {product.images.length > 0 ? (
            product.images.map((im) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={im.id}
                src={im.url}
                alt=""
                className="w-full rounded-sm object-cover"
              />
            ))
          ) : (
            <div className="flex aspect-square items-center justify-center rounded-sm bg-brand-black text-zinc-600">
              Sin imagen
            </div>
          )}
        </div>
        <div>
          <h1 className="font-display text-4xl uppercase leading-tight text-white md:text-5xl">
            {product.title}
          </h1>
          <p className="mt-4 font-display text-4xl text-brand-yellow">
            ${" "}
            {product.price.toLocaleString("es-CO", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </p>
          {product.description && (
            <p className="mt-6 whitespace-pre-wrap leading-relaxed text-zinc-400">
              {product.description}
            </p>
          )}

          {needsSize && (
            <div className="mt-8">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Talla
              </label>
              <select
                className="mt-2 w-full border-2 border-brand-border bg-brand-steel px-3 py-2.5 text-zinc-100 focus:border-brand-yellow focus:outline-none"
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

          <div className="mt-8 flex flex-col gap-4">
            <button
              type="button"
              disabled={!canAdd || adding}
              onClick={() => void addToCart()}
              className="btn-brand w-full disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
            >
              {user ? (adding ? "Añadiendo…" : "Añadir al carrito") : "Añadir al carrito"}
            </button>
            {!user && (
              <p className="text-sm text-zinc-500">
                <Link href="/login" className="font-medium text-brand-yellow hover:underline">
                  Iniciá sesión
                </Link>{" "}
                o{" "}
                <Link href="/registro" className="font-medium text-brand-yellow hover:underline">
                  registrate
                </Link>{" "}
                para comprar. El botón está deshabilitado para visitantes.
              </p>
            )}
            {msg && <p className="text-sm text-brand-red">{msg}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
