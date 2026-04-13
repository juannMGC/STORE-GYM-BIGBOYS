"use client";

import { useEffect, useState } from "react";
import { usePushNotifications } from "@/lib/use-push-notifications";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api-client";

export function PushPrompt() {
  const { isLoggedIn } = useAuth();
  const { permission, subscribed, loading, subscribe, isSupported } = usePushNotifications();

  const [dismissed, setDismissed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    setDismissed(typeof window !== "undefined" && !!localStorage.getItem("push-prompt-dismissed"));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (
      !isLoggedIn ||
      !isSupported ||
      permission !== "default" ||
      dismissed ||
      subscribed
    ) {
      return;
    }
    const timer = setTimeout(() => setShowBanner(true), 5000);
    return () => clearTimeout(timer);
  }, [hydrated, isLoggedIn, isSupported, permission, dismissed, subscribed]);

  const handleDismiss = () => {
    localStorage.setItem("push-prompt-dismissed", "1");
    setDismissed(true);
    setShowBanner(false);
  };

  const handleSubscribe = async () => {
    const ok = await subscribe(apiFetch);
    if (ok) setShowBanner(false);
  };

  if (!showBanner || dismissed || !isLoggedIn || !isSupported || permission !== "default") {
    return null;
  }

  return (
    <>
      <style>{`
        @keyframes push-prompt-fade-in-up {
          from { opacity: 0; transform: translate(-50%, 12px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
      <div
        style={{
          position: "fixed",
          bottom: "max(90px, env(safe-area-inset-bottom, 0px) + 74px)",
          left: "50%",
          transform: "translateX(-50%)",
          width: "min(400px, calc(100vw - 32px))",
          background: "#111111",
          border: "1px solid #d91920",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          zIndex: 998,
          padding: "20px",
          animation: "push-prompt-fade-in-up 0.4s ease",
        }}
      >
        <button
          type="button"
          onClick={handleDismiss}
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            background: "none",
            border: "none",
            color: "#52525b",
            cursor: "pointer",
            fontSize: "18px",
            lineHeight: 1,
          }}
          aria-label="Cerrar"
        >
          ×
        </button>

        <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
          <span style={{ fontSize: "32px" }} aria-hidden>
            🔔
          </span>
          <div>
            <p
              style={{
                fontFamily: "var(--font-display)",
                color: "#ffffff",
                fontSize: "15px",
                letterSpacing: "2px",
                textTransform: "uppercase",
                margin: "0 0 6px",
              }}
            >
              ¡Activá las notificaciones!
            </p>
            <p style={{ color: "#a1a1aa", fontSize: "13px", lineHeight: 1.5, margin: "0 0 16px" }}>
              Enterate cuando tu pedido cambia de estado y recibí ofertas exclusivas de Big Boys Gym.
            </p>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => void handleSubscribe()}
                disabled={loading}
                className="btn-brand"
                style={{ fontSize: "12px", flex: 1, minWidth: "120px" }}
              >
                {loading ? "Activando..." : "🔔 Activar"}
              </button>
              <button type="button" onClick={handleDismiss} className="btn-brand-outline" style={{ fontSize: "12px" }}>
                Ahora no
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
