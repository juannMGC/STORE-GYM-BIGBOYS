"use client";

import Link from "next/link";
import { BackButton } from "@/components/back-button";
import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch, formatShopApiError, ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { auth0LoginHref } from "@/lib/auth-routes";
import type { CartGetResponse, CartOrder } from "@/lib/types";
import { isCartOrderPayload } from "@/lib/types";

function CheckoutSkeleton() {
  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <div className="panel-brand animate-pulse space-y-6 p-8">
        <div className="h-10 w-48 rounded bg-brand-steel/40" />
        <div className="h-32 rounded bg-brand-steel/25" />
      </div>
    </div>
  );
}

const METHODS = [
  { value: "CASH", label: "Efectivo" },
  { value: "BANK_TRANSFER", label: "Transferencia bancaria" },
  { value: "CARD", label: "Tarjeta" },
] as const;

type WompiSigResponse = {
  signature: string;
  publicKey: string;
  reference: string;
  amountInCents: number;
  currency: "COP";
  redirectUrl: string;
};

const toNum = (val: unknown): number => {
  const n = Number(val);
  return isNaN(n) ? 0 : n;
};

/** Precios del resumen (API puede enviar números como string). */
const formatCOP = (val: unknown): string => {
  const n = toNum(val);
  return `$${n.toLocaleString("es-CO")}`;
};

function isValidEmail(s: string): boolean {
  const t = s.trim();
  if (!t) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
}

function shippingComplete(o: CartOrder): boolean {
  return !!(
    o.shippingEmail?.trim() &&
    o.shippingDepartment?.trim() &&
    o.shippingCity?.trim() &&
    o.shippingNeighborhood?.trim() &&
    o.shippingAddress?.trim()
  );
}

function cartLineImageUrl(item: CartOrder["items"][number]): string | undefined {
  const u = item.product?.images?.[0]?.url?.trim();
  return u || undefined;
}

function normAddr(s: string | null | undefined): string {
  return (s ?? "").trim();
}

function couponDescriptionLine(c: { type: string; value: number }): string {
  return c.type === "PERCENT"
    ? `${c.value}% de descuento`
    : `$${Number(c.value).toLocaleString("es-CO")} de descuento`;
}

