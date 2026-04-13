"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export function ConsentBanner() {
  const { isLoggedIn } = useAuth();
  const [show, setShow] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [marketing, setMarketing] = useState(true);

  useEffect(() => {
    const hasAccepted = typeof window !== "undefined" && localStorage.getItem("terms-accepted");
    if (isLoggedIn && !hasAccepted) {
      setShow(true);
    } else {
      setShow(false);
    }
  }, [isLoggedIn]);

  const handleAccept = () => {
    localStorage.setItem("terms-accepted", "true");
    localStorage.setItem("terms-accepted-date", new Date().toISOString());
    localStorage.setItem("marketing-consent", marketing ? "true" : "false");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-banner-title"
    >
      <div
        style={{
          background: "#111111",
          border: "1px solid #2a2a2a",
          borderTop: "3px solid #d91920",
          maxWidth: "480px",
          width: "100%",
          padding: "32px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-display)",
            color: "#f7e047",
            fontSize: "20px",
            letterSpacing: "4px",
            textTransform: "uppercase",
            margin: "0 0 8px",
          }}
        >
          BIG BOYS GYM
        </p>
        <h2
          id="consent-banner-title"
          style={{ color: "#ffffff", fontSize: "16px", margin: "0 0 16px", fontWeight: 600 }}
        >
          Antes de continuar
        </h2>
        <p style={{ color: "#a1a1aa", fontSize: "14px", lineHeight: 1.6, margin: "0 0 24px" }}>
          Para usar nuestra tienda necesitamos que aceptes nuestros términos y la política de privacidad conforme a la
          Ley 1581 de 2012.
        </p>

        <label
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "flex-start",
            cursor: "pointer",
            marginBottom: "16px",
          }}
        >
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            style={{
              width: "18px",
              height: "18px",
              accentColor: "#d91920",
              marginTop: "2px",
              flexShrink: 0,
              cursor: "pointer",
            }}
          />
          <span style={{ color: "#a1a1aa", fontSize: "13px", lineHeight: 1.6 }}>
            He leído y acepto los{" "}
            <Link href="/terminos" target="_blank" rel="noopener noreferrer" style={{ color: "#f7e047" }}>
              Términos y condiciones
            </Link>{" "}
            y la{" "}
            <Link href="/privacidad" target="_blank" rel="noopener noreferrer" style={{ color: "#f7e047" }}>
              Política de privacidad
            </Link>{" "}
            de Big Boys Gym.
          </span>
        </label>

        <label
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "flex-start",
            cursor: "pointer",
            marginBottom: "28px",
          }}
        >
          <input
            type="checkbox"
            checked={marketing}
            onChange={(e) => setMarketing(e.target.checked)}
            style={{
              width: "18px",
              height: "18px",
              accentColor: "#d91920",
              marginTop: "2px",
              flexShrink: 0,
              cursor: "pointer",
            }}
          />
          <span style={{ color: "#71717a", fontSize: "13px", lineHeight: 1.6 }}>
            Quiero recibir ofertas y novedades de Big Boys Gym por email. (Opcional)
          </span>
        </label>

        <button
          type="button"
          onClick={handleAccept}
          disabled={!accepted}
          className="btn-brand"
          style={{
            width: "100%",
            padding: "14px",
            opacity: accepted ? 1 : 0.5,
            cursor: accepted ? "pointer" : "not-allowed",
            fontSize: "13px",
            fontFamily: "var(--font-display)",
            letterSpacing: "3px",
          }}
        >
          ACEPTAR Y CONTINUAR
        </button>

        <p style={{ color: "#3f3f46", fontSize: "11px", textAlign: "center", marginTop: "16px" }}>
          Podés ver y revocar tu consentimiento en cualquier momento desde tu perfil.
        </p>
      </div>
    </div>
  );
}
