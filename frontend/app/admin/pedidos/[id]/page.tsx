"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";

type OrderDetail = {
  id: string;
  status: string;
  paymentMethod: string | null;
  createdAt: string;
  updatedAt: string;
  user: { id: string; email: string };
  items: {
    id: string;
    quantity: number;
    priceSnapshot: number;
    product: { id: string; title: string };
    size: { name: string } | null;
  }[];
};

const NEXT_STATES: Record<string, { value: string; label: string }[]> = {
  PENDING: [
    { value: "PAID", label: "Marcar pagado" },
    { value: "CANCELLED", label: "Cancelar pedido" },
  ],
  PAID: [
    { value: "SHIPPED", label: "Marcar enviado" },
    { value: "CANCELLED", label: "Cancelar / anular" },
  ],
};

export default function AdminPedidoDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextStatus, setNextStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await apiFetch<OrderDetail>(`/admin/orders/${id}`);
      setOrder(data);
      const options = NEXT_STATES[data.status] ?? [];
      setNextStatus(options[0]?.value ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submitStatus() {
    if (!nextStatus) return;
    setSaving(true);
    setError(null);
    try {
      await apiFetch(`/admin/orders/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo actualizar");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-zinc-600">Cargando…</p>;
  }

  if (error && !order) {
    return <p className="text-red-600">{error}</p>;
  }

  if (!order) {
    return null;
  }

  const options = NEXT_STATES[order.status] ?? [];
  const total = order.items.reduce(
    (s, i) => s + i.priceSnapshot * i.quantity,
    0,
  );

  return (
    <div>
      <Link
        href="/admin/pedidos"
        className="text-sm font-medium text-amber-700 hover:underline"
      >
        ← Volver al listado
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-zinc-900">Pedido</h1>
      <p className="mt-1 font-mono text-sm text-zinc-500">{order.id}</p>

      <div className="mt-6 grid gap-4 rounded-xl border border-zinc-200 bg-white p-6 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase text-zinc-500">Cliente</p>
          <p className="text-zinc-900">{order.user.email}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-zinc-500">Estado</p>
          <p className="text-lg font-semibold text-zinc-900">{order.status}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-zinc-500">Pago</p>
          <p className="text-zinc-800">{order.paymentMethod ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-zinc-500">Total</p>
          <p className="text-lg font-bold text-amber-600">${total.toFixed(2)}</p>
        </div>
      </div>

      <h2 className="mt-8 font-semibold text-zinc-900">Líneas</h2>
      <ul className="mt-2 divide-y divide-zinc-100 rounded-lg border border-zinc-200 bg-white">
        {order.items.map((line) => (
          <li key={line.id} className="flex justify-between px-4 py-3 text-sm">
            <span>
              {line.product.title}
              {line.size ? ` · ${line.size.name}` : ""} × {line.quantity}
            </span>
            <span className="text-zinc-700">
              ${(line.priceSnapshot * line.quantity).toFixed(2)}
            </span>
          </li>
        ))}
      </ul>

      {options.length > 0 && (
        <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-6">
          <p className="text-sm font-medium text-amber-950">
            Cambiar estado (solo transiciones permitidas por la API)
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="text-xs text-amber-900">Nuevo estado</label>
              <select
                value={nextStatus}
                onChange={(e) => setNextStatus(e.target.value)}
                className="mt-1 w-full rounded-lg border border-amber-300 bg-white px-3 py-2"
              >
                {options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label} ({o.value})
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              disabled={saving || !nextStatus}
              onClick={() => void submitStatus()}
              className="rounded-lg bg-amber-600 px-6 py-2 font-semibold text-white hover:bg-amber-500 disabled:opacity-50"
            >
              {saving ? "Guardando…" : "Aplicar"}
            </button>
          </div>
        </div>
      )}

      {options.length === 0 && (
        <p className="mt-8 text-sm text-zinc-500">
          Este pedido está en estado final (enviado o cancelado). No hay transiciones
          admin disponibles.
        </p>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </div>
  );
}