export default function CheckoutPage() {
  const { isLoggedIn, isLoading, displayName, user, refreshUser } = useAuth();
  const [order, setOrder] = useState<CartOrder | null>(null);
  const [cartLoading, setCartLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [method, setMethod] = useState<string>("BANK_TRANSFER");
  const [saving, setSaving] = useState(false);
  const [shippingSaving, setShippingSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [shippingEmail, setShippingEmail] = useState("");
  const [shippingDepartment, setShippingDepartment] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingNeighborhood, setShippingNeighborhood] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingComplement, setShippingComplement] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [dismissSaveAddressOffer, setDismissSaveAddressOffer] = useState(false);
  const [savingProfileAddress, setSavingProfileAddress] = useState(false);

  const [codigoCupon, setCodigoCupon] = useState("");
  const [aplicandoCupon, setAplicandoCupon] = useState(false);
  const [cuponError, setCuponError] = useState("");

  const skipShippingCompleteStep = useRef(false);

  useEffect(() => {
    skipShippingCompleteStep.current = false;
  }, [order?.id]);

  const load = useCallback(async () => {
    setError(null);
    setCartLoading(true);
    try {
      const data = await apiFetch<CartGetResponse>("/orders/cart");
      if (isCartOrderPayload(data)) {
        setOrder(data);
        if (data.paymentMethod) setMethod(data.paymentMethod);
      } else {
        setOrder(null);
      }
    } catch (e) {
      setError(formatShopApiError(e, { sessionActive: true }));
    } finally {
      setCartLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!isLoggedIn) {
      setOrder(null);
      return;
    }
    void load();
  }, [isLoading, isLoggedIn, load]);

  useEffect(() => {
    if (!order) return;
    if (skipShippingCompleteStep.current) return;
    if (shippingComplete(order)) setStep(2);
    else setStep(1);
  }, [
    order?.id,
    order?.shippingEmail,
    order?.shippingDepartment,
    order?.shippingCity,
    order?.shippingNeighborhood,
    order?.shippingAddress,
  ]);

  useEffect(() => {
    if (!order) return;
    setShippingEmail((prev) => order.shippingEmail?.trim() || prev || user?.email?.trim() || "");
    setShippingDepartment((prev) => {
      const o = order.shippingDepartment?.trim();
      if (o) return o;
      const u = user?.department?.trim();
      if (u) return u;
      return prev;
    });
    setShippingCity((prev) => {
      const o = order.shippingCity?.trim();
      if (o) return o;
      const u = user?.city?.trim();
      if (u) return u;
      return prev;
    });
    setShippingNeighborhood((prev) => {
      const o = order.shippingNeighborhood?.trim();
      if (o) return o;
      const u = user?.neighborhood?.trim();
      if (u) return u;
      return prev;
    });
    setShippingAddress((prev) => {
      const o = order.shippingAddress?.trim();
      if (o) return o;
      const u = user?.address?.trim();
      if (u) return u;
      return prev;
    });
    setShippingComplement((prev) => {
      const o = order.shippingComplement?.trim();
      if (o) return o;
      const u = user?.complement?.trim();
      if (u) return u;
      return prev;
    });
  }, [
    order?.id,
    order?.shippingEmail,
    order?.shippingDepartment,
    order?.shippingCity,
    order?.shippingNeighborhood,
    order?.shippingAddress,
    order?.shippingComplement,
    user?.email,
    user?.department,
    user?.city,
    user?.neighborhood,
    user?.address,
    user?.complement,
  ]);

  function validateShipping(): boolean {
    const next: Record<string, string> = {};
    if (!isValidEmail(shippingEmail)) {
      next.shippingEmail = shippingEmail.trim() === "" ? "El correo es obligatorio" : "Correo no válido";
    }
    if (!shippingDepartment.trim()) next.shippingDepartment = "El departamento es obligatorio";
    if (!shippingCity.trim()) next.shippingCity = "La ciudad es obligatoria";
    if (!shippingNeighborhood.trim()) next.shippingNeighborhood = "El barrio es obligatorio";
    if (!shippingAddress.trim()) next.shippingAddress = "La dirección es obligatoria";
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function continueToPayment() {
    if (!order) return;
    setError(null);
    if (!validateShipping()) return;
    setShippingSaving(true);
    try {
      const updated = await apiFetch<CartOrder>(`/orders/${order.id}/shipping`, {
        method: "PATCH",
        body: JSON.stringify({
          shippingEmail: shippingEmail.trim(),
          shippingDepartment: shippingDepartment.trim(),
          shippingCity: shippingCity.trim(),
          shippingNeighborhood: shippingNeighborhood.trim(),
          shippingAddress: shippingAddress.trim(),
          shippingComplement: shippingComplement.trim() || undefined,
        }),
      });
      setOrder(updated);
      skipShippingCompleteStep.current = false;
      setDismissSaveAddressOffer(false);
      setStep(2);
      setFieldErrors({});
    } catch (e) {
      setError(formatShopApiError(e, { sessionActive: true }));
    } finally {
      setShippingSaving(false);
    }
  }

  async function guardarDireccionEnPerfil() {
    setSavingProfileAddress(true);
    setError(null);
    try {
      await apiFetch("/users/me", {
        method: "PATCH",
        body: JSON.stringify({
          address: normAddr(shippingAddress),
          city: normAddr(shippingCity),
          department: normAddr(shippingDepartment),
          neighborhood: normAddr(shippingNeighborhood),
          complement: normAddr(shippingComplement) || undefined,
        }),
      });
      await refreshUser();
      setDismissSaveAddressOffer(true);
    } catch (e) {
      setError(formatShopApiError(e, { sessionActive: true }));
    } finally {
      setSavingProfileAddress(false);
    }
  }

  async function savePayment() {
    setSaving(true);
    setError(null);
    try {
      await apiFetch("/orders/cart/payment", {
        method: "PATCH",
        body: JSON.stringify({ paymentMethod: method }),
      });
      await load();
    } catch (e) {
      setError(formatShopApiError(e, { sessionActive: true }));
    } finally {
      setSaving(false);
    }
  }

  async function handleAplicarCupon() {
    if (!order?.id || !codigoCupon.trim()) return;
    setCuponError("");
    setAplicandoCupon(true);
    try {
      const data = await apiFetch<{
        description: string;
        discountAmount: number;
        finalTotal: number;
        code: string;
        order: CartOrder;
      }>("/coupons/apply", {
        method: "POST",
        body: JSON.stringify({
          orderId: order.id,
          code: codigoCupon.trim(),
        }),
      });
      setOrder(data.order);
      setCodigoCupon("");
    } catch (err: unknown) {
      setCuponError(err instanceof ApiError ? err.message : "Cupón inválido");
    } finally {
      setAplicandoCupon(false);
    }
  }

  async function handleRemoverCupon() {
    if (!order?.id) return;
    setCuponError("");
    try {
      await apiFetch<CartOrder>(`/coupons/remove/${order.id}`, {
        method: "DELETE",
      });
      await load();
    } catch {
      setCuponError("Error al remover el cupón");
    }
  }

  async function payWithWompi() {
    if (!order?.items.length) return;
    setSaving(true);
    setError(null);
    try {
      await apiFetch("/orders/cart/payment", {
        method: "PATCH",
        body: JSON.stringify({ paymentMethod: method }),
      });
      const res = await apiFetch<WompiSigResponse>(`/orders/${order.id}/wompi-signature`, {
        method: "POST",
      });
      const form = document.createElement("form");
      form.method = "GET";
      form.action = "https://checkout.wompi.co/p/";
      const fields: Record<string, string> = {
        "public-key": res.publicKey,
        currency: res.currency,
        "amount-in-cents": String(res.amountInCents),
        reference: res.reference,
        "signature:integrity": res.signature,
        "redirect-url": res.redirectUrl,
      };
      for (const [key, value] of Object.entries(fields)) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value;
        form.appendChild(input);
      }
      document.body.appendChild(form);
      form.submit();
    } catch (e) {
      setError(formatShopApiError(e, { sessionActive: true }));
      setSaving(false);
    }
  }

  if (isLoading) {
    return <CheckoutSkeleton />;
  }

  if (!isLoggedIn) {
    const loginHref = auth0LoginHref("/checkout", "login");
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div
          style={{ padding: "16px 0 8px", marginBottom: "8px" }}
          className="text-left"
        >
          <BackButton href="/carrito" label="← Volver al carrito" />
        </div>
        <h1 className="font-display text-3xl uppercase text-white">Checkout</h1>
        <p className="mt-4 text-zinc-400">
          Iniciá sesión para completar el pago.
        </p>
        <a href={loginHref} className="btn-brand mt-8 inline-flex">
          Iniciar sesión
        </a>
      </div>
    );
  }

  if (cartLoading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-zinc-500">Cargando…</div>
    );
  }

  if (!order || order.items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div
          style={{ padding: "16px 0 8px", marginBottom: "8px" }}
          className="text-left"
        >
          <BackButton href="/carrito" label="← Volver al carrito" />
        </div>
        <p className="text-zinc-400">No hay productos para pagar.</p>
        <Link href="/tienda" className="mt-4 inline-block text-brand-yellow hover:underline">
          Ir a la tienda
        </Link>
      </div>
    );
  }

  const subtotal = order.items.reduce((sum, item) => {
    const unit = toNum(
      (item as { unitPrice?: unknown }).unitPrice ?? item.priceSnapshot,
    );
    return sum + unit * toNum(item.quantity);
  }, 0);

  const discountAmt = Math.max(0, toNum(order.discountAmount));
  const totalConCupon = Math.max(0, subtotal - discountAmt);
  const cuponActivo = Boolean(order.coupon && discountAmt > 0);

  const shipCity = order.shippingCity?.trim() || shippingCity.trim();
  const shipDept = order.shippingDepartment?.trim() || shippingDepartment.trim();
  const shipAddr = order.shippingAddress?.trim() || shippingAddress.trim();
  const shipBarrio = order.shippingNeighborhood?.trim() || shippingNeighborhood.trim();
  const shipComp = order.shippingComplement?.trim() || shippingComplement.trim();
  const shipMail = order.shippingEmail?.trim() || shippingEmail.trim();

  const tieneDireccionGuardada = !!(user?.address?.trim() && user?.city?.trim());
  const profileMatchesShipping =
    !!user &&
    normAddr(shippingDepartment) === normAddr(user.department) &&
    normAddr(shippingCity) === normAddr(user.city) &&
    normAddr(shippingNeighborhood) === normAddr(user.neighborhood) &&
    normAddr(shippingAddress) === normAddr(user.address) &&
    normAddr(shippingComplement) === normAddr(user.complement);
  const direccionCambio = !!user && !profileMatchesShipping;

  return (
    <div
      className={
        step === 2
          ? "checkout-page-wrap mx-auto max-w-[1100px] px-4 py-10"
          : "checkout-page-wrap mx-auto max-w-lg px-4 py-10 md:max-w-[1100px]"
      }
    >
      <div style={{ padding: "16px 0 8px", marginBottom: "8px" }}>
        <BackButton href="/carrito" label="← Volver al carrito" />
      </div>
      <h1 className="font-display text-5xl uppercase tracking-wide text-white">Checkout</h1>
      {displayName ? (
        <p className="mt-1 text-sm text-zinc-500">Pedido de {displayName}</p>
      ) : null}

      <nav
        className="mt-6 flex flex-wrap items-center gap-2 text-sm font-medium"
        aria-label="Pasos del checkout"
      >
        <span
          className={
            step === 1
              ? "rounded-sm border-2 border-brand-yellow bg-brand-yellow/10 px-3 py-1.5 text-brand-yellow"
              : "rounded-sm border border-brand-border px-3 py-1.5 text-zinc-500"
          }
        >
          1. Datos de envío
        </span>
        <span className="text-zinc-600" aria-hidden>
          →
        </span>
        <span
          className={
            step === 2
              ? "rounded-sm border-2 border-brand-yellow bg-brand-yellow/10 px-3 py-1.5 text-brand-yellow"
              : "rounded-sm border border-brand-border px-3 py-1.5 text-zinc-500"
          }
        >
          2. Método de pago
        </span>
      </nav>

      {step === 1 ? (
        <>
          <p className="mt-4 text-zinc-400">
            Completá los datos de envío. Luego elegís la forma de pago y podés pagar con Wompi.
          </p>

          {tieneDireccionGuardada ? (
            <div
              style={{
                padding: "12px 16px",
                background: "#1a1a1a",
                border: "1px solid #2a2a2a",
                borderLeft: "3px solid #22c55e",
                marginTop: "16px",
                marginBottom: "4px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <div>
                <p
                  style={{
                    color: "#22c55e",
                    fontSize: "12px",
                    fontFamily: "var(--font-display)",
                    letterSpacing: "1px",
                    marginBottom: "2px",
                  }}
                >
                  ✓ DIRECCIÓN DE PERFIL CARGADA
                </p>
                <p style={{ color: "#a1a1aa", fontSize: "13px" }}>
                  {user!.address}, {user!.city}
                </p>
              </div>
              <Link
                href="/perfil"
                style={{
                  color: "#f7e047",
                  fontSize: "12px",
                  textDecoration: "none",
                  fontFamily: "var(--font-display)",
                  letterSpacing: "1px",
                  whiteSpace: "nowrap",
                }}
              >
                Editar →
              </Link>
            </div>
          ) : (
            <div
              style={{
                padding: "12px 16px",
                background: "#1a1a1a",
                border: "1px solid #2a2a2a",
                borderLeft: "3px solid #f7e047",
                marginTop: "16px",
                marginBottom: "4px",
              }}
            >
              <p
                style={{
                  color: "#f7e047",
                  fontSize: "12px",
                  fontFamily: "var(--font-display)",
                  letterSpacing: "1px",
                  marginBottom: "4px",
                }}
              >
                💡 GUARDÁ TU DIRECCIÓN
              </p>
              <p style={{ color: "#a1a1aa", fontSize: "13px" }}>
                Guardá tu dirección en{" "}
                <Link href="/perfil" style={{ color: "#f7e047" }}>
                  tu perfil
                </Link>{" "}
                para no completarla cada vez.
              </p>
            </div>
          )}

          <div className="panel-brand mt-6 space-y-4 p-6">
            <div>
              <label htmlFor="ship-email" className="text-sm font-medium text-zinc-300">
                Correo electrónico <span className="text-brand-red">*</span>
              </label>
              <input
                id="ship-email"
                type="email"
                autoComplete="email"
                className="input-brand mt-1 w-full"
                value={shippingEmail}
                onChange={(e) => {
                  setShippingEmail(e.target.value);
                  setFieldErrors((f) => {
                    const n = { ...f };
                    delete n.shippingEmail;
                    return n;
                  });
                }}
              />
              {fieldErrors.shippingEmail ? (
                <p className="mt-1 text-xs text-brand-red">{fieldErrors.shippingEmail}</p>
              ) : null}
            </div>
            <div>
              <label htmlFor="ship-dept" className="text-sm font-medium text-zinc-300">
                Departamento <span className="text-brand-red">*</span>
              </label>
              <input
                id="ship-dept"
                type="text"
                className="input-brand mt-1 w-full"
                placeholder="ej: Caldas"
                value={shippingDepartment}
                onChange={(e) => {
                  setShippingDepartment(e.target.value);
                  setFieldErrors((f) => {
                    const n = { ...f };
                    delete n.shippingDepartment;
                    return n;
                  });
                }}
              />
              {fieldErrors.shippingDepartment ? (
                <p className="mt-1 text-xs text-brand-red">{fieldErrors.shippingDepartment}</p>
              ) : null}
            </div>
            <div>
              <label htmlFor="ship-city" className="text-sm font-medium text-zinc-300">
                Ciudad <span className="text-brand-red">*</span>
              </label>
              <input
                id="ship-city"
                type="text"
                className="input-brand mt-1 w-full"
                placeholder="ej: Manizales"
                value={shippingCity}
                onChange={(e) => {
                  setShippingCity(e.target.value);
                  setFieldErrors((f) => {
                    const n = { ...f };
                    delete n.shippingCity;
                    return n;
                  });
                }}
              />
              {fieldErrors.shippingCity ? (
                <p className="mt-1 text-xs text-brand-red">{fieldErrors.shippingCity}</p>
              ) : null}
            </div>
            <div>
              <label htmlFor="ship-barrio" className="text-sm font-medium text-zinc-300">
                Barrio <span className="text-brand-red">*</span>
              </label>
              <input
                id="ship-barrio"
                type="text"
                className="input-brand mt-1 w-full"
                value={shippingNeighborhood}
                onChange={(e) => {
                  setShippingNeighborhood(e.target.value);
                  setFieldErrors((f) => {
                    const n = { ...f };
                    delete n.shippingNeighborhood;
                    return n;
                  });
                }}
              />
              {fieldErrors.shippingNeighborhood ? (
                <p className="mt-1 text-xs text-brand-red">{fieldErrors.shippingNeighborhood}</p>
              ) : null}
            </div>
            <div>
              <label htmlFor="ship-addr" className="text-sm font-medium text-zinc-300">
                Dirección <span className="text-brand-red">*</span>
              </label>
              <input
                id="ship-addr"
                type="text"
                className="input-brand mt-1 w-full"
                placeholder="ej: Calle 50 # 23-45"
                value={shippingAddress}
                onChange={(e) => {
                  setShippingAddress(e.target.value);
                  setFieldErrors((f) => {
                    const n = { ...f };
                    delete n.shippingAddress;
                    return n;
                  });
                }}
              />
              {fieldErrors.shippingAddress ? (
                <p className="mt-1 text-xs text-brand-red">{fieldErrors.shippingAddress}</p>
              ) : null}
            </div>
            <div>
              <label htmlFor="ship-comp" className="text-sm font-medium text-zinc-300">
                Torre / Apto / Conjunto / Oficina / Condominio
              </label>
              <input
                id="ship-comp"
                type="text"
                className="input-brand mt-1 w-full"
                value={shippingComplement}
                onChange={(e) => setShippingComplement(e.target.value)}
              />
            </div>
          </div>

          {error ? <p className="mt-4 text-sm text-brand-red">{error}</p> : null}

          <button
            type="button"
            disabled={shippingSaving}
            onClick={() => void continueToPayment()}
            className="btn-brand mt-8 w-full disabled:opacity-50"
          >
            {shippingSaving ? "Guardando…" : "Continuar al pago →"}
          </button>
        </>
      ) : (
        <>
          <p className="mt-4 text-zinc-400">
            Revisá el detalle del pedido y elegí la forma de pago. Podés pagar con Wompi (sandbox); el
            pedido queda en borrador hasta que el pago sea aprobado.
          </p>

          <div className="checkout-grid mt-6 grid grid-cols-1 gap-8 md:grid-cols-2 md:items-start">
            <div className="checkout-summary order-1 panel-brand p-6 md:order-2">
              <p className="font-display text-lg uppercase tracking-wide text-brand-yellow">
                Resumen del pedido
              </p>
              <ul className="mt-4 space-y-4">
                {order.items.map((item) => {
                  const imgUrl = cartLineImageUrl(item);
                  const title =
                    item.product?.title ??
                    (item.product as { name?: string } | undefined)?.name ??
                    "Producto";
                  const initial = (title.charAt(0) || "?").toUpperCase();
                  const unitPrice = toNum(
                    (item as { unitPrice?: unknown }).unitPrice ??
                      item.priceSnapshot,
                  );
                  const qty = toNum(item.quantity);
                  const lineSub = unitPrice * qty;
                  return (
                    <li
                      key={item.id}
                      className="flex gap-3 border-b border-brand-border pb-4 last:border-0 last:pb-0"
                    >
                      <div className="shrink-0">
                        {imgUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={imgUrl}
                            alt=""
                            style={{
                              width: 64,
                              height: 64,
                              objectFit: "cover",
                              borderRadius: 2,
                              border: "1px solid #2a2a2a",
                            }}
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
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
                              border: "1px solid #2a2a2a",
                              fontFamily: "var(--font-display)",
                            }}
                          >
                            {initial}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 text-sm">
                        <p className="font-semibold text-zinc-100">{title}</p>
                        <p className="text-xs text-zinc-500">
                          Talla: {item.size?.name ?? "—"}
                        </p>
                        <p className="mt-1 text-zinc-400">
                          Cantidad: {qty} · Unit. {formatCOP(unitPrice)}
                        </p>
                        <p className="mt-1 font-display text-base" style={{ color: "#f7e047" }}>
                          Subtotal {formatCOP(lineSub)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div
                style={{
                  marginTop: "20px",
                  marginBottom: "20px",
                  padding: "16px",
                  background: "#111111",
                  border: "1px solid #2a2a2a",
                }}
              >
                <p
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "#f7e047",
                    fontSize: "11px",
                    letterSpacing: "3px",
                    textTransform: "uppercase",
                    marginBottom: "12px",
                  }}
                >
                  🏷️ Cupón de descuento
                </p>

                {cuponActivo && order.coupon ? (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 14px",
                      background: "rgba(34,197,94,0.1)",
                      border: "1px solid #22c55e",
                      gap: "8px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          color: "#22c55e",
                          fontSize: "13px",
                          fontFamily: "var(--font-display)",
                          letterSpacing: "2px",
                          margin: "0 0 2px",
                        }}
                      >
                        ✓ {order.coupon.code}
                      </p>
                      <p style={{ color: "#a1a1aa", fontSize: "12px", margin: 0 }}>
                        {couponDescriptionLine(order.coupon)}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p
                        style={{
                          color: "#22c55e",
                          fontFamily: "var(--font-display)",
                          fontSize: "14px",
                          margin: "0 0 4px",
                        }}
                      >
                        -{formatCOP(discountAmt)}
                      </p>
                      <button
                        type="button"
                        onClick={() => void handleRemoverCupon()}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#d91920",
                          cursor: "pointer",
                          fontSize: "11px",
                          fontFamily: "var(--font-display)",
                          letterSpacing: "1px",
                          padding: 0,
                        }}
                      >
                        × Remover
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        type="text"
                        value={codigoCupon}
                        onChange={(e) => {
                          setCodigoCupon(e.target.value.toUpperCase());
                          setCuponError("");
                        }}
                        placeholder="BIGBOYS10"
                        className="input-brand"
                        style={{
                          flex: 1,
                          fontFamily: "var(--font-display)",
                          letterSpacing: "2px",
                          textTransform: "uppercase",
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void handleAplicarCupon();
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => void handleAplicarCupon()}
                        disabled={!codigoCupon.trim() || aplicandoCupon}
                        className="btn-brand"
                        style={{ flexShrink: 0, padding: "0 16px" }}
                      >
                        {aplicandoCupon ? "…" : "Aplicar"}
                      </button>
                    </div>
                    {cuponError ? (
                      <p style={{ color: "#d91920", fontSize: "12px", marginTop: "6px" }}>
                        ⚠️ {cuponError}
                      </p>
                    ) : null}
                  </div>
                )}
              </div>

              <div style={{ marginTop: "16px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "8px 0",
                    borderBottom: "1px solid #2a2a2a",
                  }}
                >
                  <span style={{ color: "#a1a1aa" }}>Subtotal</span>
                  <span style={{ color: "#e4e4e7" }}>${subtotal.toLocaleString("es-CO")}</span>
                </div>

                {cuponActivo && order.coupon ? (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "8px 0",
                      borderBottom: "1px solid #2a2a2a",
                    }}
                  >
                    <span style={{ color: "#22c55e" }}>Descuento ({order.coupon.code})</span>
                    <span style={{ color: "#22c55e" }}>-${discountAmt.toLocaleString("es-CO")}</span>
                  </div>
                ) : null}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "12px",
                    background: "#1a1a1a",
                    marginTop: "4px",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      color: "#f7e047",
                      fontSize: "14px",
                      letterSpacing: "2px",
                      textTransform: "uppercase",
                    }}
                  >
                    TOTAL
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      color: "#f7e047",
                      fontSize: "20px",
                      letterSpacing: "2px",
                    }}
                  >
                    ${totalConCupon.toLocaleString("es-CO")}
                  </span>
                </div>
              </div>
              <div className="mt-6 space-y-2 border-t border-brand-border pt-4 text-sm text-zinc-300">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Envío a
                </p>
                <p>
                  {shipCity}, {shipDept}
                  {shipBarrio ? ` · ${shipBarrio}` : ""}
                </p>
                <p className="text-zinc-400">
                  {shipAddr}
                  {shipComp ? ` · ${shipComp}` : ""}
                </p>
                {shipMail ? (
                  <p className="text-zinc-500">
                    <span className="text-zinc-600">Correo:</span> {shipMail}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="checkout-form order-2 panel-brand p-6 md:order-1">
              <p className="font-display text-lg uppercase tracking-wide text-brand-yellow">
                Método de pago
              </p>

              {direccionCambio && !dismissSaveAddressOffer ? (
                <div
                  style={{
                    padding: "16px",
                    background: "#1a1a1a",
                    border: "1px solid #2a2a2a",
                    marginTop: "16px",
                  }}
                >
                  <p style={{ color: "#e4e4e7", fontSize: "14px", marginBottom: "12px" }}>
                    ¿Querés guardar esta dirección en tu perfil?
                  </p>
                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => void guardarDireccionEnPerfil()}
                      disabled={savingProfileAddress}
                      className="btn-brand"
                      style={{ fontSize: "13px" }}
                    >
                      {savingProfileAddress ? "Guardando…" : "Sí, guardar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDismissSaveAddressOffer(true)}
                      className="btn-brand-outline"
                      style={{ fontSize: "13px" }}
                    >
                      No, gracias
                    </button>
                  </div>
                </div>
              ) : null}

              <fieldset className="mt-4 space-y-3">
                <legend className="sr-only">Forma de pago</legend>
                {METHODS.map((m) => (
                  <label
                    key={m.value}
                    className={
                      "flex cursor-pointer items-center gap-3 rounded-sm border px-3 py-2.5 hover:bg-brand-black/40 " +
                      (method === m.value
                        ? "border-brand-yellow/60 bg-brand-yellow/5"
                        : "border-brand-border")
                    }
                  >
                    <input
                      type="radio"
                      name="checkout-payment-method"
                      value={m.value}
                      checked={method === m.value}
                      onChange={() => setMethod(m.value)}
                      className="h-4 w-4 shrink-0 accent-brand-yellow"
                    />
                    <span className="text-sm text-zinc-200">{m.label}</span>
                  </label>
                ))}
              </fieldset>
              <button
                type="button"
                disabled={saving}
                onClick={() => void savePayment()}
                className="mt-4 text-sm font-medium text-brand-yellow hover:underline"
              >
                Solo guardar forma de pago
              </button>

              {error ? <p className="mt-4 text-sm text-brand-red">{error}</p> : null}

              <button
                type="button"
                disabled={saving}
                onClick={() => void payWithWompi()}
                className="btn-brand mt-6 w-full disabled:opacity-50"
              >
                {saving ? "Iniciando pago…" : "💳 Pagar con Wompi"}
              </button>

              <button
                type="button"
                onClick={() => {
                  skipShippingCompleteStep.current = true;
                  setStep(1);
                  setError(null);
                }}
                className="mt-4 w-full text-center text-sm text-zinc-400 hover:text-brand-yellow"
              >
                ← Volver a datos de envío
              </button>
            </div>
          </div>
        </>
      )}

      <Link
        href="/carrito"
        className="mt-4 block text-center text-sm text-zinc-500 hover:text-brand-yellow"
      >
        Volver al carrito
      </Link>
    </div>
  );
}
