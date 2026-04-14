"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import {
  NOTIFICATIONS_LS_KEY,
  type StoredNotification,
  type StoredNotificationType,
} from "@/lib/notifications-storage";
import { usePushNotifications } from "@/lib/use-push-notifications";

function normalizeNotifType(raw: string | undefined): StoredNotificationType {
  if (raw === "ORDER" || raw === "PROMO") return raw;
  return "SYSTEM";
}

function normalizeFromSw(raw: {
  id: string;
  title: string;
  body: string;
  url?: string;
  notifType?: string;
  read?: boolean;
  createdAt: string;
}): StoredNotification {
  return {
    id: raw.id,
    title: raw.title,
    body: raw.body,
    url: raw.url ?? "/tienda",
    read: !!raw.read,
    createdAt: raw.createdAt,
    type: normalizeNotifType(raw.notifType),
  };
}

function mergeLsWithIdb(idb: StoredNotification[]): StoredNotification[] {
  try {
    const lsRaw = localStorage.getItem(NOTIFICATIONS_LS_KEY);
    if (!lsRaw) return idb;
    const ls: StoredNotification[] = JSON.parse(lsRaw);
    const map = new Map(idb.map((n) => [n.id, n]));
    for (const n of ls) {
      if (!map.has(n.id)) map.set(n.id, n);
    }
    return Array.from(map.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20);
  } catch {
    return idb;
  }
}

