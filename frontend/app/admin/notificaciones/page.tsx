"use client";

import { useEffect, useState } from "react";
import { ApiError, apiFetch } from "@/lib/api-client";

type Stats = {
  totalSubscriptions: number;
  totalUsers: number;
};

export default function AdminNotificacionesPage() {
  const [form, setForm] = useState({ title: "", body: "", url: "/tienda" });
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
        }),
      });
      setSent(true);
      setForm({ title: "", body: "", url: "/tienda" });
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

        <div
          className="rounded-sm border border-dashed border-brand-border p-4"
          style={{ background: "#0a0a0a" }}
        >
          <p className="font-display text-[10px] uppercase tracking-wider text-zinc-500">Vista previa</p>
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
