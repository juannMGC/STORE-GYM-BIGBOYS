"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiError, apiFetch, formatShopApiError, isSessionExpiredError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { auth0LoginHref, auth0SignupHref } from "@/lib/auth-routes";
import type { ProductDetail } from "@/lib/types";

type Props = {
  apiPath: string;
};

export function ProductDetailView({ apiPath }: Props) {
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sizeId, setSizeId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState(false);
  const [sessionTokenError, setSessionTokenError] = useState(false);
  const [isNotFound, setIsNotFound] = useState(false);

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
        if (!cancelled) {
          if (e instanceof ApiError && e.status === 404) {
            setIsNotFound(true);
          } else {
            setError(e instanceof Error ? e.message : "Producto no encontrado");
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiPath]);

  if (isNotFound) {
    notFound();
  }

  async function addToCart() {
    if (!product || !isLoggedIn) return;
    setMsg(null);
    setAddSuccess(false);
    setSessionTokenError(false);
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
      setAddSuccess(true);
    } catch (e) {
      if (isSessionExpiredError(e)) {
        setSessionTokenError(true);
        setMsg(formatShopApiError(e, { sessionActive: true }));
      } else if (e instanceof ApiError && e.status === 401) {
        setMsg("Sesión expirada, volvé a iniciar sesión.");
      } else {
        setMsg(e instanceof Error ? e.message : "No se pudo añadir");
      }
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

  const stock = product.stock ?? 0;
  const canBuy = !authLoading && isLoggedIn;
  const sizeOk = !needsSize || Boolean(sizeId);
  const canClickAdd = canBuy && sizeOk && !adding && stock > 0;
  const productUrl =
    product.slug != null && product.slug !== ""
      ? `/tienda/productos/${product.slug}`
      : `/producto/${product.id}`;
  const loginHref = auth0LoginHref(productUrl, "login");
  const signupHref = auth0SignupHref(productUrl);

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
          {stock > 10 ? null : stock > 0 && stock <= 10 ? (
            <p className="mt-3">
              <span
                style={{
                  color: "#f7e047",
                  fontSize: "13px",
                  background: "#1a1a1a",
                  border: "1px solid #f7e047",
                  padding: "2px 8px",
                  borderRadius: "2px",
                }}
              >
                ⚠️ Solo quedan {stock} unidades
              </span>
            </p>
          ) : (
            <p className="mt-3">
              <span
                style={{
                  color: "#d91920",
                  fontSize: "13px",
                  background: "#1a1a1a",
                  border: "1px solid #d91920",
                  padding: "2px 8px",
                  borderRadius: "2px",
                }}
              >
                ❌ Agotado
              </span>
            </p>
          )}
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
              disabled={stock === 0 || !canClickAdd}
              onClick={() => void addToCart()}
              className="btn-brand w-full disabled:cursor-not-allowed sm:w-auto"
              style={{
                opacity: stock === 0 || !canClickAdd ? 0.5 : 1,
                cursor: stock === 0 ? "not-allowed" : "pointer",
              }}
            >
              {authLoading
                ? "Cargando…"
                : stock === 0
                  ? "Agotado"
                  : !isLoggedIn
                    ? "Iniciá sesión para comprar"
                    : adding
                      ? "Añadiendo…"
                      : "Añadir al carrito"}
            </button>
            {!authLoading && !isLoggedIn && (
              <p className="text-sm text-zinc-500">
                <a href={loginHref} className="font-medium text-brand-yellow hover:underline">
                  Iniciá sesión
                </a>{" "}
                o{" "}
                <a href={signupHref} className="font-medium text-brand-yellow hover:underline">
                  registrate
                </a>{" "}
                para comprar. Volvés a esta página al terminar.
              </p>
            )}
            {addSuccess && (
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                <p className="text-sm font-medium text-emerald-400">
                  ✓ Producto agregado al carrito
                </p>
                <Link
                  href="/carrito"
                  className="text-sm font-medium text-brand-yellow hover:underline"
                >
                  Ver carrito →
                </Link>
              </div>
            )}
            {msg && <p className="text-sm text-brand-red">{msg}</p>}
            {sessionTokenError && (
              <a href={loginHref} className="btn-brand-outline mt-2 inline-block text-center sm:text-left">
                Volver a iniciar sesión
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
