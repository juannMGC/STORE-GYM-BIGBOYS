"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { ApiError, apiFetch } from "@/lib/api-client";

type Stats = {
  totalSubscriptions: number;
  totalUsers: number;
};

type SearchUserRow = {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  pushSubscriptions: { id: string }[];
};

type SelectedUser = {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  hasSubscription: boolean;
};

type SendToUsersResult = {
  sent: number;
  failed: number;
  noSubscription: number;
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
  const [tab, setTab] = useState<"broadcast" | "specific">("broadcast");

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

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUserRow[]>([]);
  const [searchCompleted, setSearchCompleted] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [formEspecifico, setFormEspecifico] = useState<{
    title: string;
    body: string;
    url: string;
    notifType: "PROMO" | "SYSTEM" | "ORDER";
  }>({
    title: "",
    body: "",
    url: "/mis-pedidos",
    notifType: "SYSTEM",
  });
  const [resultado, setResultado] = useState<SendToUsersResult | null>(null);

  useEffect(() => {
    void apiFetch<Stats>("/notifications/stats")
      .then(setStats)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      setSearchCompleted(false);
      return;
    }
    setSearchCompleted(false);
    const timer = setTimeout(() => {
      void (async () => {
        setSearching(true);
        try {
          const data = await apiFetch<SearchUserRow[]>(
            `/users/search?q=${encodeURIComponent(searchQuery)}`,
          );
          setSearchResults(data);
        } catch {
          setSearchResults([]);
        } finally {
          setSearching(false);
          setSearchCompleted(true);
        }
      })();
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

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

  const toggleUser = (user: SearchUserRow | SelectedUser) => {
    setSelectedUsers((prev) => {
      const exists = prev.find((u) => u.id === user.id);
      if (exists) return prev.filter((u) => u.id !== user.id);
      const hasSub =
        "pushSubscriptions" in user
          ? user.pushSubscriptions.length > 0
          : user.hasSubscription;
      return [
        ...prev,
        {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
          hasSubscription: hasSub,
        },
      ];
    });
  };

  const isSelected = (userId: string) => selectedUsers.some((u) => u.id === userId);

  const handleEnviarEspecifico = async () => {
    if (!formEspecifico.title || !formEspecifico.body || selectedUsers.length === 0) return;

    const sinSuscripcion = selectedUsers.filter((u) => !u.hasSubscription);
    if (sinSuscripcion.length > 0) {
      const confirmar = confirm(
        `${sinSuscripcion.length} usuario(s) no tienen notificaciones activadas y no recibirán el mensaje. ¿Continuar de todas formas?`,
      );
      if (!confirmar) return;
    }

    setSending(true);
    setResultado(null);
    try {
      const data = await apiFetch<SendToUsersResult>("/notifications/send-to-users", {
        method: "POST",
        body: JSON.stringify({
          userIds: selectedUsers.map((u) => u.id),
          title: formEspecifico.title,
          body: formEspecifico.body,
          url: formEspecifico.url,
          notifType: formEspecifico.notifType,
        }),
      });
      setResultado(data);
      setFormEspecifico({
        title: "",
        body: "",
        url: "/mis-pedidos",
        notifType: "SYSTEM",
      });
    } catch {
      alert("Error al enviar");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="font-display text-3xl uppercase tracking-wide text-white md:text-4xl">
        🔔 Notificaciones push
      </h1>
      <p className="mt-2 text-sm text-zinc-500">
        Enviá ofertas a quienes activaron notificaciones en el navegador (Web Push, sin Firebase).
      </p>

      <div
        style={{
          display: "flex",
          borderBottom: "1px solid #2a2a2a",
          marginBottom: "24px",
          marginTop: "24px",
        }}
      >
        {[
          { id: "broadcast" as const, label: "📢 Todos" },
          { id: "specific" as const, label: "👤 Específicos" },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            style={{
              padding: "12px 24px",
              background: "none",
              border: "none",
              borderBottom: tab === t.id ? "2px solid #d91920" : "2px solid transparent",
              color: tab === t.id ? "#f7e047" : "#71717a",
              cursor: "pointer",
              fontFamily: "var(--font-display)",
              fontSize: "13px",
              letterSpacing: "2px",
              textTransform: "uppercase",
              marginBottom: "-1px",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

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

      {tab === "broadcast" ? (
        <div className="mx-auto max-w-lg">
          <div className="panel-brand space-y-4" style={{ padding: "24px" }}>
            <p className="font-display text-xs uppercase tracking-wider text-brand-yellow">
              Enviar oferta especial
            </p>

            <div>
              <label className="mb-1 block text-xs uppercase tracking-wider text-zinc-500">
                Título *
              </label>
              <input
                className="input-brand w-full"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                maxLength={120}
                placeholder="Ej: 20% off en proteínas"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs uppercase tracking-wider text-zinc-500">
                Mensaje *
              </label>
              <textarea
                className="input-brand min-h-[100px] w-full resize-y"
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                maxLength={500}
                placeholder="Texto breve de la promoción"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs uppercase tracking-wider text-zinc-500">
                URL destino (opcional)
              </label>
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
                    {form.notifType === "PROMO"
                      ? "🏷️"
                      : form.notifType === "ORDER"
                        ? "📦"
                        : "🔔"}
                  </span>
                  <div>
                    <p
                      style={{
                        color: "#ffffff",
                        fontSize: "13px",
                        fontWeight: 600,
                        margin: "0 0 4px",
                      }}
                    >
                      {form.title}
                    </p>
                    <p style={{ color: "#52525b", fontSize: "12px", margin: 0 }}>
                      {form.body || "—"}
                    </p>
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
              <p className="font-display text-[10px] uppercase tracking-wider text-zinc-500">
                Vista previa OS
              </p>
              <div className="mt-3 rounded border border-zinc-700 bg-zinc-900 p-3 text-left">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                  🏋️ Big Boys Gym
                </p>
                <p className="mt-1 font-medium text-white">{form.title || "Título"}</p>
                <p className="mt-1 text-sm text-zinc-400">
                  {form.body || "Mensaje de la notificación"}
                </p>
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
      ) : (
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-6">
          {/* Panel izquierdo — Buscar y seleccionar */}
          <div style={{ flex: 1 }} className="min-w-0">
            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Buscar usuario por nombre o email</label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ej: Juan o juan@gmail.com"
                  className="input-brand"
                  style={{ width: "100%", paddingLeft: "36px" }}
                />
                <span
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#52525b",
                  }}
                >
                  🔍
                </span>
              </div>
            </div>

            {searching ? (
              <p
                style={{
                  color: "#52525b",
                  fontSize: "12px",
                  textAlign: "center",
                  padding: "16px",
                }}
              >
                Buscando...
              </p>
            ) : null}

            {searchResults.length > 0 ? (
              <div
                style={{
                  border: "1px solid #2a2a2a",
                  maxHeight: "280px",
                  overflowY: "auto",
                  marginBottom: "16px",
                }}
              >
                {searchResults.map((user) => {
                  const selected = isSelected(user.id);
                  const hasSub = user.pushSubscriptions?.length > 0;

                  return (
                    <div
                      key={user.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleUser(user)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggleUser(user);
                        }
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "10px 14px",
                        borderBottom: "1px solid #1a1a1a",
                        cursor: "pointer",
                        background: selected ? "rgba(217,25,32,0.1)" : "transparent",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        if (!selected) e.currentTarget.style.background = "#1a1a1a";
                      }}
                      onMouseLeave={(e) => {
                        if (!selected) e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          border: `2px solid ${selected ? "#d91920" : "#2a2a2a"}`,
                          overflow: "hidden",
                          flexShrink: 0,
                          background: "#1a1a1a",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#f7e047",
                          fontFamily: "var(--font-display)",
                          fontSize: "14px",
                        }}
                      >
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt=""
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          (user.name ?? user.email).charAt(0).toUpperCase()
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            color: "#e4e4e7",
                            fontSize: "13px",
                            fontWeight: 600,
                            margin: "0 0 2px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {user.name ?? "Sin nombre"}
                        </p>
                        <p
                          style={{
                            color: "#52525b",
                            fontSize: "12px",
                            margin: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {user.email}
                        </p>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          flexShrink: 0,
                        }}
                      >
                        <span
                          style={{
                            fontSize: "11px",
                            color: hasSub ? "#22c55e" : "#3f3f46",
                            fontFamily: "var(--font-display)",
                            letterSpacing: "1px",
                          }}
                        >
                          {hasSub ? "🔔" : "🔕"}
                        </span>

                        <div
                          style={{
                            width: "18px",
                            height: "18px",
                            border: `2px solid ${selected ? "#d91920" : "#2a2a2a"}`,
                            background: selected ? "#d91920" : "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.15s",
                          }}
                        >
                          {selected ? (
                            <span style={{ color: "white", fontSize: "12px", lineHeight: 1 }}>
                              ✓
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {searchQuery.length >= 2 && !searching && searchResults.length === 0 ? (
              <p
                style={{
                  color: "#52525b",
                  fontSize: "12px",
                  textAlign: "center",
                  padding: "16px",
                  border: "1px solid #1a1a1a",
                }}
              >
                No se encontraron usuarios con &quot;{searchQuery}&quot;
              </p>
            ) : null}
          </div>

          {/* Panel derecho — Seleccionados + formulario */}
          <div style={{ flex: 1 }} className="min-w-0">
            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}>Destinatarios ({selectedUsers.length})</label>

              {selectedUsers.length === 0 ? (
                <div
                  style={{
                    padding: "24px",
                    border: "1px dashed #2a2a2a",
                    textAlign: "center",
                    color: "#3f3f46",
                    fontSize: "13px",
                  }}
                >
                  Buscá y seleccioná usuarios en el panel izquierdo
                </div>
              ) : (
                <div
                  style={{
                    border: "1px solid #2a2a2a",
                    maxHeight: "160px",
                    overflowY: "auto",
                  }}
                >
                  {selectedUsers.map((user) => (
                    <div
                      key={user.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "8px 12px",
                        borderBottom: "1px solid #1a1a1a",
                      }}
                    >
                      <span
                        style={{
                          color: user.hasSubscription ? "#22c55e" : "#3f3f46",
                          fontSize: "14px",
                        }}
                      >
                        {user.hasSubscription ? "🔔" : "🔕"}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            color: "#e4e4e7",
                            fontSize: "12px",
                            margin: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {user.name ?? user.email}
                        </p>
                        {user.name ? (
                          <p style={{ color: "#52525b", fontSize: "11px", margin: 0 }}>
                            {user.email}
                          </p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleUser(user)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#d91920",
                          cursor: "pointer",
                          fontSize: "16px",
                          lineHeight: 1,
                          padding: "2px",
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {selectedUsers.length > 0 ? (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "8px",
                    flexWrap: "wrap",
                    gap: "8px",
                  }}
                >
                  <p style={{ color: "#52525b", fontSize: "11px", margin: 0 }}>
                    🔔 {selectedUsers.filter((u) => u.hasSubscription).length} con push activo · 🔕{" "}
                    {selectedUsers.filter((u) => !u.hasSubscription).length} sin push
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedUsers([])}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#52525b",
                      cursor: "pointer",
                      fontSize: "11px",
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    Limpiar selección
                  </button>
                </div>
              ) : null}
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Título *</label>
              <input
                type="text"
                value={formEspecifico.title}
                onChange={(e) => setFormEspecifico({ ...formEspecifico, title: e.target.value })}
                placeholder="Ej: Tu pedido fue enviado 🚚"
                className="input-brand"
                style={{ width: "100%" }}
                maxLength={100}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Mensaje *</label>
              <textarea
                value={formEspecifico.body}
                onChange={(e) => setFormEspecifico({ ...formEspecifico, body: e.target.value })}
                placeholder="Ej: Tu pedido #ABC123 ya está en camino"
                className="input-brand"
                style={{ width: "100%", minHeight: "80px", resize: "vertical" }}
                maxLength={200}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>URL destino</label>
              <select
                value={formEspecifico.url}
                onChange={(e) => setFormEspecifico({ ...formEspecifico, url: e.target.value })}
                className="select-brand"
                style={{ width: "100%" }}
              >
                <option value="/mis-pedidos">Mis pedidos</option>
                <option value="/tienda">Tienda</option>
                <option value="/perfil">Mi perfil</option>
                <option value="/">Inicio</option>
              </select>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}>Tipo</label>
              <select
                value={formEspecifico.notifType}
                onChange={(e) =>
                  setFormEspecifico({
                    ...formEspecifico,
                    notifType: e.target.value as "PROMO" | "SYSTEM" | "ORDER",
                  })
                }
                className="select-brand"
                style={{ width: "100%" }}
              >
                <option value="ORDER">📦 Pedido</option>
                <option value="PROMO">🏷️ Oferta</option>
                <option value="SYSTEM">🔔 General</option>
              </select>
            </div>

            {resultado ? (
              <div
                style={{
                  padding: "12px 16px",
                  background: "rgba(34,197,94,0.1)",
                  border: "1px solid #22c55e",
                  marginBottom: "16px",
                }}
              >
                <p
                  style={{
                    color: "#22c55e",
                    fontSize: "13px",
                    fontFamily: "var(--font-display)",
                    letterSpacing: "1px",
                    margin: "0 0 4px",
                  }}
                >
                  ✓ Notificación enviada
                </p>
                <p style={{ color: "#a1a1aa", fontSize: "12px", margin: 0 }}>
                  ✅ {resultado.sent} enviadas · 🔕 {resultado.noSubscription} sin push · ❌{" "}
                  {resultado.failed} fallidas
                </p>
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => void handleEnviarEspecifico()}
              disabled={
                sending ||
                selectedUsers.length === 0 ||
                !formEspecifico.title ||
                !formEspecifico.body
              }
              className="btn-brand"
              style={{
                width: "100%",
                opacity:
                  selectedUsers.length === 0 || !formEspecifico.title || !formEspecifico.body
                    ? 0.5
                    : 1,
              }}
            >
              {sending
                ? "⏳ Enviando..."
                : `📱 Enviar a ${selectedUsers.length} usuario${selectedUsers.length !== 1 ? "s" : ""}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
