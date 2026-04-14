"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { ApiError, apiFetch } from "@/lib/api-client";

type Stats = {
  totalSubscriptions: number;
  totalUsers: number;
};

const labelStyle: CSSProperties = {
  display: "block",
  marginBottom: "6px",
  fontSize: "11px",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "#71717a",
};

export default function AdminNotificacionesPage() {
  const [form, setForm] = useState({
    title: "",
    body: "",
    url: "/tienda",
    notifType: "PROMO" as "PROMO" | "SYSTEM" | "ORDER",
  });
  const [sending, setSending] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void apiFetch<Stats>("/notifications/stats")
      .then(setStats)
      .catch(() => {});
  }, []);

  const handleBroadcast = async () => {
    if (!form.title.trim() || !form.body.trim()) return;
    const n = stats?.totalUsers ?? 0;
    if (
      !confirm(
        n > 0
          ? `¿Enviar notificación a ${n} usuario${n !== 1 ? "s" : ""} (${stats?.totalSubscriptions ?? 0} dispositivo${(stats?.totalSubscriptions ?? 0) !== 1 ? "s" : ""})?`
          : "¿Enviar notificación? (no hay suscriptores registrados)",
      )
    ) {
      return;
    }

    setSending(true);
    setError(null);
    try {
      await apiFetch("/notifications/broadcast", {
        method: "POST",
        body: JSON.stringify({
          title: form.title.trim(),
          body: form.body.trim(),
          url: form.url.trim() || "/tienda",
          notifType: form.notifType,
        }),
      });
      setSent(true);
      setForm({ title: "", body: "", url: "/tienda", notifType: "PROMO" });
      setTimeout(() => setSent(false), 5000);
      void apiFetch<Stats>("/notifications/stats").then(setStats).catch(() => {});
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Error al enviar notificación");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="font-display text-3xl uppercase tracking-wide text-white md:text-4xl">
        🔔 Notificaciones push
      </h1>
      <p className="mt-2 text-sm text-zinc-500">
        Enviá ofertas a quienes activaron notificaciones en el navegador (Web Push, sin Firebase).
      </p>

      <div
        className="panel-brand mt-8"
        style={{ padding: "20px", marginBottom: "24px", border: "1px solid #2a2a2a" }}
      >
        <p className="font-display text-xs uppercase tracking-wider text-brand-yellow">Resumen</p>
        <p className="mt-3 text-sm text-zinc-300">
          Suscriptores activos:{" "}
          <span className="font-semibold text-white">{stats?.totalUsers ?? "—"}</span>
        </p>
        <p className="mt-1 text-sm text-zinc-300">
          Dispositivos totales:{" "}
          <span className="font-semibold text-white">{stats?.totalSubscriptions ?? "—"}</span>
        </p>
      </div>

      <div className="panel-brand space-y-4" style={{ padding: "24px" }}>
        <p className="font-display text-xs uppercase tracking-wider text-brand-yellow">Enviar oferta especial</p>

        <div>
          <label className="mb-1 block text-xs uppercase tracking-wider text-zinc-500">Título *</label>
          <input
            className="input-brand w-full"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            maxLength={120}
            placeholder="Ej: 20% off en proteínas"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs uppercase tracking-wider text-zinc-500">Mensaje *</label>
          <textarea
            className="input-brand min-h-[100px] w-full resize-y"
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            maxLength={500}
            placeholder="Texto breve de la promoción"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs uppercase tracking-wider text-zinc-500">URL destino (opcional)</label>
          <input
            className="input-brand w-full"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            placeholder="/tienda"
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={labelStyle}>Tipo</label>
          <select
            value={form.notifType}
            onChange={(e) =>
              setForm({
                ...form,
                notifType: e.target.value as "PROMO" | "SYSTEM" | "ORDER",
              })
            }
            className="input-brand w-full"
            style={{ width: "100%" }}
          >
            <option value="PROMO">🏷️ Oferta / Promoción</option>
            <option value="SYSTEM">🔔 Anuncio general</option>
            <option value="ORDER">📦 Info de pedido</option>
          </select>
        </div>

        {form.title ? (
          <div
            style={{
              marginBottom: "20px",
              padding: "16px",
              background: "#0a0a0a",
              border: "1px solid #2a2a2a",
            }}
          >
            <p
              style={{
                color: "#52525b",
                fontSize: "11px",
                fontFamily: "var(--font-display)",
                letterSpacing: "2px",
                textTransform: "uppercase",
                marginBottom: "12px",
              }}
            >
              Vista previa en campana
            </p>
            <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <span style={{ fontSize: "20px" }}>
                {form.notifType === "PROMO" ? "🏷️" : form.notifType === "ORDER" ? "📦" : "🔔"}
              </span>
              <div>
                <p style={{ color: "#ffffff", fontSize: "13px", fontWeight: 600, margin: "0 0 4px" }}>
                  {form.title}
                </p>
                <p style={{ color: "#52525b", fontSize: "12px", margin: 0 }}>{form.body || "—"}</p>
                <p
                  style={{
                    color: "#3f3f46",
                    fontSize: "11px",
                    margin: "4px 0 0",
                    fontFamily: "var(--font-display)",
                    letterSpacing: "1px",
                  }}
                >
                  Ahora
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <div
          className="rounded-sm border border-dashed border-brand-border p-4"
          style={{ background: "#0a0a0a" }}
        >
          <p className="font-display text-[10px] uppercase tracking-wider text-zinc-500">Vista previa OS</p>
          <div className="mt-3 rounded border border-zinc-700 bg-zinc-900 p-3 text-left">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">🏋️ Big Boys Gym</p>
            <p className="mt-1 font-medium text-white">{form.title || "Título"}</p>
            <p className="mt-1 text-sm text-zinc-400">{form.body || "Mensaje de la notificación"}</p>
          </div>
        </div>

        {error ? (
          <p className="text-sm text-brand-red" role="alert">
            {error}
          </p>
        ) : null}
        {sent ? (
          <p className="text-sm text-emerald-400" role="status">
            Notificación enviada.
          </p>
        ) : null}

        <button
          type="button"
          className="btn-brand w-full"
          disabled={sending || !form.title.trim() || !form.body.trim()}
          onClick={() => void handleBroadcast()}
        >
          {sending ? "Enviando…" : "📢 Enviar a todos los usuarios"}
        </button>
      </div>
    </div>
  );
}
