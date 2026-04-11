"use client";

import { ApiError, apiFetch } from "@/lib/api-client";
import { useRouter, useSearchParams } from "next/navigation";
import { Fragment, Suspense, useCallback, useEffect, useMemo, useState } from "react";

type OrderItemRow = {
  id: string;
  quantity: number;
  priceSnapshot: number;
  product: {
    id: string;
    title: string;
    images: { url: string }[];
  };
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

type CatalogProduct = {
  id: string;
  title: string;
  images: { url: string }[];
  sizes: { size: { id: string; name: string } }[];
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const STATUS_FILTER = [
  { value: "", label: "Todos" },
  { value: "DRAFT", label: "Borrador" },
  { value: "PENDING", label: "Pendiente" },
  { value: "PAID", label: "Confirmado" },
  { value: "SHIPPED", label: "Enviado" },
  { value: "DELIVERED", label: "Entregado" },
  { value: "CANCELLED", label: "Cancelado" },
] as const;

const STATUS_PATCH_OPTIONS: { value: string; label: string }[] = [
  { value: "PENDING", label: "Pendiente" },
  { value: "PAID", label: "Confirmado" },
  { value: "SHIPPED", label: "Enviado" },
  { value: "DELIVERED", label: "Entregado" },
  { value: "CANCELLED", label: "Cancelado" },
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

function paymentLabel(pm: string | null): string {
  if (!pm) return "—";
  const map: Record<string, string> = {
    CASH: "Efectivo",
    BANK_TRANSFER: "Transferencia",
    CARD: "Tarjeta",
  };
  return map[pm] ?? pm;
}

function itemImageUrl(line: OrderItemRow): string | undefined {
  const u = line.product?.images?.[0]?.url?.trim();
  return u || undefined;
}

function mergeOrderInList(prev: AdminOrder[], updated: AdminOrder): AdminOrder[] {
  return prev.map((x) => (x.id === updated.id ? { ...x, ...updated } : x));
}

function PedidosListSkeleton() {
  return (
    <div className="panel-brand animate-pulse space-y-3 p-6">
      <div className="h-10 w-full max-w-xs rounded bg-brand-steel/30" />
      <div className="h-48 rounded bg-brand-steel/20" />
      <div className="h-48 rounded bg-brand-steel/20" />
    </div>
  );
}

function AdminPedidosInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderFromUrl = searchParams.get("order");

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminOrder | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [qtyInputs, setQtyInputs] = useState<Record<string, string>>({});
  const [itemBusyId, setItemBusyId] = useState<string | null>(null);

  const [selectedStatus, setSelectedStatus] = useState("");
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [statusErr, setStatusErr] = useState<string | null>(null);

  const [addModalOrderId, setAddModalOrderId] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [addProductId, setAddProductId] = useState("");
  const [addSizeId, setAddSizeId] = useState("");
  const [addQty, setAddQty] = useState("1");
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addErr, setAddErr] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    setListError(null);
    setListLoading(true);
    try {
      const q = statusFilter
        ? `?status=${encodeURIComponent(statusFilter)}`
        : "";
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

  useEffect(() => {
    if (orderFromUrl && UUID_RE.test(orderFromUrl)) {
      setExpandedId(orderFromUrl);
    }
  }, [orderFromUrl]);

  const loadDetail = useCallback(async (id: string) => {
    setDetailError(null);
    setDetailLoading(true);
    try {
      const d = await apiFetch<AdminOrder>(`/admin/orders/${id}`);
      setDetail(d);
      const q: Record<string, string> = {};
      for (const it of d.items) q[it.id] = String(it.quantity);
      setQtyInputs(q);
      setSelectedStatus(d.status);
      setStatusMsg(null);
      setStatusErr(null);
    } catch (e) {
      setDetailError(e instanceof Error ? e.message : "Error al cargar el pedido");
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!expandedId) {
      setDetail(null);
      return;
    }
    void loadDetail(expandedId);
  }, [expandedId, loadDetail]);

  function openRow(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
      router.replace("/admin/pedidos", { scroll: false });
      return;
    }
    setExpandedId(id);
    router.replace(`/admin/pedidos?order=${encodeURIComponent(id)}`, { scroll: false });
  }

  function applyDetailToState(updated: AdminOrder) {
    setDetail(updated);
    setOrders((prev) => mergeOrderInList(prev, updated));
    const q: Record<string, string> = {};
    for (const it of updated.items) q[it.id] = String(it.quantity);
    setQtyInputs(q);
  }

  async function submitStatus(orderId: string) {
    if (!detail || selectedStatus === detail.status) return;
    setStatusSaving(true);
    setStatusMsg(null);
    setStatusErr(null);
    try {
      const updated = await apiFetch<AdminOrder>(`/admin/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: selectedStatus }),
      });
      applyDetailToState(updated);
      setStatusMsg("Estado actualizado");
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "No se pudo actualizar";
      setStatusErr(msg);
    } finally {
      setStatusSaving(false);
    }
  }

  async function submitItemQty(orderId: string, itemId: string) {
    const raw = qtyInputs[itemId];
    const qty = Number.parseInt(raw ?? "", 10);
    if (!Number.isFinite(qty) || qty < 1) return;
    setItemBusyId(itemId);
    try {
      const updated = await apiFetch<AdminOrder>(`/orders/${orderId}/items/${itemId}`, {
        method: "PATCH",
        body: JSON.stringify({ quantity: qty }),
      });
      applyDetailToState(updated);
    } catch (e) {
      setDetailError(e instanceof Error ? e.message : "No se pudo actualizar el ítem");
    } finally {
      setItemBusyId(null);
    }
  }

  async function removeItem(orderId: string, itemId: string) {
    if (!confirm("¿Eliminar esta línea del pedido?")) return;
    setItemBusyId(itemId);
    try {
      const updated = await apiFetch<AdminOrder>(`/orders/${orderId}/items/${itemId}`, {
        method: "DELETE",
      });
      applyDetailToState(updated);
    } catch (e) {
      setDetailError(e instanceof Error ? e.message : "No se pudo eliminar");
    } finally {
      setItemBusyId(null);
    }
  }

  const selectedCatalogProduct = useMemo(
    () => catalog.find((p) => p.id === addProductId),
    [catalog, addProductId],
  );

  async function openAddModal(orderId: string) {
    setAddModalOrderId(orderId);
    setAddErr(null);
    setAddProductId("");
    setAddSizeId("");
    setAddQty("1");
    if (catalog.length === 0) {
      setCatalogLoading(true);
      try {
        const data = await apiFetch<CatalogProduct[]>("/products");
        setCatalog(data);
      } catch {
        setAddErr("No se pudo cargar el catálogo");
      } finally {
        setCatalogLoading(false);
      }
    }
  }

  async function confirmAddItem() {
    if (!addModalOrderId || !addProductId) return;
    const q = Number.parseInt(addQty, 10);
    if (!Number.isFinite(q) || q < 1) {
      setAddErr("Cantidad inválida");
      return;
    }
    const p = catalog.find((x) => x.id === addProductId);
    const needsSize = (p?.sizes?.length ?? 0) > 0;
    if (needsSize && !addSizeId) {
      setAddErr("Elegí una talla");
      return;
    }
    setAddSubmitting(true);
    setAddErr(null);
    try {
      const body: { productId: string; quantity: number; sizeId?: string } = {
        productId: addProductId,
        quantity: q,
      };
      if (needsSize) body.sizeId = addSizeId;
      const updated = await apiFetch<AdminOrder>(
        `/orders/${addModalOrderId}/items/admin`,
        {
          method: "POST",
          body: JSON.stringify(body),
        },
      );
      applyDetailToState(updated);
      setAddModalOrderId(null);
    } catch (e) {
      setAddErr(e instanceof Error ? e.message : "No se pudo agregar");
    } finally {
      setAddSubmitting(false);
    }
  }

  useEffect(() => {
    if (!addProductId) {
      setAddSizeId("");
      return;
    }
    const p = catalog.find((x) => x.id === addProductId);
    if (!p?.sizes?.length) setAddSizeId("");
  }, [addProductId, catalog]);

  const statusOptionsForSelect = useMemo(() => {
    if (!detail) return STATUS_PATCH_OPTIONS;
    const has = STATUS_PATCH_OPTIONS.some((o) => o.value === detail.status);
    if (has) return STATUS_PATCH_OPTIONS;
    return [
      { value: detail.status, label: statusBadge(detail.status).label },
      ...STATUS_PATCH_OPTIONS,
    ];
  }, [detail]);

  return (
    <div>
      <h1 className="font-display text-4xl uppercase tracking-wide text-white">Pedidos</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Administrá estados y líneas de cada pedido. Los clientes ven el historial en{" "}
        <span className="text-brand-yellow">Mis pedidos</span>.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
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
      </div>

      {listError ? <p className="mt-4 text-brand-red">{listError}</p> : null}

      {listLoading ? (
        <div className="mt-6">
          <PedidosListSkeleton />
        </div>
      ) : (
        <div className="panel-brand mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
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
                const open = expandedId === o.id;
                return (
                  <Fragment key={o.id}>
                    <tr className="border-b border-brand-border last:border-0 hover:bg-brand-black/40">
                      <td className="px-4 py-3 font-mono text-xs text-zinc-300">
                        {shortOrderId(o.id)}
                      </td>
                      <td className="px-4 py-3 text-zinc-200">
                        <span className="block truncate max-w-[14rem]" title={o.user.email}>
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
                      <td className="px-4 py-3 font-display text-brand-yellow whitespace-nowrap">
                        {formatCop(total)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-zinc-400">
                        {new Date(o.createdAt).toLocaleString("es-CO")}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => openRow(o.id)}
                          className="btn-brand text-xs py-1.5 px-3"
                        >
                          {open ? "Cerrar" : "Ver detalle"}
                        </button>
                      </td>
                    </tr>
                    {open ? (
                      <tr key={`${o.id}-detail`} className="border-b border-brand-border bg-brand-black/30">
                        <td colSpan={6} className="px-4 py-6">
                          {detailLoading ? (
                            <p className="text-zinc-500">Cargando detalle…</p>
                          ) : detailError ? (
                            <p className="text-brand-red">{detailError}</p>
                          ) : detail && detail.id === o.id ? (
                            <div className="space-y-6">
                              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                <div className="panel-brand p-4">
                                  <p className="text-xs font-semibold uppercase text-zinc-500">
                                    Pedido
                                  </p>
                                  <p className="mt-1 font-mono text-sm text-zinc-200 break-all">
                                    {detail.id}
                                  </p>
                                </div>
                                <div className="panel-brand p-4">
                                  <p className="text-xs font-semibold uppercase text-zinc-500">
                                    Cliente
                                  </p>
                                  <p className="mt-1 text-zinc-100">{detail.user.email}</p>
                                  {detail.user.name ? (
                                    <p className="text-sm text-zinc-400">{detail.user.name}</p>
                                  ) : null}
                                </div>
                                <div className="panel-brand p-4">
                                  <p className="text-xs font-semibold uppercase text-zinc-500">
                                    Fecha
                                  </p>
                                  <p className="mt-1 text-zinc-300">
                                    {new Date(detail.createdAt).toLocaleString("es-CO")}
                                  </p>
                                  <p className="mt-2 text-xs font-semibold uppercase text-zinc-500">
                                    Pago
                                  </p>
                                  <p className="mt-1 text-zinc-300">
                                    {paymentLabel(detail.paymentMethod)}
                                  </p>
                                </div>
                              </div>

                              <div className="panel-brand p-4">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                  <p className="font-display text-lg uppercase text-white">Total</p>
                                  <p className="font-display text-2xl text-brand-yellow">
                                    {formatCop(orderTotal(detail))}
                                  </p>
                                </div>
                              </div>

                              <div className="panel-brand p-4">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                  <h3 className="font-display text-lg uppercase text-white">
                                    Cambiar estado
                                  </h3>
                                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                                    <div>
                                      <label
                                        htmlFor={`st-${detail.id}`}
                                        className="text-xs text-zinc-500"
                                      >
                                        Estado
                                      </label>
                                      <select
                                        id={`st-${detail.id}`}
                                        value={selectedStatus}
                                        onChange={(e) => {
                                          setSelectedStatus(e.target.value);
                                          setStatusMsg(null);
                                          setStatusErr(null);
                                        }}
                                        className="select-brand mt-1 w-full min-w-[12rem]"
                                      >
                                        {statusOptionsForSelect.map((opt) => (
                                          <option
                                            key={opt.value}
                                            value={opt.value}
                                            className="bg-brand-steel"
                                          >
                                            {opt.label}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <button
                                      type="button"
                                      disabled={
                                        statusSaving ||
                                        !selectedStatus ||
                                        selectedStatus === detail.status
                                      }
                                      onClick={() => void submitStatus(detail.id)}
                                      className="btn-brand disabled:opacity-50"
                                    >
                                      {statusSaving ? "Guardando…" : "Actualizar estado"}
                                    </button>
                                  </div>
                                </div>
                                {statusMsg ? (
                                  <p className="mt-2 text-sm text-green-400">{statusMsg}</p>
                                ) : null}
                                {statusErr ? (
                                  <p className="mt-2 text-sm text-brand-red">{statusErr}</p>
                                ) : null}
                              </div>

                              <div>
                                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                  <h3 className="font-display text-lg uppercase text-white">
                                    Ítems
                                  </h3>
                                  <button
                                    type="button"
                                    onClick={() => openAddModal(detail.id)}
                                    className="btn-brand text-sm py-2"
                                  >
                                    Agregar producto
                                  </button>
                                </div>
                                <ul className="space-y-3">
                                  {detail.items.map((line) => {
                                    const imgUrl = itemImageUrl(line);
                                    const title = line.product?.title ?? "";
                                    const initial = (title.charAt(0) || "?").toUpperCase();
                                    const sub = line.priceSnapshot * line.quantity;
                                    const busy = itemBusyId === line.id;
                                    return (
                                      <li
                                        key={line.id}
                                        className="panel-brand flex flex-col gap-3 p-4 sm:flex-row sm:items-center"
                                      >
                                        <div className="flex shrink-0 items-center gap-3">
                                          {imgUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                              src={imgUrl}
                                              alt={title}
                                              className="h-16 w-16 rounded-sm border border-brand-border object-cover"
                                              onError={(e) => {
                                                e.currentTarget.style.display = "none";
                                              }}
                                            />
                                          ) : (
                                            <div
                                              className="flex h-16 w-16 items-center justify-center rounded-sm border border-brand-border bg-brand-black font-display text-xl text-brand-red"
                                              style={{ fontFamily: "var(--font-display)" }}
                                            >
                                              {initial}
                                            </div>
                                          )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <p className="font-semibold text-brand-yellow">{title}</p>
                                          <p className="text-xs text-zinc-500">
                                            Talla: {line.size?.name ?? "—"}
                                          </p>
                                          <div className="mt-2 flex flex-wrap items-end gap-2">
                                            <div>
                                              <label
                                                className="text-xs text-zinc-500"
                                                htmlFor={`qty-${line.id}`}
                                              >
                                                Cantidad
                                              </label>
                                              <input
                                                id={`qty-${line.id}`}
                                                type="number"
                                                min={1}
                                                className="input-brand ml-0 mt-1 w-24"
                                                value={qtyInputs[line.id] ?? ""}
                                                onChange={(e) =>
                                                  setQtyInputs((prev) => ({
                                                    ...prev,
                                                    [line.id]: e.target.value,
                                                  }))
                                                }
                                              />
                                            </div>
                                            <button
                                              type="button"
                                              disabled={busy}
                                              onClick={() => void submitItemQty(detail.id, line.id)}
                                              className="btn-brand text-xs py-1.5"
                                            >
                                              Actualizar
                                            </button>
                                            <button
                                              type="button"
                                              disabled={busy}
                                              onClick={() => void removeItem(detail.id, line.id)}
                                              className="rounded border border-brand-red/60 px-2 py-1.5 text-xs text-brand-red hover:bg-brand-red/10"
                                            >
                                              Eliminar
                                            </button>
                                          </div>
                                        </div>
                                        <div className="text-right text-sm sm:shrink-0">
                                          <p className="text-zinc-500">Unit.</p>
                                          <p className="text-zinc-200">{formatCop(line.priceSnapshot)}</p>
                                          <p className="mt-1 text-zinc-500">Subtotal</p>
                                          <p className="font-display text-brand-yellow">
                                            {formatCop(sub)}
                                          </p>
                                        </div>
                                      </li>
                                    );
                                  })}
                                </ul>
                                {detail.items.length === 0 ? (
                                  <p className="text-zinc-500">Sin ítems.</p>
                                ) : null}
                              </div>
                            </div>
                          ) : (
                            <p className="text-zinc-500">Seleccioná un pedido.</p>
                          )}
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!listLoading && orders.length === 0 && !listError ? (
        <p className="mt-8 text-zinc-500">No hay pedidos con este filtro.</p>
      ) : null}

      {addModalOrderId ? (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-item-title"
        >
          <div className="panel-brand max-h-[90vh] w-full max-w-md overflow-y-auto p-6">
            <h2 id="add-item-title" className="font-display text-xl uppercase text-white">
              Agregar producto
            </h2>
            {catalogLoading ? (
              <p className="mt-4 text-zinc-500">Cargando productos…</p>
            ) : (
              <>
                <label className="mt-4 block text-xs text-zinc-500" htmlFor="add-prod">
                  Producto
                </label>
                <select
                  id="add-prod"
                  value={addProductId}
                  onChange={(e) => setAddProductId(e.target.value)}
                  className="select-brand mt-1 w-full"
                >
                  <option value="">Elegir…</option>
                  {catalog.map((p) => (
                    <option key={p.id} value={p.id} className="bg-brand-steel">
                      {p.title}
                    </option>
                  ))}
                </select>
                {selectedCatalogProduct && selectedCatalogProduct.sizes.length > 0 ? (
                  <>
                    <label className="mt-3 block text-xs text-zinc-500" htmlFor="add-size">
                      Talla
                    </label>
                    <select
                      id="add-size"
                      value={addSizeId}
                      onChange={(e) => setAddSizeId(e.target.value)}
                      className="select-brand mt-1 w-full"
                    >
                      <option value="">Elegir…</option>
                      {selectedCatalogProduct.sizes.map((s) => (
                        <option
                          key={s.size.id}
                          value={s.size.id}
                          className="bg-brand-steel"
                        >
                          {s.size.name}
                        </option>
                      ))}
                    </select>
                  </>
                ) : null}
                <label className="mt-3 block text-xs text-zinc-500" htmlFor="add-qty">
                  Cantidad
                </label>
                <input
                  id="add-qty"
                  type="number"
                  min={1}
                  className="input-brand mt-1 w-full"
                  value={addQty}
                  onChange={(e) => setAddQty(e.target.value)}
                />
                {addErr ? <p className="mt-3 text-sm text-brand-red">{addErr}</p> : null}
                <div className="mt-6 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={addSubmitting}
                    onClick={() => void confirmAddItem()}
                    className="btn-brand disabled:opacity-50"
                  >
                    {addSubmitting ? "Agregando…" : "Confirmar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddModalOrderId(null)}
                    className="rounded border border-brand-border px-4 py-2 text-sm text-zinc-300 hover:bg-brand-steel/30"
                  >
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
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
