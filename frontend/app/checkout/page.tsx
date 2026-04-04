"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import type { CartOrder } from "@/lib/types";

const METHODS = [
  { value: "CASH", label: "Efectivo" },
  { value: "BANK_TRANSFER", label: "Transferencia bancaria" },
  { value: "CARD", label: "Tarjeta" },
] as const;

export default function CheckoutPage() {
  const router = useRouter();
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
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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
      setError(e instanceof Error ? e.message : "Error");
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
      setError(e instanceof Error ? e.message : "Error al confirmar");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-zinc-600">Cargando…</div>
    );
  }

  if (!order || order.items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-zinc-600">No hay productos para pagar.</p>
        <Link href="/tienda" className="mt-4 inline-block text-amber-700 underline">
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
      <h1 className="text-3xl font-bold text-zinc-900">Checkout</h1>
      <p className="mt-2 text-zinc-600">
        Elegí la forma de pago y confirmá el pedido. El equipo de Big Boys lo
        revisará según el flujo del administrador.
      </p>

      <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-zinc-500">Total estimado</p>
        <p className="text-2xl font-bold text-amber-600">${subtotal.toFixed(2)}</p>
      </div>

      <div className="mt-8">
        <label className="block text-sm font-medium text-zinc-800">
          Forma de pago
        </label>
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2"
        >
          {METHODS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={saving}
          onClick={() => void savePayment()}
          className="mt-3 text-sm font-medium text-amber-800 hover:underline"
        >
          Guardar forma de pago
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <button
        type="button"
        disabled={saving}
        onClick={() => void confirmOrder()}
        className="mt-8 w-full rounded-lg bg-amber-500 py-3 font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
      >
        {saving ? "Procesando…" : "Confirmar pedido"}
      </button>

      <Link
        href="/carrito"
        className="mt-4 block text-center text-sm text-zinc-600 hover:text-zinc-900"
      >
        Volver al carrito
      </Link>
    </div>
  );
}
