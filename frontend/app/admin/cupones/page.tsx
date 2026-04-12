"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BackButton } from "@/components/back-button";
import { AdminTableSkeleton } from "@/components/admin/table-skeleton";
import { apiFetch, ApiError } from "@/lib/api-client";

type CouponRow = {
  id: string;
  code: string;
  type: string;
  value: number;
  minPurchase: number;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
  expiresAt: string | null;
  createdAt: string;
  _count: { orders: number };
};

type FormFeedback = { type: "ok" | "err"; text: string } | null;

export default function AdminCuponesPage() {
  const [rows, setRows] = useState<CouponRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [code, setCode] = useState("");
  const [type, setType] = useState<"PERCENT" | "FIXED">("PERCENT");
  const [value, setValue] = useState("");
  const [minPurchase, setMinPurchase] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [active, setActive] = useState(true);
  const [formFeedback, setFormFeedback] = useState<FormFeedback>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const data = await apiFetch<CouponRow[]>("/coupons");
      setRows(data);
    } catch (e) {
      setListError(e instanceof ApiError ? e.message : "No se pudieron cargar los cupones");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setCode("");
    setType("PERCENT");
    setValue("");
    setMinPurchase("");
    setMaxUses("");
    setExpiresAt("");
    setActive(true);
    setFormFeedback(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
  }

  async function submitCreate() {
    setFormFeedback(null);
    const codeTrim = code.trim().toUpperCase();
    if (codeTrim.length < 3) {
      setFormFeedback({ type: "err", text: "El código debe tener al menos 3 caracteres." });
      return;
    }
    const val = Number(value);
    if (!Number.isFinite(val) || val < 0) {
      setFormFeedback({ type: "err", text: "Valor inválido." });
      return;
    }
    setSaving(true);
    try {
      await apiFetch("/coupons", {
        method: "POST",
        body: JSON.stringify({
          code: codeTrim,
          type,
          value: val,
          minPurchase: minPurchase.trim() === "" ? 0 : Number(minPurchase),
          maxUses: maxUses.trim() === "" ? undefined : Number(maxUses),
          expiresAt: expiresAt.trim() === "" ? undefined : new Date(expiresAt).toISOString(),
          active,
        }),
      });
      await load();
      closeModal();
    } catch (e) {
      setFormFeedback({
        type: "err",
        text: e instanceof ApiError ? e.message : "No se pudo crear el cupón",
      });
    } finally {
      setSaving(false);
    }
  }

  async function toggleRow(id: string) {
    try {
      await apiFetch(`/coupons/${id}/toggle`, { method: "PATCH" });
      await load();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Error");
    }
  }

  async function deleteRow(id: string, codeLabel: string) {
    if (!confirm(`¿Eliminar el cupón ${codeLabel}?`)) return;
    try {
      await apiFetch(`/coupons/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Error al eliminar");
    }
  }

  function formatValor(c: CouponRow): string {
    return c.type === "PERCENT" ? `${c.value}% off` : `-$${c.value.toLocaleString("es-CO")}`;
  }

  function formatUsos(c: CouponRow): string {
    if (c.maxUses == null) return `${c.usedCount} / ∞`;
    return `${c.usedCount} / ${c.maxUses}`;
  }

  function usoPct(c: CouponRow): number {
    if (c.maxUses == null || c.maxUses <= 0) return 0;
    return Math.min(100, (c.usedCount / c.maxUses) * 100);
  }

  return (
    <div className="mx-auto max-w-5xl px-2 py-6 md:px-0">
      <div style={{ padding: "8px 0 16px" }}>
        <BackButton href="/admin" label="← Panel admin" />
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl uppercase tracking-wide text-white md:text-4xl">
          Cupones de descuento
        </h1>
        <button type="button" onClick={openCreate} className="btn-brand shrink-0">
          + Nuevo
        </button>
      </div>

      {listError ? (
        <p className="mb-4 text-sm text-brand-red">{listError}</p>
      ) : null}

      {loading ? (
        <AdminTableSkeleton />
      ) : rows.length === 0 ? (
        <p className="text-zinc-500">No hay cupones. Creá el primero con &quot;+ Nuevo&quot;.</p>
      ) : (
        <div className="panel-brand overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-brand-border text-xs uppercase tracking-wide text-zinc-500">
                <th className="p-3">Código</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Valor</th>
                <th className="p-3">Usos</th>
                <th className="p-3">Vence</th>
                <th className="p-3">Estado</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const expired = c.expiresAt ? new Date(c.expiresAt) < new Date() : false;
                return (
                  <tr key={c.id} className="border-b border-brand-border/60">
                    <td className="p-3 font-medium text-zinc-100">{c.code}</td>
                    <td className="p-3 text-zinc-400">{c.type === "PERCENT" ? "%" : "$"}</td>
                    <td className="p-3 text-brand-yellow">{formatValor(c)}</td>
                    <td className="p-3 text-zinc-300">
                      <div>{formatUsos(c)}</div>
                      {c.maxUses != null ? (
                        <div
                          className="mt-1 h-1.5 overflow-hidden rounded bg-brand-steel"
                          title={`${usoPct(c).toFixed(0)}%`}
                        >
                          <div
                            className="h-full bg-brand-red transition-all"
                            style={{ width: `${usoPct(c)}%` }}
                          />
                        </div>
                      ) : null}
                    </td>
                    <td
                      className={`p-3 text-xs ${expired ? "text-brand-red" : "text-zinc-400"}`}
                    >
                      {c.expiresAt
                        ? new Date(c.expiresAt).toLocaleString("es-CO", {
                            dateStyle: "short",
                          })
                        : "Sin vencimiento"}
                    </td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => void toggleRow(c.id)}
                        className={
                          c.active
                            ? "text-emerald-400 hover:underline"
                            : "text-zinc-500 hover:underline"
                        }
                      >
                        {c.active ? "✅ ON" : "❌ OFF"}
                      </button>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => void deleteRow(c.id, c.code)}
                        className="text-xs text-brand-red hover:underline"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-8 text-center text-sm text-zinc-500">
        <Link href="/admin" className="text-brand-yellow hover:underline">
          Volver al panel
        </Link>
      </p>

      {modalOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cupon-modal-title"
        >
          <div className="panel-brand max-h-[90vh] w-full max-w-md overflow-y-auto p-6">
            <h2 id="cupon-modal-title" className="font-display text-xl uppercase text-white">
              Nuevo cupón
            </h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs text-zinc-500">Código</label>
                <input
                  className="input-brand mt-1 w-full"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="BIGBOYS10"
                />
              </div>
              <div>
                <span className="text-xs text-zinc-500">Tipo</span>
                <div className="mt-2 flex gap-4">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-200">
                    <input
                      type="radio"
                      name="cupon-type"
                      checked={type === "PERCENT"}
                      onChange={() => setType("PERCENT")}
                    />
                    % Porcentaje
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-200">
                    <input
                      type="radio"
                      name="cupon-type"
                      checked={type === "FIXED"}
                      onChange={() => setType("FIXED")}
                    />
                    $ Monto fijo
                  </label>
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-500">
                  Valor ({type === "PERCENT" ? "ej: 10 = 10%" : "ej: 10000 = $10.000"})
                </label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  className="input-brand mt-1 w-full"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500">Compra mínima (opcional)</label>
                <input
                  type="number"
                  min={0}
                  className="input-brand mt-1 w-full"
                  value={minPurchase}
                  onChange={(e) => setMinPurchase(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500">Máximo de usos (vacío = ilimitado)</label>
                <input
                  type="number"
                  min={1}
                  className="input-brand mt-1 w-full"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500">Expira (opcional)</label>
                <input
                  type="datetime-local"
                  className="input-brand mt-1 w-full"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-200">
                <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
                Activo
              </label>
            </div>
            {formFeedback ? (
              <p
                className={`mt-3 text-sm ${formFeedback.type === "ok" ? "text-emerald-400" : "text-brand-red"}`}
              >
                {formFeedback.text}
              </p>
            ) : null}
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={closeModal} className="btn-brand-outline">
                Cancelar
              </button>
              <button type="button" disabled={saving} onClick={() => void submitCreate()} className="btn-brand">
                {saving ? "Guardando…" : "Crear"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
