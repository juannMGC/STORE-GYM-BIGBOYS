"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError, apiFetch } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

type OrderDetail = {
  id: string;
  status: string;
  paymentMethod: string | null;
  createdAt: string;
  shippingEmail: string | null;
  shippingDepartment: string | null;
  shippingCity: string | null;
  shippingNeighborhood: string | null;
  shippingAddress: string | null;
  shippingComplement: string | null;
  user: { id: string; name: string | null; email: string };
  items: {
    id: string;
    quantity: number;
    unitPrice: number;
    product: { id: string; name: string; imageUrl: string | null; price: number };
    size: { id: string; name: string } | null;
  }[];
};

type CatalogProduct = {
  id: string;
  title: string;
  images: { url: string }[];
  sizes: { size: { id: string; name: string } }[];
};

const PAYMENT_METHODS = [
  { value: "CASH", label: "Efectivo" },
  { value: "BANK_TRANSFER", label: "Transferencia bancaria" },
  { value: "CARD", label: "Tarjeta" },
] as const;

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "DRAFT", label: "Borrador" },
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

function orderTotal(d: OrderDetail | null): number {
  if (!d) return 0;
  return d.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
}

function formatDateLong(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function lineImageUrl(line: OrderDetail["items"][number]): string | undefined {
  const u = line.product?.imageUrl?.trim();
  return u || undefined;
}

export default function AdminPedidoDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { user, isLoading: authLoading } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedStatus, setSelectedStatus] = useState("");
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusOk, setStatusOk] = useState<string | null>(null);
  const [statusErr, setStatusErr] = useState<string | null>(null);

  const [shipEmail, setShipEmail] = useState("");
  const [shipDept, setShipDept] = useState("");
  const [shipCity, setShipCity] = useState("");
  const [shipBarrio, setShipBarrio] = useState("");
  const [shipAddr, setShipAddr] = useState("");
  const [shipComp, setShipComp] = useState("");
  const [shipSaving, setShipSaving] = useState(false);
  const [shipOk, setShipOk] = useState<string | null>(null);
  const [shipErr, setShipErr] = useState<string | null>(null);

  const [payMethod, setPayMethod] = useState<string>("BANK_TRANSFER");
  const [paySaving, setPaySaving] = useState(false);
  const [payOk, setPayOk] = useState<string | null>(null);
  const [payErr, setPayErr] = useState<string | null>(null);

  const [qtyDraft, setQtyDraft] = useState<Record<string, string>>({});
  const [itemBusy, setItemBusy] = useState<string | null>(null);
  const [itemsErr, setItemsErr] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [addProductId, setAddProductId] = useState("");
  const [addSizeId, setAddSizeId] = useState("");
  const [addQty, setAddQty] = useState("1");
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addErr, setAddErr] = useState<string | null>(null);

  const applyOrder = useCallback((d: OrderDetail) => {
    setOrder(d);
    setSelectedStatus(d.status);
    setPayMethod(d.paymentMethod || "BANK_TRANSFER");
    setShipEmail(d.shippingEmail ?? "");
    setShipDept(d.shippingDepartment ?? "");
    setShipCity(d.shippingCity ?? "");
    setShipBarrio(d.shippingNeighborhood ?? "");
    setShipAddr(d.shippingAddress ?? "");
    setShipComp(d.shippingComplement ?? "");
    const q: Record<string, string> = {};
    for (const it of d.items) q[it.id] = String(it.quantity);
    setQtyDraft(q);
  }, []);

  const load = useCallback(async () => {
    if (!id) return;
    setError(null);
    setLoading(true);
    try {
      const d = await apiFetch<OrderDetail>(`/orders/${id}`);
      applyOrder(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [id, applyOrder]);

  useEffect(() => {
    if (authLoading || !isAdmin) return;
    void load();
  }, [authLoading, isAdmin, load]);

  const statusSelectOptions = useMemo(() => {
    if (!order) return STATUS_OPTIONS;
    if (STATUS_OPTIONS.some((o) => o.value === order.status)) return STATUS_OPTIONS;
    return [{ value: order.status, label: order.status }, ...STATUS_OPTIONS];
  }, [order]);

  const selectedCatalogProduct = useMemo(
    () => catalog.find((p) => p.id === addProductId),
    [catalog, addProductId],
  );

  async function saveStatus() {
    if (!order || selectedStatus === order.status) return;
    setStatusSaving(true);
    setStatusOk(null);
    setStatusErr(null);
    try {
      const d = await apiFetch<OrderDetail>(`/orders/${order.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: selectedStatus }),
      });
      applyOrder(d);
      setStatusOk("Estado actualizado");
    } catch (e) {
      setStatusErr(e instanceof ApiError ? e.message : "No se pudo actualizar");
    } finally {
      setStatusSaving(false);
    }
  }

  async function saveShipping() {
    if (!order) return;
    setShipSaving(true);
    setShipOk(null);
    setShipErr(null);
    try {
      const d = await apiFetch<OrderDetail>(`/orders/${order.id}/shipping`, {
        method: "PATCH",
        body: JSON.stringify({
          shippingEmail: shipEmail.trim() || undefined,
          shippingDepartment: shipDept.trim() || undefined,
          shippingCity: shipCity.trim() || undefined,
          shippingNeighborhood: shipBarrio.trim() || undefined,
          shippingAddress: shipAddr.trim() || undefined,
          shippingComplement: shipComp.trim() || undefined,
        }),
      });
      applyOrder(d);
      setShipOk("Datos de envío guardados");
    } catch (e) {
      setShipErr(e instanceof ApiError ? e.message : "No se pudo guardar");
    } finally {
      setShipSaving(false);
    }
  }

  async function savePayment() {
    if (!order) return;
    setPaySaving(true);
    setPayOk(null);
    setPayErr(null);
    try {
      const d = await apiFetch<OrderDetail>(`/orders/${order.id}/payment`, {
        method: "PATCH",
        body: JSON.stringify({ paymentMethod: payMethod }),
      });
      applyOrder(d);
      setPayOk("Método de pago actualizado");
    } catch (e) {
      setPayErr(e instanceof ApiError ? e.message : "No se pudo actualizar");
    } finally {
      setPaySaving(false);
    }
  }

  async function submitItemQty(itemId: string) {
    if (!order) return;
    const raw = qtyDraft[itemId];
    const qty = Number.parseInt(raw ?? "", 10);
    if (!Number.isFinite(qty) || qty < 1) return;
    setItemBusy(itemId);
    setItemsErr(null);
    try {
      const d = await apiFetch<OrderDetail>(`/orders/${order.id}/items/${itemId}`, {
        method: "PATCH",
        body: JSON.stringify({ quantity: qty }),
      });
      applyOrder(d);
    } catch (e) {
      setItemsErr(e instanceof ApiError ? e.message : "Error al actualizar ítem");
    } finally {
      setItemBusy(null);
    }
  }

  async function removeItem(itemId: string) {
    if (!order || !confirm("¿Eliminar esta línea del pedido?")) return;
    setItemBusy(itemId);
    setItemsErr(null);
    try {
      const d = await apiFetch<OrderDetail>(`/orders/${order.id}/items/${itemId}`, {
        method: "DELETE",
      });
      applyOrder(d);
    } catch (e) {
      setItemsErr(e instanceof ApiError ? e.message : "Error al eliminar");
    } finally {
      setItemBusy(null);
    }
  }

  async function openAddModal() {
    setAddOpen(true);
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

  async function confirmAdd() {
    if (!order || !addProductId) return;
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
      const d = await apiFetch<OrderDetail>(`/orders/${order.id}/items/admin`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      applyOrder(d);
      setAddOpen(false);
    } catch (e) {
      setAddErr(e instanceof ApiError ? e.message : "No se pudo agregar");
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

  if (authLoading) {
    return <p className="text-zinc-500">Cargando…</p>;
  }

  if (!isAdmin) {
    return (
      <div>
        <p className="text-brand-red">No tenés permisos para ver esta página.</p>
        <Link href="/admin/pedidos" className="mt-4 inline-block text-brand-yellow hover:underline">
          Volver a pedidos
        </Link>
      </div>
    );
  }

  if (loading) {
    return <p className="text-zinc-500">Cargando pedido…</p>;
  }

  if (error || !order) {
    return (
      <div>
        <p className="text-brand-red">{error ?? "Pedido no encontrado"}</p>
        <Link href="/admin/pedidos" className="btn-brand-outline mt-6 inline-flex">
          ← Volver a pedidos
        </Link>
      </div>
    );
  }

  const total = orderTotal(order);

  return (
    <div>
      <Link
        href="/admin/pedidos"
        className="text-sm font-medium text-brand-yellow hover:underline"
      >
        ← Volver a pedidos
      </Link>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">
        <div className="space-y-6">
          <div className="panel-brand p-6">
            <p className="font-display text-2xl uppercase tracking-wide text-brand-yellow">
              Pedido #{shortOrderId(order.id)}
            </p>
            <p className="mt-2 text-sm text-zinc-400">Fecha: {formatDateLong(order.createdAt)}</p>
            <p className="mt-1 font-mono text-xs text-zinc-600 break-all">{order.id}</p>
          </div>

          <div className="panel-brand p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Cliente</p>
            <p className="mt-2 text-zinc-100">{order.user.name ?? "—"}</p>
            <p className="text-sm text-zinc-400">{order.user.email}</p>
          </div>

          <div className="panel-brand p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Estado del pedido
            </p>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setStatusOk(null);
                setStatusErr(null);
              }}
              className="select-brand mt-3 w-full"
            >
              {statusSelectOptions.map((o) => (
                <option key={o.value} value={o.value} className="bg-brand-steel">
                  {o.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={statusSaving || selectedStatus === order.status}
              onClick={() => void saveStatus()}
              className="btn-brand mt-3 w-full disabled:opacity-50"
            >
              {statusSaving ? "Guardando…" : "Actualizar estado"}
            </button>
            {statusOk ? (
              <p className="mt-2 text-sm" style={{ color: "#22c55e" }}>
                {statusOk}
              </p>
            ) : null}
            {statusErr ? (
              <p className="mt-2 text-sm" style={{ color: "#d91920" }}>
                {statusErr}
              </p>
            ) : null}
          </div>

          <div className="panel-brand p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Datos de envío
            </p>
            <div className="mt-3 space-y-3">
              <div>
                <label className="text-xs text-zinc-500" htmlFor="adm-ship-email">
                  Email
                </label>
                <input
                  id="adm-ship-email"
                  className="input-brand mt-1 w-full"
                  value={shipEmail}
                  onChange={(e) => setShipEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500" htmlFor="adm-ship-dept">
                  Departamento
                </label>
                <input
                  id="adm-ship-dept"
                  className="input-brand mt-1 w-full"
                  value={shipDept}
                  onChange={(e) => setShipDept(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500" htmlFor="adm-ship-city">
                  Ciudad
                </label>
                <input
                  id="adm-ship-city"
                  className="input-brand mt-1 w-full"
                  value={shipCity}
                  onChange={(e) => setShipCity(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500" htmlFor="adm-ship-barrio">
                  Barrio
                </label>
                <input
                  id="adm-ship-barrio"
                  className="input-brand mt-1 w-full"
                  value={shipBarrio}
                  onChange={(e) => setShipBarrio(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500" htmlFor="adm-ship-addr">
                  Dirección
                </label>
                <input
                  id="adm-ship-addr"
                  className="input-brand mt-1 w-full"
                  value={shipAddr}
                  onChange={(e) => setShipAddr(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500" htmlFor="adm-ship-comp">
                  Complemento
                </label>
                <input
                  id="adm-ship-comp"
                  className="input-brand mt-1 w-full"
                  value={shipComp}
                  onChange={(e) => setShipComp(e.target.value)}
                />
              </div>
            </div>
            <button
              type="button"
              disabled={shipSaving}
              onClick={() => void saveShipping()}
              className="btn-brand mt-4 w-full disabled:opacity-50"
            >
              {shipSaving ? "Guardando…" : "Guardar datos envío"}
            </button>
            {shipOk ? (
              <p className="mt-2 text-sm" style={{ color: "#22c55e" }}>
                {shipOk}
              </p>
            ) : null}
            {shipErr ? (
              <p className="mt-2 text-sm" style={{ color: "#d91920" }}>
                {shipErr}
              </p>
            ) : null}
          </div>

          <div className="panel-brand p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Método de pago
            </p>
            <select
              value={payMethod}
              onChange={(e) => {
                setPayMethod(e.target.value);
                setPayOk(null);
                setPayErr(null);
              }}
              className="select-brand mt-3 w-full"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value} className="bg-brand-steel">
                  {m.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={
                paySaving || String(order.paymentMethod ?? "") === payMethod
              }
              onClick={() => void savePayment()}
              className="btn-brand mt-3 w-full disabled:opacity-50"
            >
              {paySaving ? "Guardando…" : "Actualizar pago"}
            </button>
            {payOk ? (
              <p className="mt-2 text-sm" style={{ color: "#22c55e" }}>
                {payOk}
              </p>
            ) : null}
            {payErr ? (
              <p className="mt-2 text-sm" style={{ color: "#d91920" }}>
                {payErr}
              </p>
            ) : null}
          </div>
        </div>

        <div className="panel-brand p-6">
          <p className="font-display text-lg uppercase tracking-wide text-brand-yellow">
            Productos del pedido
          </p>
          {itemsErr ? (
            <p className="mt-2 text-sm" style={{ color: "#d91920" }}>
              {itemsErr}
            </p>
          ) : null}
          <ul className="mt-4 space-y-4">
            {order.items.map((line) => {
              const imgUrl = lineImageUrl(line);
              const title = line.product?.name ?? "";
              const initial = (title.charAt(0) || "?").toUpperCase();
              const busy = itemBusy === line.id;
              const lineSub = line.unitPrice * line.quantity;
              return (
                <li
                  key={line.id}
                  className="border-b border-brand-border pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex gap-3">
                    <div className="shrink-0">
                      {imgUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imgUrl}
                          alt=""
                          width={64}
                          height={64}
                          style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 2 }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 64,
                            height: 64,
                            background: "#1a1a1a",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#d91920",
                            fontSize: "1.5rem",
                            borderRadius: 2,
                            fontFamily: "var(--font-display)",
                          }}
                        >
                          {initial}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-zinc-100">{title}</p>
                      <p className="text-xs text-zinc-500">Talla: {line.size?.name ?? "—"}</p>
                      <p className="mt-1 text-sm text-zinc-400">
                        {formatCop(line.unitPrice)}
                        {line.quantity > 1 ? ` c/u` : ""}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="text-xs text-zinc-500">Cantidad:</span>
                        <input
                          type="number"
                          min={1}
                          className="input-brand w-20 py-1 text-sm"
                          value={qtyDraft[line.id] ?? ""}
                          onChange={(e) =>
                            setQtyDraft((prev) => ({ ...prev, [line.id]: e.target.value }))
                          }
                        />
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void submitItemQty(line.id)}
                          className="rounded border border-brand-yellow/50 px-2 py-1 text-sm text-brand-yellow hover:bg-brand-yellow/10"
                          title="Aplicar cantidad"
                        >
                          ✓
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void removeItem(line.id)}
                          className="rounded border border-brand-red/50 px-2 py-1 text-sm text-brand-red hover:bg-brand-red/10"
                          title="Eliminar"
                        >
                          ×
                        </button>
                      </div>
                      <p className="mt-2 font-display text-brand-yellow">
                        Subtotal {formatCop(lineSub)}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            onClick={() => void openAddModal()}
            className="btn-brand-outline mt-6 w-full"
          >
            + Agregar producto
          </button>
          <div className="mt-6 border-t border-brand-border pt-4">
            <p className="text-xs font-semibold uppercase text-zinc-500">Total</p>
            <p className="font-display text-3xl text-brand-yellow">{formatCop(total)}</p>
          </div>
        </div>
      </div>

      {addOpen ? (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="panel-brand max-h-[90vh] w-full max-w-md overflow-y-auto p-6">
            <h2 className="font-display text-xl uppercase text-white">Agregar producto</h2>
            {catalogLoading ? (
              <p className="mt-4 text-zinc-500">Cargando…</p>
            ) : (
              <>
                <label className="mt-4 block text-xs text-zinc-500" htmlFor="adm-add-prod">
                  Producto
                </label>
                <select
                  id="adm-add-prod"
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
                    <label className="mt-3 block text-xs text-zinc-500" htmlFor="adm-add-size">
                      Talla
                    </label>
                    <select
                      id="adm-add-size"
                      value={addSizeId}
                      onChange={(e) => setAddSizeId(e.target.value)}
                      className="select-brand mt-1 w-full"
                    >
                      <option value="">Elegir…</option>
                      {selectedCatalogProduct.sizes.map((s) => (
                        <option key={s.size.id} value={s.size.id} className="bg-brand-steel">
                          {s.size.name}
                        </option>
                      ))}
                    </select>
                  </>
                ) : null}
                <label className="mt-3 block text-xs text-zinc-500" htmlFor="adm-add-qty">
                  Cantidad
                </label>
                <input
                  id="adm-add-qty"
                  type="number"
                  min={1}
                  className="input-brand mt-1 w-full"
                  value={addQty}
                  onChange={(e) => setAddQty(e.target.value)}
                />
                {addErr ? (
                  <p className="mt-3 text-sm" style={{ color: "#d91920" }}>
                    {addErr}
                  </p>
                ) : null}
                <div className="mt-6 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={addSubmitting}
                    onClick={() => void confirmAdd()}
                    className="btn-brand disabled:opacity-50"
                  >
                    {addSubmitting ? "Agregando…" : "Confirmar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddOpen(false)}
                    className="rounded border border-brand-border px-4 py-2 text-sm text-zinc-300"
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
