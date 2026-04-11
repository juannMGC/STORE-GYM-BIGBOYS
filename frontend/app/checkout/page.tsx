"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch, formatShopApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { auth0LoginHref } from "@/lib/auth-routes";
import type { CartOrder } from "@/lib/types";

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
};

const WOMPI_SCRIPT_ID = "wompi-widget-js";

function formatCop(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

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

export default function CheckoutPage() {
  const { isLoggedIn, isLoading, displayName, user } = useAuth();
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

  const [wompiReady, setWompiReady] = useState(false);
  const skipShippingCompleteStep = useRef(false);

  useEffect(() => {
    skipShippingCompleteStep.current = false;
  }, [order?.id]);

  const load = useCallback(async () => {
    setError(null);
    setCartLoading(true);
    try {
      const data = await apiFetch<CartOrder | null>("/orders/cart");
      setOrder(data);
      if (data?.paymentMethod) setMethod(data.paymentMethod);
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
    setShippingDepartment(order.shippingDepartment?.trim() ?? "");
    setShippingCity(order.shippingCity?.trim() ?? "");
    setShippingNeighborhood(order.shippingNeighborhood?.trim() ?? "");
    setShippingAddress(order.shippingAddress?.trim() ?? "");
    setShippingComplement(order.shippingComplement?.trim() ?? "");
  }, [
    order?.id,
    order?.shippingEmail,
    order?.shippingDepartment,
    order?.shippingCity,
    order?.shippingNeighborhood,
    order?.shippingAddress,
    order?.shippingComplement,
    user?.email,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const existing = document.getElementById(WOMPI_SCRIPT_ID);
    if (existing) {
      setWompiReady(!!window.WidgetCheckout);
      return;
    }
    const s = document.createElement("script");
    s.id = WOMPI_SCRIPT_ID;
    s.src = "https://checkout.wompi.co/widget.js";
    s.async = true;
    s.onload = () => setWompiReady(true);
    s.onerror = () => setError("No se pudo cargar Wompi. Revisá tu conexión.");
    document.body.appendChild(s);
  }, []);

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
      setStep(2);
      setFieldErrors({});
    } catch (e) {
      setError(formatShopApiError(e, { sessionActive: true }));
    } finally {
      setShippingSaving(false);
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

  async function payWithWompi() {
    if (!order?.items.length) return;
    setSaving(true);
    setError(null);
    try {
      await apiFetch("/orders/cart/payment", {
        method: "PATCH",
        body: JSON.stringify({ paymentMethod: method }),
      });
      const subtotal = order.items.reduce(
        (s, i) => s + i.priceSnapshot * i.quantity,
        0,
      );
      const amountInCents = Math.round(subtotal * 100);
      if (amountInCents < 1) {
        setError("El total debe ser mayor a 0.");
        return;
      }
      const res = await apiFetch<WompiSigResponse>(`/orders/${order.id}/wompi-signature`, {
        method: "POST",
        body: JSON.stringify({
          currency: "COP",
          amountInCents,
          reference: order.id,
        }),
      });
      await load();
      if (!window.WidgetCheckout) {
        setError("El script de Wompi aún no cargó. Esperá unos segundos e intentá de nuevo.");
        return;
      }
      const checkout = new window.WidgetCheckout({
        currency: res.currency,
        amountInCents: res.amountInCents,
        reference: res.reference,
        publicKey: res.publicKey,
        signature: { integrity: res.signature },
        redirectUrl: `${window.location.origin}/pedido/confirmado?ref=${encodeURIComponent(res.reference)}`,
      });
      checkout.open(() => {});
    } catch (e) {
      setError(formatShopApiError(e, { sessionActive: true }));
    } finally {
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
        <p className="text-zinc-400">No hay productos para pagar.</p>
        <Link href="/tienda" className="mt-4 inline-block text-brand-yellow hover:underline">
          Ir a la tienda
        </Link>
      </div>
    );
  }

  const subtotal = order.items.reduce(
    (s, i) => s + i.priceSnapshot * i.quantity,
    0,
  );

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
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
            Elegí la forma de pago y pagá con Wompi (sandbox). El pedido queda en borrador hasta que el
            pago sea aprobado.
          </p>

          <div className="panel-brand mt-6 space-y-3 p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Resumen</p>
            <p className="text-sm text-zinc-300">
              <span className="text-zinc-500">Envío a:</span> {shippingCity}, {shippingDepartment} ·{" "}
              {shippingNeighborhood}
            </p>
            <p className="text-sm text-zinc-300">
              <span className="text-zinc-500">Dirección:</span> {shippingAddress}
              {shippingComplement.trim() ? ` · ${shippingComplement.trim()}` : ""}
            </p>
            <p className="text-sm text-zinc-300">
              <span className="text-zinc-500">Correo:</span> {shippingEmail.trim()}
            </p>
            <div className="border-t border-brand-border pt-3">
              <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
                Total estimado (COP)
              </p>
              <p className="font-display text-3xl text-brand-yellow">{formatCop(subtotal)}</p>
            </div>
          </div>

          <div className="mt-8">
            <label className="block text-sm font-medium text-zinc-300">
              Forma de pago (referencia interna)
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="select-brand mt-2 w-full"
            >
              {METHODS.map((m) => (
                <option key={m.value} value={m.value} className="bg-brand-steel">
                  {m.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={saving}
              onClick={() => void savePayment()}
              className="mt-3 text-sm font-medium text-brand-yellow hover:underline"
            >
              Guardar forma de pago
            </button>
          </div>

          {error ? <p className="mt-4 text-sm text-brand-red">{error}</p> : null}

          <button
            type="button"
            disabled={saving || !wompiReady}
            onClick={() => void payWithWompi()}
            className="btn-brand mt-8 w-full disabled:opacity-50"
          >
            {saving ? "Procesando…" : !wompiReady ? "Cargando Wompi…" : "Pagar con Wompi"}
          </button>

          <button
            type="button"
            onClick={() => {
              skipShippingCompleteStep.current = true;
              setStep(1);
              setError(null);
            }}
            className="mt-6 w-full text-center text-sm text-zinc-400 hover:text-brand-yellow"
          >
            ← Volver a datos de envío
          </button>
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
