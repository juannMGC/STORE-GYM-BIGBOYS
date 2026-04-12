"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { apiFetch, formatShopApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { auth0LoginHref } from "@/lib/auth-routes";

type InvoiceItem = {
  id: string;
  quantity: number;
  unitPrice: number;
  product: { name: string; imageUrl: string | null; slug: string | null };
  size: { name: string } | null;
};

type InvoiceDetail = {
  id: string;
  status: string;
  createdAt: string;
  paymentMethod: string | null;
  user: { name: string | null; email: string };
  items: InvoiceItem[];
  total: number;
};

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

function statusLabel(status: string): string {
  const m: Record<string, string> = {
    DRAFT: "Borrador",
    PENDING: "Pendiente",
    PAID: "Confirmado",
    SHIPPED: "Enviado",
    DELIVERED: "Entregado",
    CANCELLED: "Cancelado",
  };
  return m[status] ?? status;
}

function paymentLabel(pm: string | null): string {
  if (!pm) return "—";
  const map: Record<string, string> = {
    CASH: "Efectivo",
    BANK_TRANSFER: "Transferencia",
    CARD: "Tarjeta",
  };
  return map[pm] ?? pm;
}

function formatDateLong(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const PRINT_CSS = `
@media print {
  header, footer { display: none !important; }
  body { background: white !important; }
  .no-print { display: none !important; }
  .factura-print-area {
    background: white !important;
    color: #111 !important;
    border: 1px solid #ccc !important;
    box-shadow: none !important;
  }
  .factura-print-area .factura-screen-accent,
  .factura-print-area .factura-screen-yellow {
    color: #111 !important;
  }
  .factura-print-area .factura-screen-muted {
    color: #444 !important;
  }
  .factura-print-area .factura-row-line {
    border-color: #ddd !important;
  }
}
`;

export default function FacturaDetalladaPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const [data, setData] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const d = await apiFetch<InvoiceDetail>(`/orders/${orderId}/detail`);
      setData(d);
    } catch (e) {
      setError(formatShopApiError(e, { sessionActive: true }));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) {
      setLoading(false);
      setError("Iniciá sesión para ver la factura.");
      return;
    }
    void load();
  }, [authLoading, isLoggedIn, load]);

  function handlePrint() {
    window.print();
  }

  const returnTo = `/checkout/factura-detallada/${orderId}`;
  const loginHref = auth0LoginHref(returnTo, "login");

  if (authLoading || (isLoggedIn && loading)) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="panel-brand animate-pulse space-y-4 p-8">
          <div className="h-8 w-48 rounded bg-brand-steel/40" />
          <div className="h-64 rounded bg-brand-steel/25" />
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <h1 className="font-display text-3xl uppercase text-white">Factura</h1>
        <p className="mt-4 text-zinc-400">Necesitás una sesión activa para ver esta factura.</p>
        <a href={loginHref} className="btn-brand mt-8 inline-flex">
          Entrar
        </a>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="font-display text-3xl uppercase text-white">Factura</h1>
        <p className="mt-4 text-brand-red">{error ?? "No se pudo cargar."}</p>
        <Link href="/mis-pedidos" className="btn-brand-outline no-print mt-8 inline-flex">
          Mis pedidos
        </Link>
      </div>
    );
  }

  const subtotal = data.total;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />

      <div className="no-print mb-6 flex flex-wrap items-center gap-3">
        <Link href="/mis-pedidos" className="text-sm font-medium text-brand-yellow hover:underline">
          ← Mis pedidos
        </Link>
      </div>

      <div className="no-print mb-4 flex flex-wrap gap-3">
        <button type="button" onClick={handlePrint} className="btn-brand">
          📄 Descargar PDF
        </button>
      </div>

      <div className="factura-print-area panel-brand border-2 border-brand-border p-6 sm:p-8">
        <div className="flex flex-col gap-2 border-b border-brand-border pb-4 sm:flex-row sm:items-start sm:justify-between factura-row-line">
          <div>
            <p className="font-display text-2xl uppercase tracking-wide text-brand-yellow factura-screen-yellow">
              BIG BOYS GYM
            </p>
            <p className="factura-screen-muted text-sm text-zinc-500">Tienda oficial · Manizales</p>
          </div>
          <p className="font-display text-xl uppercase text-brand-red factura-screen-accent">Factura</p>
        </div>

        <div className="mt-6 space-y-2 text-sm text-zinc-200">
          <p>
            <span className="text-brand-yellow factura-screen-yellow">Pedido:</span>{" "}
            <span className="font-mono">#{shortOrderId(data.id)}</span>
          </p>
          <p>
            <span className="text-brand-yellow factura-screen-yellow">Fecha:</span>{" "}
            {formatDateLong(data.createdAt)}
          </p>
          <p>
            <span className="text-brand-yellow factura-screen-yellow">Estado:</span>{" "}
            {statusLabel(data.status)}
          </p>
          <p>
            <span className="text-brand-yellow factura-screen-yellow">Cliente:</span>{" "}
            {data.user.name ?? "—"}
          </p>
          <p>
            <span className="text-brand-yellow factura-screen-yellow">Email:</span> {data.user.email}
          </p>
        </div>

        <h2 className="mt-8 font-display text-lg uppercase tracking-wide text-brand-yellow factura-screen-yellow">
          Productos
        </h2>
        <ul className="mt-4 space-y-4">
          {data.items.map((line) => {
            const img = line.product.imageUrl?.trim();
            const sub = line.unitPrice * line.quantity;
            const initial = (line.product.name.charAt(0) || "?").toUpperCase();
            return (
              <li
                key={line.id}
                className="factura-row-line flex gap-4 border-b border-brand-border pb-4 last:border-0"
              >
                <div className="shrink-0">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={img}
                      alt=""
                      className="h-16 w-16 rounded-sm border border-brand-border object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-sm border border-brand-border bg-brand-black font-display text-xl text-brand-red">
                      {initial}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-brand-yellow factura-screen-yellow">
                    {line.product.name} × {line.quantity}
                  </p>
                  <p className="factura-screen-muted text-xs text-zinc-500">
                    Talla: {line.size?.name ?? "—"}
                  </p>
                  <p className="mt-1 text-sm text-zinc-300">
                    {line.quantity > 1 ? (
                      <>
                        {formatCop(line.unitPrice)} c/u ={" "}
                        <span className="font-display text-brand-yellow factura-screen-yellow">
                          {formatCop(sub)}
                        </span>
                      </>
                    ) : (
                      <span className="font-display text-brand-yellow factura-screen-yellow">
                        {formatCop(sub)}
                      </span>
                    )}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-8 space-y-2 border-t border-brand-border pt-4 text-sm factura-row-line">
          <div className="flex justify-between text-zinc-300">
            <span>Subtotal</span>
            <span className="font-mono">{formatCop(subtotal)}</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Envío</span>
            <span>Por coordinar</span>
          </div>
          <div className="flex justify-between font-display text-xl text-brand-yellow factura-screen-yellow">
            <span>Total</span>
            <span>{formatCop(data.total)}</span>
          </div>
        </div>

        <p className="mt-6 text-sm text-zinc-400">
          <span className="text-brand-yellow factura-screen-yellow">Método de pago:</span>{" "}
          {paymentLabel(data.paymentMethod)}
        </p>
      </div>
    </div>
  );
}
