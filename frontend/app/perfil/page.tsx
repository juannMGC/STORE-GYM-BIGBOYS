"use client";

import { useEffect, useRef, useState, type ChangeEvent, type CSSProperties, type FormEvent } from "react";
import { BackButton } from "@/components/back-button";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, ApiError } from "@/lib/api-client";
import { uploadBase64Image } from "@/lib/upload-image";
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

const labelStyle: CSSProperties = {
  display: "block",
  color: "#a1a1aa",
  fontSize: "12px",
  marginBottom: "6px",
  fontFamily: "var(--font-display)",
  letterSpacing: "1px",
  textTransform: "uppercase",
};

export default function PerfilPage() {
  const { user, loading, isLoggedIn, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    department: "",
    city: "",
    neighborhood: "",
    address: "",
    complement: "",
  });

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [avatarFeedback, setAvatarFeedback] = useState<string | null>(null);
  const [avatarErr, setAvatarErr] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name ?? "",
      phone: user.phone ?? "",
      department: user.department ?? "",
      city: user.city ?? "",
      neighborhood: user.neighborhood ?? "",
      address: user.address ?? "",
      complement: user.complement ?? "",
    });
  }, [user]);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setAvatarErr("La imagen debe pesar menos de 5MB");
      return;
    }
    setAvatarErr(null);
    setAvatarFeedback(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      void (async () => {
        const base64 = ev.target?.result as string;
        setAvatarPreview(base64);
        try {
          setAvatarSaving(true);
          const cloudinaryUrl = await uploadBase64Image(base64, "avatars");
          await apiFetch<MePatch>("/users/me/avatar", {
            method: "PATCH",
            body: JSON.stringify({ avatarUrl: cloudinaryUrl }),
          });
          setAvatarPreview(cloudinaryUrl);
          await refreshUser();
          setAvatarFeedback("Foto actualizada ✓");
        } catch (err) {
          const text =
            err instanceof ApiError ? err.message : "Error al subir la imagen";
          setAvatarErr(text);
          setAvatarPreview(user?.avatarUrl ?? null);
        } finally {
          setAvatarSaving(false);
        }
      })();
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
          name: form.name.trim(),
          phone: form.phone.trim(),
          department: form.department.trim(),
          city: form.city.trim(),
          neighborhood: form.neighborhood.trim(),
          address: form.address.trim(),
          complement: form.complement.trim(),
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

  const direccionCompleta =
    Boolean(form.address?.trim()) &&
    Boolean(form.city?.trim()) &&
    Boolean(form.department?.trim());

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
    <div className="min-h-[60vh] bg-[#050505] px-4 py-8 sm:py-10">
      <div className="mx-auto w-full max-w-[520px]">
        <div style={{ padding: "16px 0 8px", marginBottom: "8px" }}>
          <BackButton href="/" label="← Inicio" />
        </div>
        <h1 className="font-display text-3xl uppercase tracking-wide text-white sm:text-4xl">
          Mi perfil
        </h1>
        <div className="mt-8 flex flex-col items-center">
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
            className="btn-brand-outline mt-4 w-full text-sm disabled:opacity-50 sm:w-auto"
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

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-10 space-y-5">
          <div
            className="panel-brand"
            style={{ padding: "24px", marginBottom: "20px" }}
          >
            <p
              style={{
                fontFamily: "var(--font-display)",
                color: "#f7e047",
                fontSize: "12px",
                letterSpacing: "3px",
                textTransform: "uppercase",
                marginBottom: "20px",
                paddingBottom: "12px",
                borderBottom: "1px solid #2a2a2a",
              }}
            >
              Mi información
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={labelStyle}>Nombre visible</label>
                <input
                  className="input-brand"
                  style={{ width: "100%" }}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Tu nombre"
                  autoComplete="name"
                />
              </div>
              <div>
                <label style={labelStyle}>
                  Email
                  <span style={{ color: "#52525b", fontSize: "11px", marginLeft: "8px" }}>
                    🔒 No editable
                  </span>
                </label>
                <input
                  className="input-brand"
                  style={{ width: "100%", opacity: 0.5, cursor: "not-allowed" }}
                  value={user.email}
                  disabled
                  readOnly
                  autoComplete="email"
                />
              </div>
              <div>
                <label style={labelStyle}>Teléfono</label>
                <input
                  className="input-brand"
                  style={{ width: "100%" }}
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="Ej: 300 123 4567"
                  autoComplete="tel"
                />
              </div>
            </div>
          </div>

          <div className="panel-brand" style={{ padding: "24px", marginBottom: "20px" }}>
            <p
              style={{
                fontFamily: "var(--font-display)",
                color: "#f7e047",
                fontSize: "12px",
                letterSpacing: "3px",
                textTransform: "uppercase",
                marginBottom: "4px",
                paddingBottom: "4px",
              }}
            >
              Dirección de envío
            </p>
            <p
              style={{
                color: "#52525b",
                fontSize: "12px",
                marginBottom: "20px",
                paddingBottom: "12px",
                borderBottom: "1px solid #2a2a2a",
              }}
            >
              Se usará para pre-llenar el checkout automáticamente
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
              className="max-sm:grid-cols-1"
            >
              <div className="min-w-0 sm:col-span-1">
                <label style={labelStyle}>Departamento</label>
                <input
                  className="input-brand"
                  style={{ width: "100%" }}
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  placeholder="Ej: Caldas"
                />
              </div>
              <div className="min-w-0 sm:col-span-1">
                <label style={labelStyle}>Ciudad</label>
                <input
                  className="input-brand"
                  style={{ width: "100%" }}
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="Ej: Manizales"
                />
              </div>
              <div className="min-w-0 sm:col-span-2">
                <label style={labelStyle}>Barrio</label>
                <input
                  className="input-brand"
                  style={{ width: "100%" }}
                  value={form.neighborhood}
                  onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
                  placeholder="Ej: La Enea"
                />
              </div>
            </div>

            <div style={{ marginTop: "16px" }}>
              <label style={labelStyle}>Dirección *</label>
              <input
                className="input-brand"
                style={{ width: "100%" }}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Ej: Calle 50 # 23-45"
                autoComplete="street-address"
              />
            </div>

            <div style={{ marginTop: "16px" }}>
              <label style={labelStyle}>
                Torre / Apto / Conjunto / Oficina
                <span style={{ color: "#52525b", fontSize: "11px", marginLeft: "8px" }}>
                  Opcional
                </span>
              </label>
              <input
                className="input-brand"
                style={{ width: "100%" }}
                value={form.complement}
                onChange={(e) => setForm({ ...form, complement: e.target.value })}
                placeholder="Ej: Apto 302, Torre B"
              />
            </div>

            {direccionCompleta ? (
              <div
                style={{
                  marginTop: "16px",
                  padding: "12px",
                  background: "#1a1a1a",
                  border: "1px solid #2a2a2a",
                  borderLeft: "3px solid #22c55e",
                }}
              >
                <p
                  style={{
                    color: "#22c55e",
                    fontSize: "11px",
                    fontFamily: "var(--font-display)",
                    letterSpacing: "1px",
                    marginBottom: "4px",
                  }}
                >
                  ✓ DIRECCIÓN COMPLETA
                </p>
                <p style={{ color: "#a1a1aa", fontSize: "13px" }}>
                  {form.address}
                  {form.complement ? `, ${form.complement}` : ""}
                  {form.neighborhood ? ` · ${form.neighborhood}` : ""}
                  {form.city || form.department
                    ? ` · ${[form.city, form.department].filter(Boolean).join(", ")}`
                    : ""}
                </p>
              </div>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn-brand w-full disabled:opacity-50"
            style={{ padding: "14px" }}
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>

          {feedback ? (
            <p
              className={`text-center text-sm ${
                feedback.type === "ok" ? "text-emerald-400" : "text-brand-red"
              }`}
              role="status"
            >
              {feedback.text}
            </p>
          ) : null}
        </form>

        <div className="panel-brand mt-8 p-4 sm:p-6">
          <h2 className="font-display text-base uppercase tracking-[0.2em] text-brand-yellow sm:text-lg">
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
