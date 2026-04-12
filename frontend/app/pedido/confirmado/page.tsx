"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { apiFetch, formatShopApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

type OrderFetchShape = { id: string; status: string };

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Borrador",
  PENDING: "Pagado",
  PAID: "Pagado",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

function wompiStatusMessage(status: string | null): { text: string; tone: "ok" | "warn" | "bad" } | null {
  if (!status) return null;
  const s = status.toUpperCase();
  if (s === "APPROVED") {
    return {
      text: "¡Pago exitoso! Tu pedido está confirmado 🎉",
      tone: "ok",
    };
  }
  if (s === "DECLINED" || s === "VOIDED" || s === "ERROR") {
    return {
      text: "El pago fue rechazado. Intentá de nuevo.",
      tone: "bad",
    };
  }
  if (s === "PENDING") {
    return {
      text: "Pago en proceso, te notificaremos.",
      tone: "warn",
    };
  }
  return null;
}

function PedidoConfirmadoInner() {
  const searchParams = useSearchParams();
  const ref =
    searchParams.get("reference") ??
    searchParams.get("ref") ??
    searchParams.get("id") ??
    null;
  const wompiStatus = searchParams.get("status");
  const wompiMsg = wompiStatusMessage(wompiStatus);

  const { isLoggedIn, loading: sessionLoading } = useAuth();
  const [order, setOrder] = useState<OrderFetchShape | null>(null);
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
    apiFetch<OrderFetchShape>(`/orders/${ref}`)
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
        <h1 className="font-display text-4xl uppercase tracking-wide text-white">Pedido</h1>
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
  const toneClass =
    wompiMsg?.tone === "ok"
      ? "text-emerald-400"
      : wompiMsg?.tone === "bad"
        ? "text-brand-red"
        : wompiMsg?.tone === "warn"
          ? "text-brand-yellow"
          : "text-zinc-200";

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="font-display text-4xl uppercase tracking-wide text-white">
        Resultado del pago
      </h1>
      <p className="mt-2 text-sm text-zinc-500">
        Pedido <span className="font-mono text-zinc-400">{order.id}</span>
      </p>

      {wompiMsg ? (
        <p className={`mt-6 text-lg font-medium leading-snug ${toneClass}`}>{wompiMsg.text}</p>
      ) : null}

      <div className="panel-brand mt-8 p-6 text-left">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">Estado en tienda</p>
        <p className="font-display text-2xl text-brand-yellow">{label}</p>
        <p className="mt-2 text-sm text-zinc-400">
          Si el pago fue recién aprobado, el webhook puede tardar unos segundos. Actualizá la página
          si el estado sigue en borrador.
        </p>
      </div>
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link
          href={`/checkout/factura-detallada/${order.id}`}
          className="btn-brand inline-flex px-6 py-3 text-sm"
        >
          Ver factura completa
        </Link>
        <Link href="/mis-pedidos" className="btn-brand-outline inline-flex px-6 py-3 text-sm">
          Ver mis pedidos
        </Link>
        <Link href="/tienda" className="btn-brand-outline inline-flex px-6 py-3 text-sm">
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
