"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, ApiError } from "@/lib/api-client";
import type { AuthUser } from "@/lib/types";

type MePatch = { user: AuthUser };

export default function PerfilPage() {
  const { user, loading, isLoggedIn, refreshUser } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(
    null,
  );

  useEffect(() => {
    if (!user) return;
    setName(user.name ?? "");
    setPhone(user.phone ?? "");
    setAddress(user.address ?? "");
  }, [user]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFeedback(null);
    setSaving(true);
    try {
      await apiFetch<MePatch>("/users/me", {
        method: "PATCH",
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
        }),
      });
      refreshUser();
      setFeedback({ type: "ok", text: "Perfil actualizado." });
    } catch (err) {
      const text = err instanceof ApiError ? err.message : "No se pudo guardar";
      setFeedback({ type: "err", text });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-zinc-500">Cargando…</div>
    );
  }

  if (!isLoggedIn || !user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-zinc-500">
        Necesitás iniciar sesión para ver tu perfil.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="font-display text-4xl uppercase tracking-wide text-white">Mi perfil</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Email: <span className="text-zinc-300">{user.email}</span>
        {" · "}
        Rol: <span className="text-zinc-300">{user.role}</span>
      </p>

      <form onSubmit={(e) => void handleSubmit(e)} className="panel-brand mt-8 p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500">
              Nombre
            </label>
            <input
              className="input-brand mt-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500">
              Teléfono
            </label>
            <input
              className="input-brand mt-1"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
            />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500">
              Dirección
            </label>
            <textarea
              className="input-brand mt-1 min-h-[88px] resize-y"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              autoComplete="street-address"
              rows={3}
            />
          </div>
        </div>

        {feedback && (
          <p
            className={`mt-4 text-sm ${
              feedback.type === "ok" ? "text-brand-yellow" : "text-brand-red"
            }`}
            role="status"
          >
            {feedback.text}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="btn-brand mt-6 w-full disabled:opacity-50 sm:w-auto"
        >
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
}
