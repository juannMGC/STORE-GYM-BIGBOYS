"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { apiFetch, formatShopApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { LOGIN_ENTRY_HREF } from "@/lib/auth-routes";
import type { CartOrder } from "@/lib/types";

const METHODS = [
  { value: "CASH", label: "Efectivo" },
  { value: "BANK_TRANSFER", label: "Transferencia bancaria" },
  { value: "CARD", label: "Tarjeta" },
] as const;

export default function CheckoutPage() {
  const router = useRouter();
  const { isLoggedIn, loading: authLoading, displayName } = useAuth();
  const [order, setOrder] = useState<CartOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState<string>("BANK_TRANSFER");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await apiFetch<CartOrder | null>("/orders/cart");
      setOrder(data);
      if (data?.paymentMethod) setMethod(data.paymentMethod);
    } catch (e) {
      setError(formatShopApiError(e));
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

  async function savePayment() {
    setSaving(true);
    setError(null);
    try {
      await apiFetch("/orders/cart/payment", {
        method: "PATCH",
        body: JSON.stringify({ paymentMethod: method }),
      });
      await load();
    } catch (e) {
      setError(formatShopApiError(e));
    } finally {
      setSaving(false);
    }
  }

  async function confirmOrder() {
    setSaving(true);
    setError(null);
    try {
      await apiFetch("/orders/cart/payment", {
        method: "PATCH",
        body: JSON.stringify({ paymentMethod: method }),
      });
      await apiFetch("/orders/cart/confirm", { method: "POST" });
      router.push("/pedido/confirmado");
    } catch (e) {
      setError(formatShopApiError(e));
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || (isLoggedIn && loading)) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-zinc-500">Cargando…</div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-display text-4xl uppercase text-white">Checkout</h1>
        <p className="mt-4 text-zinc-400">
          Tenés que iniciar sesión para finalizar la compra.
        </p>
        <a href={LOGIN_ENTRY_HREF} className="btn-brand mt-8 inline-flex">
          Entrar
        </a>
        <Link href="/carrito" className="mt-6 block text-sm text-zinc-500 hover:text-brand-yellow">
          Volver al carrito
        </Link>
      </div>
    );
  }

  if (!order || order.items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-zinc-400">No hay productos para pagar.</p>
        <Link href="/tienda" className="mt-4 inline-block text-brand-yellow hover:underline">
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
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="font-display text-5xl uppercase tracking-wide text-white">Checkout</h1>
      {displayName ? (
        <p className="mt-1 text-sm text-zinc-500">Pedido de {displayName}</p>
      ) : null}
      <p className="mt-2 text-zinc-400">
        Elegí la forma de pago y confirmá el pedido. El equipo de Big Boys lo
        revisará según el flujo del administrador.
      </p>

      <div className="panel-brand mt-8 p-6">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Total estimado
        </p>
        <p className="font-display text-4xl text-brand-yellow">${subtotal.toFixed(2)}</p>
      </div>

      <div className="mt-8">
        <label className="block text-sm font-medium text-zinc-300">
          Forma de pago
        </label>
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="select-brand mt-2"
        >
          {METHODS.map((m) => (
            <option key={m.value} value={m.value} className="bg-brand-steel">
              {m.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={saving}
          onClick={() => void savePayment()}
          className="mt-3 text-sm font-medium text-brand-yellow hover:underline"
        >
          Guardar forma de pago
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-brand-red">{error}</p>}

      <button
        type="button"
        disabled={saving}
        onClick={() => void confirmOrder()}
        className="btn-brand mt-8 w-full disabled:opacity-50"
      >
        {saving ? "Procesando…" : "Confirmar pedido"}
      </button>

      <Link
        href="/carrito"
        className="mt-4 block text-center text-sm text-zinc-500 hover:text-brand-yellow"
      >
        Volver al carrito
      </Link>
    </div>
  );
}
