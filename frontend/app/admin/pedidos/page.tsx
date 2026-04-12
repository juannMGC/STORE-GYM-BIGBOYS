"use client";

import Link from "next/link";
import { ApiError, apiFetch } from "@/lib/api-client";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

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

type OrderSnapshot = {
  id?: string;
  status?: string;
  createdAt?: string;
  user?: { email?: string; name?: string | null };
  items?: {
    quantity: number;
    priceSnapshot: number;
    product?: { title?: string };
  }[];
};

type OrderHistoryRow = {
  id: string;
  orderId: string;
  orderData: OrderSnapshot;
  deletedAt: string;
  deletedBy: string;
  reason: string | null;
};

/** Activos: PAID + SHIPPED; historial: DELIVERED + CANCELLED */
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PAID: { label: "Pagado", color: "#22c55e" },
  SHIPPED: { label: "Enviado", color: "#f97316" },
  DELIVERED: { label: "Entregado", color: "#60a5fa" },
  CANCELLED: { label: "Cancelado", color: "#d91920" },
};

const ACTIVO_FILTERS = [
  { value: "" as const, label: "Todos" },
  { value: "PAID" as const, label: "Pagado" },
  { value: "SHIPPED" as const, label: "Enviado" },
];

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

function formatFecha(fecha: string): string {
  return new Date(fecha).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function calcTotal(items: Pick<OrderItemRow, "quantity" | "priceSnapshot">[] | undefined): number {
  return (
    items?.reduce((sum, item) => sum + Number(item.priceSnapshot) * Number(item.quantity), 0) ?? 0
  );
}

function productsLabel(items: OrderItemRow[] | undefined): string {
  if (!items?.length) return "—";
  const titles = items.map((i) => i.product?.title ?? "Producto").filter(Boolean);
  if (titles.length <= 2) return titles.join(", ");
  return `${titles.slice(0, 2).join(", ")}… (+${titles.length - 2})`;
}

function statusBadgeForAdmin(status: string): { label: string; color: string } {
  const key = status === "PENDING" ? "PAID" : status;
  return STATUS_CONFIG[key] ?? { label: status, color: "#a1a1aa" };
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
  const [tabActiva, setTabActiva] = useState<"activos" | "historial">("activos");
  const [allOrders, setAllOrders] = useState<AdminOrder[]>([]);
  const [orderHistory, setOrderHistory] = useState<OrderHistoryRow[]>([]);
  const [cargando, setCargando] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [filtroActivo, setFiltroActivo] = useState<"" | "PAID" | "SHIPPED">("");

  const pedidosActivosBase = useMemo(
    () => allOrders.filter((p) => ["PAID", "SHIPPED"].includes(p.status)),
    [allOrders],
  );

  const pedidosActivos = useMemo(() => {
    if (!filtroActivo) return pedidosActivosBase;
    return pedidosActivosBase.filter((p) => p.status === filtroActivo);
  }, [pedidosActivosBase, filtroActivo]);

  const historialLive = useMemo(
    () => allOrders.filter((p) => ["DELIVERED", "CANCELLED"].includes(p.status)),
    [allOrders],
  );

  const cargarPedidos = useCallback(async () => {
    setListError(null);
    setCargando(true);
    try {
      const [activos, hist] = await Promise.all([
        apiFetch<AdminOrder[]>("/admin/orders"),
        apiFetch<OrderHistoryRow[]>("/admin/orders/history"),
      ]);
      setAllOrders(activos);
      setOrderHistory(hist);
    } catch (e) {
      setListError(e instanceof Error ? e.message : "No se pudieron cargar los pedidos");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargarPedidos();
  }, [cargarPedidos]);

  useEffect(() => {
    if (!successMsg) return;
    const t = window.setTimeout(() => setSuccessMsg(null), 5000);
    return () => window.clearTimeout(t);
  }, [successMsg]);

  const handleEliminar = async (pedidoId: string) => {
    const razon = window.prompt("¿Por qué eliminás este pedido? (opcional)");
    if (razon === null) return;

    if (
      !window.confirm(
        "¿Confirmar eliminación? El pedido quedará en el registro histórico.",
      )
    ) {
      return;
    }

    try {
      await apiFetch(`/admin/orders/${pedidoId}`, {
        method: "DELETE",
        body: JSON.stringify({ reason: razon.trim() || undefined }),
      });
      await cargarPedidos();
      setSuccessMsg("Pedido eliminado y archivado ✓");
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : "Error al eliminar el pedido";
      setListError(msg);
    }
  };

  return (
    <div>
      <h1 className="font-display text-4xl uppercase tracking-wide text-white">Pedidos</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Pedidos en curso y finalizados. Eliminá solo entregados o cancelados; quedan archivados.
      </p>

      {successMsg ? (
        <p className="mt-4 rounded border border-emerald-500/40 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200">
          {successMsg}
        </p>
      ) : null}

      <div
        style={{
          display: "flex",
          gap: "0",
          marginTop: "24px",
          marginBottom: "24px",
          borderBottom: "1px solid #2a2a2a",
        }}
      >
        {(
          [
            { id: "activos" as const, label: "📦 Pedidos activos" },
            { id: "historial" as const, label: "🗂️ Historial" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setTabActiva(tab.id)}
            style={{
              padding: "12px 24px",
              background: "none",
              border: "none",
              borderBottom:
                tabActiva === tab.id ? "2px solid #d91920" : "2px solid transparent",
              color: tabActiva === tab.id ? "#f7e047" : "#71717a",
              cursor: "pointer",
              fontFamily: "var(--font-display)",
              fontSize: "13px",
              letterSpacing: "2px",
              textTransform: "uppercase",
              transition: "all 0.15s",
              marginBottom: "-1px",
            }}
          >
            {tab.label}
            {tab.id === "activos" && pedidosActivosBase.length > 0 ? (
              <span
                style={{
                  background: "#d91920",
                  color: "white",
                  borderRadius: "10px",
                  padding: "1px 6px",
                  fontSize: "11px",
                  marginLeft: "8px",
                }}
              >
                {pedidosActivosBase.length}
              </span>
            ) : null}
            {tab.id === "historial" &&
            historialLive.length + orderHistory.length > 0 ? (
              <span
                style={{
                  background: "#3f3f46",
                  color: "white",
                  borderRadius: "10px",
                  padding: "1px 6px",
                  fontSize: "11px",
                  marginLeft: "8px",
                }}
              >
                {historialLive.length + orderHistory.length}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {listError ? <p className="mb-4 text-brand-red">{listError}</p> : null}

      {cargando ? (
        <PedidosListSkeleton />
      ) : tabActiva === "activos" ? (
        <div>
          <div className="mb-4 flex flex-wrap gap-2">
            {ACTIVO_FILTERS.map((f) => (
              <button
                key={f.value || "all"}
                type="button"
                onClick={() => setFiltroActivo(f.value)}
                className={
                  filtroActivo === f.value
                    ? "rounded-sm border-2 border-brand-red bg-brand-black px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-brand-yellow"
                    : "rounded-sm border border-brand-border bg-brand-black/40 px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-zinc-400 hover:border-zinc-500"
                }
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="admin-table-scroll panel-brand overflow-x-auto">
            <table className="min-w-[720px] w-full text-left text-sm">
              <thead className="border-b-2 border-brand-border bg-brand-black text-zinc-400">
                <tr>
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Productos</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pedidosActivos.map((o) => {
                  const { label, color } = statusBadgeForAdmin(o.status);
                  const total = calcTotal(o.items);
                  return (
                    <tr
                      key={o.id}
                      className="border-b border-brand-border last:border-0 hover:bg-brand-black/40"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-zinc-300">
                        {shortOrderId(o.id)}
                      </td>
                      <td className="max-w-[12rem] px-4 py-3 text-zinc-200">
                        <span className="block truncate" title={o.user.email}>
                          {o.user.email}
                        </span>
                        {o.user.name ? (
                          <span className="block truncate text-xs text-zinc-500">{o.user.name}</span>
                        ) : null}
                      </td>
                      <td className="max-w-[14rem] px-4 py-3 text-xs text-zinc-400">
                        {productsLabel(o.items)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-display text-brand-yellow">
                        {formatCop(total)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-block rounded border-2 bg-brand-black/60 px-2 py-0.5 text-xs font-medium uppercase"
                          style={{ borderColor: color, color }}
                        >
                          {label}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-zinc-400">
                        {formatFecha(o.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/pedidos/${o.id}`}
                          className="btn-brand inline-flex text-xs py-1.5 px-3"
                        >
                          Ver detalle →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!cargando && pedidosActivos.length === 0 ? (
            <p className="mt-6 text-zinc-500">No hay pedidos activos con este filtro.</p>
          ) : null}
        </div>
      ) : (
        <div className="space-y-10">
          <section>
            <h2 className="font-display text-sm uppercase tracking-widest text-zinc-500">
              Entregados y cancelados
            </h2>
            <div className="admin-table-scroll panel-brand mt-3 overflow-x-auto">
              <table className="min-w-[640px] w-full text-left text-sm">
                <thead className="border-b-2 border-brand-border bg-brand-black text-zinc-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">#</th>
                    <th className="px-4 py-3 font-medium">Cliente</th>
                    <th className="px-4 py-3 font-medium">Total</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    <th className="px-4 py-3 font-medium">Fecha</th>
                    <th className="px-4 py-3 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {historialLive.map((o) => {
                    const { label, color } = statusBadgeForAdmin(o.status);
                    const total = calcTotal(o.items);
                    return (
                      <tr
                        key={o.id}
                        className="border-b border-brand-border last:border-0 hover:bg-brand-black/40"
                      >
                        <td className="px-4 py-3 font-mono text-xs text-zinc-300">
                          {shortOrderId(o.id)}
                        </td>
                        <td className="max-w-[14rem] px-4 py-3 text-zinc-200">
                          <span className="block truncate" title={o.user.email}>
                            {o.user.email}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-display text-brand-yellow">
                          {formatCop(total)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="inline-block rounded border-2 bg-brand-black/60 px-2 py-0.5 text-xs font-medium uppercase"
                            style={{ borderColor: color, color }}
                          >
                            {label}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-zinc-400">
                          {formatFecha(o.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              href={`/admin/pedidos/${o.id}`}
                              className="btn-brand inline-flex text-xs py-1.5 px-3"
                            >
                              Ver detalle
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleEliminar(o.id)}
                              style={{
                                background: "none",
                                border: "1px solid #d91920",
                                color: "#d91920",
                                padding: "4px 10px",
                                cursor: "pointer",
                                fontSize: "12px",
                                fontFamily: "var(--font-display)",
                                letterSpacing: "1px",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "#d91920";
                                e.currentTarget.style.color = "white";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "none";
                                e.currentTarget.style.color = "#d91920";
                              }}
                            >
                              🗑️ Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {!cargando && historialLive.length === 0 ? (
              <p className="mt-4 text-zinc-500">No hay pedidos entregados ni cancelados.</p>
            ) : null}
          </section>

          <section>
            <h2 className="font-display text-sm uppercase tracking-widest text-zinc-500">
              Archivados (eliminados del listado)
            </h2>
            <p className="mt-1 text-xs text-zinc-600">
              Registro de pedidos dados de baja; el detalle en línea ya no está disponible.
            </p>
            <div className="admin-table-scroll panel-brand mt-3 overflow-x-auto">
              <table className="min-w-[720px] w-full text-left text-sm">
                <thead className="border-b-2 border-brand-border bg-brand-black text-zinc-400">
                  <tr>
                    <th className="px-4 py-3 font-medium"># pedido</th>
                    <th className="px-4 py-3 font-medium">Cliente</th>
                    <th className="px-4 py-3 font-medium">Total (snapshot)</th>
                    <th className="px-4 py-3 font-medium">Estado (snapshot)</th>
                    <th className="px-4 py-3 font-medium">Eliminado</th>
                    <th className="px-4 py-3 font-medium">Por</th>
                    <th className="px-4 py-3 font-medium">Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {orderHistory.map((h) => {
                    const snap = h.orderData;
                    const total = calcTotal(
                      snap.items as
                        | { quantity: number; priceSnapshot: number }[]
                        | undefined,
                    );
                    const prevStatus = snap.status ?? "—";
                    const { label, color } = statusBadgeForAdmin(prevStatus);
                    return (
                      <tr
                        key={h.id}
                        className="border-b border-brand-border last:border-0 hover:bg-brand-black/40"
                      >
                        <td className="px-4 py-3 font-mono text-xs text-zinc-300">
                          {shortOrderId(h.orderId)}
                        </td>
                        <td className="max-w-[12rem] px-4 py-3 text-zinc-200">
                          <span className="block truncate" title={snap.user?.email}>
                            {snap.user?.email ?? "—"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-display text-brand-yellow">
                          {formatCop(total)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="inline-block rounded border-2 bg-brand-black/60 px-2 py-0.5 text-xs font-medium uppercase"
                            style={{ borderColor: color, color }}
                          >
                            {label}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-zinc-400">
                          {formatFecha(h.deletedAt)}
                        </td>
                        <td className="max-w-[10rem] truncate px-4 py-3 text-xs text-zinc-500" title={h.deletedBy}>
                          {h.deletedBy}
                        </td>
                        <td className="max-w-[14rem] px-4 py-3 text-xs text-zinc-500">
                          {h.reason ?? "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {!cargando && orderHistory.length === 0 ? (
              <p className="mt-4 text-zinc-500">Todavía no hay pedidos archivados.</p>
            ) : null}
          </section>
        </div>
      )}
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
