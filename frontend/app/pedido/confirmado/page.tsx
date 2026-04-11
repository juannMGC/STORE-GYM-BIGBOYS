"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { apiFetch, formatShopApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import type { CartOrder } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Borrador",
  PENDING: "Pendiente",
  PAID: "Pagado",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

function PedidoConfirmadoInner() {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");
  const { isLoggedIn, loading: sessionLoading } = useAuth();
  const [order, setOrder] = useState<CartOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionLoading) return;
    if (!isLoggedIn) {
      setLoading(false);
      setError("Iniciá sesión para ver el estado de tu pedido.");
      return;
    }
    if (!ref) {
      setLoading(false);
      setError("No se indicó el pedido.");
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    apiFetch<CartOrder>(`/orders/${ref}`)
      .then((data) => {
        if (!cancelled) setOrder(data);
      })
      .catch((e) => {
        if (!cancelled) setError(formatShopApiError(e, { sessionActive: true }));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ref, isLoggedIn, sessionLoading]);

  if (sessionLoading || loading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center text-zinc-500">Cargando…</div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="font-display text-4xl uppercase tracking-wide text-white">
          Pedido
        </h1>
        <p className="mt-4 text-brand-red">{error}</p>
        <Link href="/tienda" className="btn-brand-outline mt-8 inline-flex">
          Ir a la tienda
        </Link>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const label = STATUS_LABEL[order.status] ?? order.status;

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="font-display text-4xl uppercase tracking-wide text-white">
        Resultado del pago
      </h1>
      <p className="mt-2 text-sm text-zinc-500">
        Pedido <span className="font-mono text-zinc-400">{order.id}</span>
      </p>
      <div className="panel-brand mt-8 p-6 text-left">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">Estado</p>
        <p className="font-display text-2xl text-brand-yellow">{label}</p>
        <p className="mt-2 text-sm text-zinc-400">
          Si el pago fue recién aprobado, el webhook puede tardar unos segundos. Actualizá la
          página si el estado sigue en borrador.
        </p>
      </div>
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link href="/mis-pedidos" className="btn-brand-outline inline-flex px-6 py-3 text-sm">
          Ver mis pedidos
        </Link>
        <Link href="/tienda" className="btn-brand inline-flex px-6 py-3 text-sm">
          Seguir comprando
        </Link>
      </div>
    </div>
  );
}

export default function PedidoConfirmadoPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-lg px-4 py-20 text-center text-zinc-500">Cargando…</div>
      }
    >
      <PedidoConfirmadoInner />
    </Suspense>
  );
}
