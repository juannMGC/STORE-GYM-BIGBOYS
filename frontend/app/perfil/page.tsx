"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, ApiError } from "@/lib/api-client";
import type { AuthUser } from "@/lib/types";

type MePatch = { user: AuthUser };

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function PerfilPage() {
  const { user, loading, isLoggedIn, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [avatarFeedback, setAvatarFeedback] = useState<string | null>(null);
  const [avatarErr, setAvatarErr] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setName(user.name ?? "");
    setPhone(user.phone ?? "");
  }, [user]);

  async function handleSaveAvatar(base64: string) {
    setAvatarSaving(true);
    setAvatarErr(null);
    setAvatarFeedback(null);
    try {
      await apiFetch<MePatch>("/users/me/avatar", {
        method: "PATCH",
        body: JSON.stringify({ avatarUrl: base64 }),
      });
      await refreshUser();
      setAvatarPreview(null);
      setAvatarFeedback("Foto actualizada ✓");
    } catch (err) {
      const text = err instanceof ApiError ? err.message : "No se pudo subir la foto";
      setAvatarErr(text);
    } finally {
      setAvatarSaving(false);
    }
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setAvatarErr("La imagen debe pesar menos de 2MB");
      return;
    }
    setAvatarErr(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setAvatarPreview(base64);
      void handleSaveAvatar(base64);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

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
        }),
      });
      await refreshUser();
      setFeedback({ type: "ok", text: "Cambios guardados ✓" });
    } catch (err) {
      const text = err instanceof ApiError ? err.message : "No se pudo guardar";
      setFeedback({ type: "err", text });
    } finally {
      setSaving(false);
    }
  }

  function handleChangePassword() {
    if (!user?.email) return;
    window.location.href =
      `/auth/login?` +
      `prompt=login&` +
      `screen_hint=change-password&` +
      `login_hint=${encodeURIComponent(user.email)}`;
  }

  const labelForInitials =
    user?.name?.trim() || user?.email?.trim() || "U";
  const showAvatar = avatarPreview ?? user?.avatarUrl ?? null;

  if (loading) {
    return (
      <div className="mx-auto max-w-[480px] px-4 py-16 text-center text-zinc-500">Cargando…</div>
    );
  }

  if (!isLoggedIn || !user) {
    return (
      <div className="mx-auto max-w-[480px] px-4 py-16 text-center text-zinc-500">
        Necesitás iniciar sesión para ver tu perfil.
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] bg-[#050505] px-4 py-10">
      <div className="mx-auto max-w-[480px]">
        <div className="flex flex-col items-center">
          <div
            style={{
              width: "120px",
              height: "120px",
              borderRadius: "50%",
              border: "2px solid #d91920",
              overflow: "hidden",
              background: "#1a1a1a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {showAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={showAvatar}
                alt={user.name ?? "Avatar"}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <span
                style={{
                  color: "#f7e047",
                  fontSize: "40px",
                  fontWeight: 700,
                  fontFamily: "var(--font-display)",
                  letterSpacing: "1px",
                }}
              >
                {initials(labelForInitials)}
              </span>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleFileChange}
          />
          <button
            type="button"
            disabled={avatarSaving}
            className="btn-brand-outline mt-4 text-sm disabled:opacity-50"
            onClick={() => fileInputRef.current?.click()}
          >
            {avatarSaving ? "Subiendo…" : "📷 Cambiar foto"}
          </button>
          {avatarFeedback ? (
            <p className="mt-2 text-sm text-brand-yellow" role="status">
              {avatarFeedback}
            </p>
          ) : null}
          {avatarErr ? (
            <p className="mt-2 text-sm text-brand-red" role="alert">
              {avatarErr}
            </p>
          ) : null}
        </div>

        <div className="panel-brand mt-10 p-6">
          <h2 className="font-display text-lg uppercase tracking-[0.2em] text-brand-yellow">
            Mi información
          </h2>
          <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500">
                Nombre visible
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
                Email (solo lectura)
              </label>
              <div className="relative mt-1">
                <input
                  className="input-brand w-full pr-10 opacity-80"
                  value={user.email}
                  disabled
                  readOnly
                  autoComplete="email"
                />
                <span
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500"
                  aria-hidden
                >
                  🔒
                </span>
              </div>
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

            {feedback ? (
              <p
                className={`text-sm ${
                  feedback.type === "ok" ? "text-brand-yellow" : "text-brand-red"
                }`}
                role="status"
              >
                {feedback.text}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={saving}
              className="btn-brand w-full disabled:opacity-50 sm:w-auto"
            >
              {saving ? "Guardando…" : "Guardar cambios"}
            </button>
          </form>
        </div>

        <div className="panel-brand mt-8 p-6">
          <h2 className="font-display text-lg uppercase tracking-[0.2em] text-brand-yellow">
            Seguridad
          </h2>
          <p className="mt-4 text-sm text-zinc-400">
            Te redirigiremos a Auth0 para cambiar tu contraseña de forma segura.
          </p>
          <button
            type="button"
            className="btn-brand-outline mt-4 w-full sm:w-auto"
            onClick={handleChangePassword}
          >
            Cambiar contraseña →
          </button>
        </div>
      </div>
    </div>
  );
}
