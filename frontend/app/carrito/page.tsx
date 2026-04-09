"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiFetch, formatShopApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { LOGIN_ENTRY_HREF } from "@/lib/auth-routes";
import type { CartOrder } from "@/lib/types";

export default function CarritoPage() {
  const { isLoggedIn, loading: authLoading, displayName } = useAuth();
  const [order, setOrder] = useState<CartOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** Solo se llama cuando `isLoggedIn`; en el catch asumimos sesión web activa. */
  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await apiFetch<CartOrder | null>("/orders/cart");
      setOrder(data);
    } catch (e) {
      setError(formatShopApiError(e, { sessionActive: true }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) {
      setLoading(false);
      setOrder(null);
      setError(null);
      return;
    }
    void load();
  }, [authLoading, isLoggedIn, load]);

  async function setQty(itemId: string, quantity: number) {
    try {
      await apiFetch(`/orders/cart/items/${itemId}`, {
        method: "PATCH",
        body: JSON.stringify({ quantity }),
      });
      await load();
    } catch (e) {
      setError(formatShopApiError(e, { sessionActive: isLoggedIn }));
    }
  }

  async function removeLine(itemId: string) {
    try {
      await apiFetch(`/orders/cart/items/${itemId}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setError(formatShopApiError(e, { sessionActive: isLoggedIn }));
    }
  }

  if (authLoading || (isLoggedIn && loading)) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-zinc-500">Cargando carrito…</div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="font-display text-4xl uppercase text-white">Tu carrito</h1>
        <p className="mt-4 text-zinc-400">
          Iniciá sesión para agregar productos y ver tu carrito en cualquier dispositivo.
        </p>
        <a href={LOGIN_ENTRY_HREF} className="btn-brand mt-8 inline-flex">
          Entrar con tu cuenta
        </a>
        <p className="mt-6 text-sm text-zinc-500">
          ¿No tenés cuenta?{" "}
          <Link href="/registrar/cuenta" className="text-brand-yellow hover:underline">
            Registrate
          </Link>
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-display text-3xl uppercase text-white">Carrito</h1>
        <p className="mt-4 text-brand-red">{error}</p>
        <a href={LOGIN_ENTRY_HREF} className="btn-brand-outline mt-6 inline-block">
          Volver a entrar
        </a>
      </div>
    );
  }

  if (!order || order.items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="font-display text-4xl uppercase text-white">Tu carrito está vacío</h1>
        {displayName ? (
          <p className="mt-2 text-sm text-zinc-500">Hola, {displayName}</p>
        ) : null}
        <Link href="/tienda" className="btn-brand mt-8 inline-flex">
          Ir a la tienda
        </Link>
      </div>
    );
  }

  const subtotal = order.items.reduce(
    (s, i) => s + i.priceSnapshot * i.quantity,
    0,
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-5xl uppercase tracking-wide text-white">Carrito</h1>
      {displayName ? (
        <p className="mt-1 text-sm text-zinc-500">Comprando como {displayName}</p>
      ) : null}
      <ul className="panel-brand mt-8 divide-y divide-brand-border">
        {order.items.map((line) => (
          <li
            key={line.id}
            className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center"
          >
            <div className="relative h-20 w-20 shrink-0 overflow-hidden border-2 border-brand-border bg-brand-black">
              {line.product.images[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={line.product.images[0].url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-zinc-100">{line.product.title}</p>
              {line.size && (
                <p className="text-sm text-zinc-500">Talla: {line.size.name}</p>
              )}
              <p className="text-sm text-zinc-400">
                ${line.priceSnapshot.toFixed(2)} c/u
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                className="input-brand w-16 px-2 py-1"
                value={line.quantity}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (!Number.isNaN(v)) void setQty(line.id, v);
                }}
              />
              <button
                type="button"
                onClick={() => void removeLine(line.id)}
                className="text-sm text-brand-red hover:underline"
              >
                Quitar
              </button>
            </div>
            <div className="font-display text-xl text-brand-yellow">
              ${(line.priceSnapshot * line.quantity).toFixed(2)}
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex items-center justify-between border-t-2 border-brand-border pt-6">
        <span className="font-display text-xl uppercase text-zinc-400">Subtotal</span>
        <span className="font-display text-3xl text-brand-yellow">${subtotal.toFixed(2)}</span>
      </div>
      <Link href="/checkout" className="btn-brand mt-8 inline-flex w-full sm:w-auto">
        Continuar al checkout
      </Link>
    </div>
  );
}