export function NotificationBell() {
  const { isLoggedIn } = useAuth();
  const { subscribed, subscribe, loading: pushSubLoading, isSupported } = usePushNotifications();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<StoredNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotificationsFromSW = useCallback(async () => {
    if (!("serviceWorker" in navigator)) return;
    try {
      const registration = await navigator.serviceWorker.ready;
      registration.active?.postMessage({ type: "GET_STORED_NOTIFICATIONS" });
    } catch (e) {
      console.error("[NotificationBell] Error pidiendo notificaciones al SW:", e);
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    if (!("serviceWorker" in navigator)) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "STORED_NOTIFICATIONS") {
        const rawList = (event.data.notifications ?? []) as Array<{
          id: string;
          title: string;
          body: string;
          url?: string;
          notifType?: string;
          read?: boolean;
          createdAt: string;
        }>;
        const normalized = rawList.map((n) => normalizeFromSw(n));
        const merged = mergeLsWithIdb(normalized);
        setNotifications(merged);
        setUnreadCount(merged.filter((n) => !n.read).length);
        return;
      }

      if (event.data?.type === "NEW_NOTIFICATION") {
        const raw = event.data.notif as
          | {
              id: string;
              title: string;
              body: string;
              url?: string;
              notifType?: string;
              read?: boolean;
              createdAt: string;
            }
          | undefined;
        if (!raw) return;
        const newNotif = normalizeFromSw(raw);
        setNotifications((prev) => {
          if (prev.some((n) => n.id === newNotif.id)) return prev;
          const next = [newNotif, ...prev].slice(0, 20);
          if (!newNotif.read) {
            queueMicrotask(() => setUnreadCount((u) => u + 1));
          }
          return next;
        });
      }
    };

    navigator.serviceWorker.addEventListener("message", handleMessage);
    void loadNotificationsFromSW();

    return () => {
      navigator.serviceWorker.removeEventListener("message", handleMessage);
    };
  }, [isLoggedIn, loadNotificationsFromSW]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const handleFocus = () => {
      void loadNotificationsFromSW();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [isLoggedIn, loadNotificationsFromSW]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const onCustom = () => void loadNotificationsFromSW();
    window.addEventListener("bigboys-notifications-updated", onCustom);
    return () => window.removeEventListener("bigboys-notifications-updated", onCustom);
  }, [isLoggedIn, loadNotificationsFromSW]);

  const handleToggleOpen = () => {
    if (!open && unreadCount > 0) {
      setNotifications((prev) => {
        const updated = prev.map((n) => ({ ...n, read: true }));
        return updated;
      });
      setUnreadCount(0);
      if ("serviceWorker" in navigator) {
        void navigator.serviceWorker.ready.then((reg) => {
          reg.active?.postMessage({ type: "MARK_ALL_READ" });
        });
      }
    }
    setOpen((v) => !v);
  };

  const markAsRead = (id: string) => {
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.ready.then((reg) => {
        reg.active?.postMessage({ type: "MARK_READ", id });
      });
    }
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      queueMicrotask(() => setUnreadCount(updated.filter((n) => !n.read).length));
      return updated;
    });
  };

  const removeNotification = (id: string) => {
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.ready.then((reg) => {
        reg.active?.postMessage({ type: "DELETE_NOTIFICATION", id });
      });
    }
    setNotifications((prev) => {
      const updated = prev.filter((n) => n.id !== id);
      queueMicrotask(() => setUnreadCount(updated.filter((n) => !n.read).length));
      return updated;
    });
  };

  const clearAll = () => {
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.ready.then((reg) => {
        reg.active?.postMessage({ type: "CLEAR_NOTIFICATIONS" });
      });
    }
    try {
      localStorage.removeItem(NOTIFICATIONS_LS_KEY);
    } catch {
      /* ignore */
    }
    setNotifications([]);
    setUnreadCount(0);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isLoggedIn) return null;

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return "Ahora";
    if (mins < 60) return `Hace ${mins}m`;
    if (hours < 24) return `Hace ${hours}h`;
    return `Hace ${days}d`;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "ORDER":
        return "📦";
      case "PROMO":
        return "🏷️";
      default:
        return "🔔";
    }
  };

  const openNotif = (notif: StoredNotification) => {
    markAsRead(notif.id);
    setOpen(false);
    if (notif.url) {
      if (notif.url.startsWith("http")) {
        window.location.href = notif.url;
      } else {
        router.push(notif.url.startsWith("/") ? notif.url : `/${notif.url}`);
      }
    }
  };

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={handleToggleOpen}
        style={{
          position: "relative",
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          border: "1px solid #2a2a2a",
          background: open ? "#1a1a1a" : "transparent",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s",
          color: "#e4e4e7",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#1a1a1a";
          e.currentTarget.style.borderColor = "#d91920";
        }}
        onMouseLeave={(e) => {
          if (!open) {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "#2a2a2a";
          }
        }}
        aria-label="Notificaciones"
        aria-expanded={open}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-4px",
              right: "-4px",
              background: "#d91920",
              color: "white",
              fontSize: "10px",
              fontWeight: 700,
              fontFamily: "var(--font-display)",
              minWidth: "18px",
              height: "18px",
              borderRadius: "9px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 4px",
              border: "2px solid #050505",
              animation: "notification-badge-pop 0.3s ease",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 12px)",
            right: 0,
            width: "min(320px, calc(100vw - 24px))",
            background: "#111111",
            border: "1px solid #2a2a2a",
            boxShadow: "4px 4px 0px #d91920",
            zIndex: 200,
            maxHeight: "min(420px, 70vh)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "14px 16px",
              borderBottom: "1px solid #2a2a2a",
              background: "#1a1a1a",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-display)",
                color: "#f7e047",
                fontSize: "12px",
                letterSpacing: "3px",
                textTransform: "uppercase",
              }}
            >
              🔔 Notificaciones
            </span>
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={clearAll}
                style={{
                  background: "none",
                  border: "none",
                  color: "#52525b",
                  cursor: "pointer",
                  fontSize: "11px",
                  fontFamily: "var(--font-display)",
                  letterSpacing: "1px",
                }}
              >
                Limpiar todo
              </button>
            )}
          </div>

          <div style={{ overflowY: "auto", flex: 1 }}>
            {notifications.length === 0 ? (
              <div style={{ padding: "40px 24px", textAlign: "center" }}>
                <p style={{ fontSize: "32px", marginBottom: "12px" }}>🔕</p>
                <p
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "#3f3f46",
                    fontSize: "12px",
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                    marginBottom: "8px",
                  }}
                >
                  Sin notificaciones
                </p>
                <p style={{ color: "#27272a", fontSize: "12px" }}>
                  Acá aparecerán las novedades de tus pedidos y ofertas
                </p>
                {isSupported && !subscribed && (
                  <button
                    type="button"
                    disabled={pushSubLoading}
                    onClick={() => void subscribe(apiFetch)}
                    style={{
                      marginTop: "16px",
                      background: "none",
                      border: "1px solid #2a2a2a",
                      color: "#f7e047",
                      padding: "8px 16px",
                      cursor: pushSubLoading ? "wait" : "pointer",
                      fontSize: "11px",
                      fontFamily: "var(--font-display)",
                      letterSpacing: "2px",
                      opacity: pushSubLoading ? 0.7 : 1,
                    }}
                  >
                    {pushSubLoading ? "…" : "🔔 Activar notificaciones"}
                  </button>
                )}
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openNotif(notif);
                    }
                  }}
                  style={{
                    display: "flex",
                    gap: "10px",
                    padding: "12px 16px",
                    borderBottom: "1px solid #1a1a1a",
                    background: notif.read ? "transparent" : "#0d0d0d",
                    transition: "background 0.15s",
                    cursor: "pointer",
                  }}
                  onClick={() => openNotif(notif)}
                >
                  <span style={{ fontSize: "20px", flexShrink: 0, marginTop: "2px" }}>
                    {getTypeIcon(notif.type)}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        color: notif.read ? "#a1a1aa" : "#ffffff",
                        fontSize: "13px",
                        fontWeight: notif.read ? 400 : 600,
                        margin: "0 0 2px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {notif.title}
                    </p>
                    <p
                      style={{
                        color: "#52525b",
                        fontSize: "12px",
                        margin: "0 0 4px",
                        lineHeight: 1.4,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {notif.body}
                    </p>
                    <p
                      style={{
                        color: "#3f3f46",
                        fontSize: "11px",
                        margin: 0,
                        fontFamily: "var(--font-display)",
                        letterSpacing: "1px",
                      }}
                    >
                      {formatTime(notif.createdAt)}
                    </p>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "8px",
                      flexShrink: 0,
                    }}
                  >
                    {!notif.read && (
                      <div
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: "#d91920",
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(notif.id);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#3f3f46",
                        cursor: "pointer",
                        fontSize: "14px",
                        lineHeight: 1,
                        padding: "2px",
                      }}
                      aria-label="Eliminar"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div
              style={{
                padding: "10px 16px",
                borderTop: "1px solid #1a1a1a",
                background: "#0a0a0a",
                flexShrink: 0,
                textAlign: "center",
              }}
            >
              <Link
                href="/perfil"
                onClick={() => setOpen(false)}
                style={{
                  color: "#52525b",
                  fontSize: "11px",
                  fontFamily: "var(--font-display)",
                  letterSpacing: "2px",
                  textDecoration: "none",
                  textTransform: "uppercase",
                }}
              >
                Configurar notificaciones →
              </Link>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes notification-badge-pop {
          0% { transform: scale(0); }
          70% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
