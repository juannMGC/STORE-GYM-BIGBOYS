"use client";

import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { Suspense, useCallback, useEffect, useState } from "react";

type OrderItemRow = {
  id: string;
  quantity: number;
  priceSnapshot: number;
  product: { id: string; title: string; images: { url: string }[] };
  size: { id: string; name: string } | null;
};

type AdminOrder = {
  id: string;
  status: string;
  paymentMethod: string | null;
  createdAt: string;
  user: { id: string; email: string; name: string | null };
  items: OrderItemRow[];
};

const STATUS_FILTER = [
  { value: "", label: "Todos" },
  { value: "DRAFT", label: "Borrador" },
  { value: "PENDING", label: "Pendiente" },
  { value: "PAID", label: "Confirmado" },
  { value: "SHIPPED", label: "Enviado" },
  { value: "DELIVERED", label: "Entregado" },
  { value: "CANCELLED", label: "Cancelado" },
] as const;

function shortOrderId(id: string): string {
  return id.replace(/-/g, "").slice(0, 8);
}

function formatCop(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

function orderTotal(o: Pick<AdminOrder, "items">): number {
  return o.items.reduce((s, i) => s + i.priceSnapshot * i.quantity, 0);
}

function statusBadge(status: string): { label: string; color: string } {
  switch (status) {
    case "DRAFT":
      return { label: "Borrador", color: "#a1a1aa" };
    case "PENDING":
      return { label: "Pendiente", color: "#f7e047" };
    case "PAID":
      return { label: "Confirmado", color: "#60a5fa" };
    case "SHIPPED":
      return { label: "Enviado", color: "#fb923c" };
    case "DELIVERED":
      return { label: "Entregado", color: "#22c55e" };
    case "CANCELLED":
      return { label: "Cancelado", color: "#d91920" };
    default:
      return { label: status, color: "#a1a1aa" };
  }
}

function PedidosListSkeleton() {
  return (
    <div className="panel-brand animate-pulse space-y-3 p-6">
      <div className="h-10 w-full max-w-xs rounded bg-brand-steel/30" />
      <div className="h-48 rounded bg-brand-steel/20" />
    </div>
  );
}

function AdminPedidosInner() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");

  const loadList = useCallback(async () => {
    setListError(null);
    setListLoading(true);
    try {
      const q = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : "";
      const data = await apiFetch<AdminOrder[]>(`/orders${q}`);
      setOrders(data);
    } catch (e) {
      setListError(e instanceof Error ? e.message : "No se pudieron cargar los pedidos");
    } finally {
      setListLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  return (
    <div>
      <h1 className="font-display text-4xl uppercase tracking-wide text-white">Pedidos</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Gestioná cada pedido en su página de detalle.
      </p>

      <div className="mt-6">
        <label htmlFor="filter-status" className="text-xs font-medium text-zinc-500">
          Filtrar por estado
        </label>
        <select
          id="filter-status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="select-brand mt-1 w-full max-w-sm"
        >
          {STATUS_FILTER.map((o) => (
            <option key={o.value || "all"} value={o.value} className="bg-brand-steel">
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {listError ? <p className="mt-4 text-brand-red">{listError}</p> : null}

      {listLoading ? (
        <div className="mt-6">
          <PedidosListSkeleton />
        </div>
      ) : (
        <div className="admin-table-scroll panel-brand mt-6 overflow-x-auto">
          <table className="min-w-[600px] w-full text-left text-sm">
            <thead className="border-b-2 border-brand-border bg-brand-black text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const { label, color } = statusBadge(o.status);
                const total = orderTotal(o);
                return (
                  <tr
                    key={o.id}
                    className="border-b border-brand-border last:border-0 hover:bg-brand-black/40"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-zinc-300">
                      {shortOrderId(o.id)}
                    </td>
                    <td className="px-4 py-3 text-zinc-200">
                      <span className="block max-w-[14rem] truncate" title={o.user.email}>
                        {o.user.email}
                      </span>
                      {o.user.name ? (
                        <span className="block truncate text-xs text-zinc-500">{o.user.name}</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-block rounded border-2 bg-brand-black/60 px-2 py-0.5 text-xs font-medium uppercase"
                        style={{ borderColor: color, color }}
                      >
                        {label}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-display text-brand-yellow">
                      {formatCop(total)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-400">
                      {new Date(o.createdAt).toLocaleString("es-CO")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/admin/pedidos/${o.id}`}
                          className="btn-brand inline-flex text-xs py-1.5 px-3"
                        >
                          Ver detalle →
                        </Link>
                        <Link
                          href={`/checkout/factura-detallada/${o.id}`}
                          className="inline-flex items-center rounded-sm border border-brand-yellow/50 px-3 py-1.5 text-xs font-medium text-brand-yellow hover:bg-brand-yellow/10"
                        >
                          Ver factura
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!listLoading && orders.length === 0 && !listError ? (
        <p className="mt-8 text-zinc-500">No hay pedidos con este filtro.</p>
      ) : null}
    </div>
  );
}

export default function AdminPedidosPage() {
  return (
    <Suspense fallback={<PedidosListSkeleton />}>
      <AdminPedidosInner />
    </Suspense>
  );
}
