"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch, formatShopApiError } from "@/lib/api-client";

type MyOrderItem = {
  id: string;
  quantity: number;
  priceSnapshot: number;
  product: { id: string; title: string };
  size: { name: string } | null;
};

type MyOrder = {
  id: string;
  status: string;
  createdAt: string;
  items: MyOrderItem[];
};

function orderTotal(o: MyOrder): number {
  return o.items.reduce((s, i) => s + i.priceSnapshot * i.quantity, 0);
}

function shortOrderId(id: string): string {
  return id.replace(/-/g, "").slice(0, 8);
}

/** PAID en API = “confirmado” (pago recibido). */
function statusDisplay(status: string): { label: string; color: string } {
  switch (status) {
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

function MisPedidosSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="panel-brand animate-pulse space-y-4 p-6">
        <div className="h-8 w-56 rounded bg-brand-steel/40" />
        <div className="h-40 rounded bg-brand-steel/25" />
        <div className="h-40 rounded bg-brand-steel/25" />
      </div>
    </div>
  );
}

export default function MisPedidosPage() {
  const [orders, setOrders] = useState<MyOrder[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<MyOrder[]>("/orders/my-orders");
        if (!cancelled) setOrders(data);
      } catch (e) {
        if (!cancelled) setError(formatShopApiError(e, { sessionActive: true }));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <MisPedidosSkeleton />;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="font-display text-4xl uppercase tracking-wide text-white">Mis pedidos</h1>
        <p className="mt-4 text-brand-red">{error}</p>
        <Link href="/tienda" className="btn-brand mt-8 inline-flex">
          Ir a la tienda
        </Link>
      </div>
    );
  }

  const list = orders ?? [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-4xl uppercase tracking-wide text-white">Mis pedidos</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Historial de compras (el carrito en borrador no se muestra acá).
      </p>

      {list.length === 0 ? (
        <div className="panel-brand mt-8 p-10 text-center">
          <p className="text-zinc-400">No tenés pedidos aún.</p>
          <Link href="/tienda" className="btn-brand mt-6 inline-flex">
            Ir a la tienda
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-6">
          {list.map((o) => {
            const { label, color } = statusDisplay(o.status);
            const total = orderTotal(o);
            return (
              <li key={o.id} className="panel-brand p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      Pedido
                    </p>
                    <p className="font-mono text-sm text-zinc-200">{shortOrderId(o.id)}</p>
                    <p className="mt-2 text-xs text-zinc-500">
                      {new Date(o.createdAt).toLocaleString("es")}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      Estado
                    </p>
                    <span
                      className="mt-1 inline-block rounded border-2 bg-brand-black/60 px-3 py-1.5 font-display text-sm uppercase tracking-wide"
                      style={{ borderColor: color, color }}
                    >
                      {label}
                    </span>
                    <p className="mt-2 font-display text-2xl text-brand-yellow">
                      ${total.toFixed(2)}
                    </p>
                  </div>
                </div>
                <ul className="mt-4 space-y-1 border-t border-brand-border pt-4 text-sm text-zinc-300">
                  {o.items.map((line) => (
                    <li key={line.id}>
                      {line.product.title}
                      {line.size ? ` · ${line.size.name}` : ""} × {line.quantity}
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
