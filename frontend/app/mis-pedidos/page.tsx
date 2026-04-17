"use client";

import Link from "next/link";
import { BackButton } from "@/components/back-button";
import { useEffect, useState } from "react";
import { apiFetch, formatShopApiError } from "@/lib/api-client";

type MyOrderItem = {
  id: string;
  quantity: number;
  priceSnapshot: number;
  product: {
    id: string;
    title: string;
    slug: string | null;
    images: { url: string }[];
  };
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

function formatCop(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

function productImageUrl(item: MyOrderItem): string | undefined {
  const first = item.product?.images?.[0];
  return first?.url?.trim() || undefined;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  PAID: {
    label: "Pagado ✓",
    color: "#22c55e",
    bg: "rgba(34,197,94,0.1)",
  },
  PENDING: {
    label: "Pagado ✓",
    color: "#22c55e",
    bg: "rgba(34,197,94,0.1)",
  },
  SHIPPED: {
    label: "En camino 🚚",
    color: "#f97316",
    bg: "rgba(249,115,22,0.1)",
  },
  DELIVERED: {
    label: "Entregado 📦",
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.1)",
  },
  CANCELLED: {
    label: "Cancelado",
    color: "#d91920",
    bg: "rgba(217,25,32,0.1)",
  },
};

function MisPedidosSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-3 py-8 sm:px-4 sm:py-10">
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
      <div className="mx-auto max-w-3xl px-3 py-8 sm:px-4 sm:py-10">
        <div style={{ padding: "16px 0 8px", marginBottom: "8px" }}>
          <BackButton href="/" label="← Inicio" />
        </div>
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
    <div className="mx-auto max-w-3xl px-3 py-6 sm:px-4 sm:py-10">
      <div style={{ padding: "16px 0 8px", marginBottom: "8px" }}>
        <BackButton href="/" label="← Inicio" />
      </div>
      <h1 className="font-display text-3xl uppercase tracking-wide text-white sm:text-4xl">
        Mis pedidos
      </h1>
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
            const key = o.status === "PENDING" ? "PAID" : o.status;
            const config = STATUS_CONFIG[key];
            const total = orderTotal(o);
            return (
              <li key={o.id} className="panel-brand p-4 sm:p-6">
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
                      style={{
                        display: "inline-block",
                        marginTop: "4px",
                        padding: "4px 12px",
                        background: config?.bg ?? "transparent",
                        color: config?.color ?? "#e4e4e7",
                        border: `1px solid ${config?.color ?? "#2a2a2a"}`,
                        fontSize: "12px",
                        fontFamily: "var(--font-display)",
                        letterSpacing: "1px",
                        borderRadius: "2px",
                      }}
                    >
                      {config?.label ?? o.status}
                    </span>
                    <p className="mt-2 font-display text-2xl text-brand-yellow">
                      {formatCop(total)}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <Link
                    href={`/checkout/factura-detallada/${o.id}`}
                    className="btn-brand-outline inline-flex px-4 py-2 text-xs"
                  >
                    Ver factura
                  </Link>
                </div>
                <div className="mt-4 border-t border-brand-border pt-4">
                  {o.items.map((line) => {
                    const imgUrl = productImageUrl(line);
                    const title = line.product?.title ?? "";
                    const initial = title.charAt(0).toUpperCase() || "?";
                    return (
                      <div
                        key={line.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "8px 0",
                          borderBottom: "1px solid #2a2a2a",
                        }}
                      >
                        {imgUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={imgUrl}
                            alt={title}
                            style={{
                              width: "64px",
                              height: "64px",
                              objectFit: "cover",
                              borderRadius: "2px",
                              flexShrink: 0,
                              border: "1px solid #2a2a2a",
                            }}
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "64px",
                              height: "64px",
                              background: "#1a1a1a",
                              border: "1px solid #2a2a2a",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#d91920",
                              fontSize: "1.5rem",
                              flexShrink: 0,
                              fontFamily: "var(--font-display)",
                            }}
                          >
                            {initial}
                          </div>
                        )}
                        <div style={{ flex: 1 }}>
                          <p
                            className="break-words"
                            style={{
                              color: "#f7e047",
                              fontWeight: 600,
                              fontSize: "0.9rem",
                            }}
                          >
                            {title}
                            {line.size ? ` · ${line.size.name}` : ""}
                          </p>
                          <p style={{ color: "#71717a", fontSize: "0.8rem" }}>
                            Cantidad: {line.quantity}
                          </p>
                          <p style={{ color: "#d4d4d8", fontSize: "0.85rem" }}>
                            {formatCop(line.priceSnapshot)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
