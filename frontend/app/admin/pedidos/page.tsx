"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";

type AdminOrderListItem = {
  id: string;
  status: string;
  paymentMethod: string | null;
  createdAt: string;
  user: { id: string; email: string };
  items: { quantity: number; product: { title: string } }[];
};

export default function AdminPedidosPage() {
  const [orders, setOrders] = useState<AdminOrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiFetch<AdminOrderListItem[]>("/admin/orders");
        if (!cancelled) setOrders(data);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "No se pudieron cargar los pedidos");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <p className="text-zinc-600">Cargando pedidos…</p>;
  }

  if (error) {
    return <p className="text-red-600">{error}</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">Pedidos</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Estado inicial tras compra: <strong>PENDING</strong>. Podés actualizar desde
        el detalle.
      </p>
      <div className="mt-6 overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600">
            <tr>
              <th className="px-4 py-3 font-medium">Fecha</th>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Ítems</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-zinc-100 last:border-0">
                <td className="px-4 py-3 whitespace-nowrap text-zinc-700">
                  {new Date(o.createdAt).toLocaleString("es")}
                </td>
                <td className="px-4 py-3 text-zinc-800">{o.user.email}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-800">
                    {o.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {o.items.reduce((s, i) => s + i.quantity, 0)}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/pedidos/${o.id}`}
                    className="font-medium text-amber-700 hover:underline"
                  >
                    Ver / cambiar estado
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {orders.length === 0 && (
        <p className="mt-8 text-zinc-500">No hay pedidos todavía.</p>
      )}
    </div>
  );
}
