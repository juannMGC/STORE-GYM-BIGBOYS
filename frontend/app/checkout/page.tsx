"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiFetch, formatShopApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { auth0LoginHref } from "@/lib/auth-routes";
import type { CartOrder } from "@/lib/types";

function CheckoutSkeleton() {
  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <div className="panel-brand animate-pulse space-y-6 p-8">
        <div className="h-10 w-48 rounded bg-brand-steel/40" />
        <div className="h-32 rounded bg-brand-steel/25" />
      </div>
    </div>
  );
}

const METHODS = [
  { value: "CASH", label: "Efectivo" },
  { value: "BANK_TRANSFER", label: "Transferencia bancaria" },
  { value: "CARD", label: "Tarjeta" },
] as const;

type WompiSigResponse = {
  signature: string;
  publicKey: string;
  reference: string;
  amountInCents: number;
  currency: "COP";
};

const WOMPI_SCRIPT_ID = "wompi-widget-js";

export default function CheckoutPage() {
  const { isLoggedIn, isLoading, displayName } = useAuth();
  const [order, setOrder] = useState<CartOrder | null>(null);
  const [cartLoading, setCartLoading] = useState(false);
  const [method, setMethod] = useState<string>("BANK_TRANSFER");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wompiReady, setWompiReady] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    setCartLoading(true);
    try {
      const data = await apiFetch<CartOrder | null>("/orders/cart");
      setOrder(data);
      if (data?.paymentMethod) setMethod(data.paymentMethod);
    } catch (e) {
      setError(formatShopApiError(e, { sessionActive: true }));
    } finally {
      setCartLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!isLoggedIn) {
      setOrder(null);
      return;
    }
    void load();
  }, [isLoading, isLoggedIn, load]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const existing = document.getElementById(WOMPI_SCRIPT_ID);
    if (existing) {
      setWompiReady(!!window.WidgetCheckout);
      return;
    }
    const s = document.createElement("script");
    s.id = WOMPI_SCRIPT_ID;
    s.src = "https://checkout.wompi.co/widget.js";
    s.async = true;
    s.onload = () => setWompiReady(true);
    s.onerror = () => setError("No se pudo cargar Wompi. Revisá tu conexión.");
    document.body.appendChild(s);
  }, []);

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
      setError(formatShopApiError(e, { sessionActive: true }));
    } finally {
      setSaving(false);
    }
  }

  async function payWithWompi() {
    if (!order?.items.length) return;
    setSaving(true);
    setError(null);
    try {
      await apiFetch("/orders/cart/payment", {
        method: "PATCH",
        body: JSON.stringify({ paymentMethod: method }),
      });
      const subtotal = order.items.reduce(
        (s, i) => s + i.priceSnapshot * i.quantity,
        0,
      );
      const amountInCents = Math.round(subtotal * 100);
      if (amountInCents < 1) {
        setError("El total debe ser mayor a 0.");
        return;
      }
      const res = await apiFetch<WompiSigResponse>(`/orders/${order.id}/wompi-signature`, {
        method: "POST",
        body: JSON.stringify({
          currency: "COP",
          amountInCents,
          reference: order.id,
        }),
      });
      await load();
      if (!window.WidgetCheckout) {
        setError("El script de Wompi aún no cargó. Esperá unos segundos e intentá de nuevo.");
        return;
      }
      const checkout = new window.WidgetCheckout({
        currency: res.currency,
        amountInCents: res.amountInCents,
        reference: res.reference,
        publicKey: res.publicKey,
        signature: { integrity: res.signature },
        redirectUrl: `${window.location.origin}/pedido/confirmado?ref=${encodeURIComponent(res.reference)}`,
      });
      checkout.open(() => {});
    } catch (e) {
      setError(formatShopApiError(e, { sessionActive: true }));
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return <CheckoutSkeleton />;
  }

  if (!isLoggedIn) {
    const loginHref = auth0LoginHref("/checkout", "login");
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-display text-3xl uppercase text-white">Checkout</h1>
        <p className="mt-4 text-zinc-400">
          Iniciá sesión para completar el pago.
        </p>
        <a href={loginHref} className="btn-brand mt-8 inline-flex">
          Iniciar sesión
        </a>
      </div>
    );
  }

  if (cartLoading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-zinc-500">Cargando…</div>
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
        Elegí la forma de pago y pagá con Wompi (sandbox). El pedido queda en borrador hasta
        que el pago sea aprobado.
      </p>

      <div className="panel-brand mt-8 p-6">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Total estimado (COP)
        </p>
        <p className="font-display text-4xl text-brand-yellow">${subtotal.toFixed(2)}</p>
      </div>

      <div className="mt-8">
        <label className="block text-sm font-medium text-zinc-300">
          Forma de pago (referencia interna)
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
        disabled={saving || !wompiReady}
        onClick={() => void payWithWompi()}
        className="btn-brand mt-8 w-full disabled:opacity-50"
      >
        {saving ? "Procesando…" : !wompiReady ? "Cargando Wompi…" : "Pagar con Wompi"}
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
