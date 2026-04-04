"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import type { CartOrder } from "@/lib/types";

export default function CarritoPage() {
  const [order, setOrder] = useState<CartOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await apiFetch<CartOrder | null>("/orders/cart");
      setOrder(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function setQty(itemId: string, quantity: number) {
    try {
      await apiFetch(`/orders/cart/items/${itemId}`, {
        method: "PATCH",
        body: JSON.stringify({ quantity }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    }
  }

  async function removeLine(itemId: string) {
    try {
      await apiFetch(`/orders/cart/items/${itemId}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-zinc-600">Cargando carrito…</div>
    );
  }

  if (error) {
    return <div className="mx-auto max-w-3xl px-4 py-12 text-red-600">{error}</div>;
  }

  if (!order || order.items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-zinc-900">Tu carrito está vacío</h1>
        <Link
          href="/tienda"
          className="mt-6 inline-block rounded-lg bg-amber-500 px-6 py-3 font-semibold text-zinc-950 hover:bg-amber-400"
        >
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
      <h1 className="text-3xl font-bold text-zinc-900">Carrito</h1>
      <ul className="mt-8 divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white">
        {order.items.map((line) => (
          <li key={line.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded bg-zinc-100">
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
              <p className="font-medium text-zinc-900">{line.product.title}</p>
              {line.size && (
                <p className="text-sm text-zinc-500">Talla: {line.size.name}</p>
              )}
              <p className="text-sm text-zinc-600">
                ${line.priceSnapshot.toFixed(2)} c/u
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                className="w-16 rounded border border-zinc-300 px-2 py-1"
                value={line.quantity}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (!Number.isNaN(v)) void setQty(line.id, v);
                }}
              />
              <button
                type="button"
                onClick={() => void removeLine(line.id)}
                className="text-sm text-red-600 hover:underline"
              >
                Quitar
              </button>
            </div>
            <div className="font-semibold text-zinc-900">
              ${(line.priceSnapshot * line.quantity).toFixed(2)}
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex items-center justify-between border-t border-zinc-200 pt-6">
        <span className="text-lg font-semibold text-zinc-700">Subtotal</span>
        <span className="text-2xl font-bold text-amber-600">${subtotal.toFixed(2)}</span>
      </div>
      <Link
        href="/checkout"
        className="mt-8 inline-flex w-full items-center justify-center rounded-lg bg-zinc-900 py-3 font-semibold text-white hover:bg-zinc-800 sm:w-auto sm:px-10"
      >
        Continuar al checkout
      </Link>
    </div>
  );
}
