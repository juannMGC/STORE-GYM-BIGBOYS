"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ApiError, apiFetch } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

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

/** Valores en inglés para la API; PAID = “confirmado / pagado” (no existe CONFIRMED en el backend). */
const ORDER_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "PENDING", label: "Pendiente" },
  { value: "PAID", label: "Confirmado" },
  { value: "SHIPPED", label: "Enviado" },
  { value: "DELIVERED", label: "Entregado" },
  { value: "CANCELLED", label: "Cancelado" },
];

function statusLabel(status: string): string {
  const found = ORDER_STATUS_OPTIONS.find((o) => o.value === status);
  return found?.label ?? status;
}

export default function AdminPedidoDetailPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const params = useParams();
  const id = params.id as string;
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [statusSuccess, setStatusSuccess] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await apiFetch<OrderDetail>(`/admin/orders/${id}`);
      setOrder(data);
      setSelectedStatus(data.status);
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
    if (!order || !selectedStatus || selectedStatus === order.status) return;
    setSaving(true);
    setStatusSuccess(null);
    setStatusError(null);
    try {
      await apiFetch(`/orders/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: selectedStatus }),
      });
      await load();
      setStatusSuccess("Estado actualizado");
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "No se pudo actualizar";
      setStatusError(msg);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-zinc-500">Cargando…</p>;
  }

  if (error && !order) {
    return <p className="text-brand-red">{error}</p>;
  }

  if (!order) {
    return null;
  }

  const total = order.items.reduce(
    (s, i) => s + i.priceSnapshot * i.quantity,
    0,
  );

  const selectOptions = ORDER_STATUS_OPTIONS.some((o) => o.value === order.status)
    ? ORDER_STATUS_OPTIONS
    : [
        { value: order.status, label: statusLabel(order.status) },
        ...ORDER_STATUS_OPTIONS,
      ];

  const canSubmit =
    selectedStatus !== order.status && Boolean(selectedStatus) && !saving;

  return (
    <div>
      <Link
        href="/admin/pedidos"
        className="text-sm font-medium text-brand-yellow hover:underline"
      >
        ← Volver al listado
      </Link>
      <h1 className="mt-4 font-display text-4xl uppercase tracking-wide text-white">Pedido</h1>
      <p className="mt-1 font-mono text-sm text-zinc-500">{order.id}</p>

      <div className="panel-brand mt-6 grid gap-4 p-6 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase text-zinc-500">Cliente</p>
          <p className="text-zinc-100">{order.user.email}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-zinc-500">Estado</p>
          <p className="font-display text-2xl text-brand-yellow">
            {statusLabel(order.status)}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-zinc-500">Pago</p>
          <p className="text-zinc-300">{order.paymentMethod ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-zinc-500">Total</p>
          <p className="font-display text-2xl text-brand-yellow">${total.toFixed(2)}</p>
        </div>
      </div>

      <h2 className="mt-8 font-display text-xl uppercase text-white">Líneas</h2>
      <ul className="panel-brand mt-2 divide-y divide-brand-border">
        {order.items.map((line) => (
          <li key={line.id} className="flex justify-between px-4 py-3 text-sm">
            <span className="text-zinc-300">
              {line.product.title}
              {line.size ? ` · ${line.size.name}` : ""} × {line.quantity}
            </span>
            <span className="text-brand-yellow">
              ${(line.priceSnapshot * line.quantity).toFixed(2)}
            </span>
          </li>
        ))}
      </ul>

      {isAdmin ? (
        <div className="panel-brand mt-8 border-brand-yellow/40 p-6">
          <p className="text-sm font-medium text-zinc-300">Cambiar estado del pedido</p>
          <p className="mt-1 text-xs text-zinc-500">
            Solo se permiten las transiciones definidas por la API (p. ej. Pendiente → Confirmado o
            Cancelado).
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label htmlFor="order-status" className="text-xs text-zinc-500">
                Estado
              </label>
              <select
                id="order-status"
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setStatusSuccess(null);
                  setStatusError(null);
                }}
                className="select-brand mt-1 w-full max-w-md"
              >
                {selectOptions.map((o) => (
                  <option key={o.value} value={o.value} className="bg-brand-steel">
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              disabled={!canSubmit}
              onClick={() => void submitStatus()}
              className="btn-brand disabled:opacity-50"
            >
              {saving ? "Guardando…" : "Actualizar estado"}
            </button>
          </div>
          {statusSuccess ? (
            <p className="mt-3 text-sm text-green-400">{statusSuccess}</p>
          ) : null}
          {statusError ? (
            <p className="mt-3 text-sm text-brand-red">{statusError}</p>
          ) : null}
        </div>
      ) : null}

      {error ? <p className="mt-4 text-sm text-brand-red">{error}</p> : null}
    </div>
  );
}
