"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050505",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Fondo decorativo — número 404 gigante */}
      <div
        style={{
          position: "absolute",
          fontSize: "clamp(200px, 40vw, 400px)",
          fontFamily: "var(--font-display)",
          color: "#1a1a1a",
          fontWeight: 900,
          letterSpacing: "-10px",
          userSelect: "none",
          lineHeight: 1,
          zIndex: 0,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        404
      </div>

      {/* Contenido principal */}
      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Badge rojo */}
        <div
          style={{
            display: "inline-block",
            background: "#d91920",
            color: "white",
            fontFamily: "var(--font-display)",
            fontSize: "12px",
            letterSpacing: "4px",
            textTransform: "uppercase",
            padding: "6px 16px",
            marginBottom: "24px",
          }}
        >
          Error 404
        </div>

        {/* Título */}
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(32px, 8vw, 72px)",
            color: "#ffffff",
            textTransform: "uppercase",
            letterSpacing: "4px",
            lineHeight: 1.1,
            margin: "0 0 16px",
          }}
        >
          Página no
          <br />
          <span style={{ color: "#f7e047" }}>encontrada</span>
        </h1>

        {/* Descripción */}
        <p
          style={{
            color: "#71717a",
            fontSize: "16px",
            maxWidth: "400px",
            margin: "0 auto 40px",
            lineHeight: 1.6,
          }}
        >
          La página que buscás no existe o fue movida. Volvé al inicio y seguí entrenando. 💪
        </p>

        {/* Botones */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/"
            className="btn-brand"
            style={{
              display: "inline-block",
              padding: "14px 32px",
              fontFamily: "var(--font-display)",
              fontSize: "14px",
              letterSpacing: "3px",
              textTransform: "uppercase",
              textDecoration: "none",
            }}
          >
            ← Volver al inicio
          </Link>

          <Link
            href="/tienda"
            className="btn-brand-outline"
            style={{
              display: "inline-block",
              padding: "14px 32px",
              fontFamily: "var(--font-display)",
              fontSize: "14px",
              letterSpacing: "3px",
              textTransform: "uppercase",
              textDecoration: "none",
            }}
          >
            Ir a la tienda
          </Link>
        </div>

        {/* Links rápidos */}
        <div
          style={{
            marginTop: "48px",
            paddingTop: "32px",
            borderTop: "1px solid #2a2a2a",
          }}
        >
          <p
            style={{
              color: "#52525b",
              fontSize: "12px",
              letterSpacing: "2px",
              textTransform: "uppercase",
              marginBottom: "16px",
              fontFamily: "var(--font-display)",
            }}
          >
            Links rápidos
          </p>
          <div
            style={{
              display: "flex",
              gap: "24px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            {[
              { href: "/", label: "Inicio" },
              { href: "/tienda", label: "Tienda" },
              { href: "/auth/login", label: "Mi cuenta" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  color: "#f7e047",
                  textDecoration: "none",
                  fontSize: "13px",
                  fontFamily: "var(--font-display)",
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  opacity: 0.7,
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = "1";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "0.7";
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Firma Big Boys */}
        <p
          style={{
            marginTop: "48px",
            color: "#3f3f46",
            fontSize: "12px",
            letterSpacing: "3px",
            fontFamily: "var(--font-display)",
            textTransform: "uppercase",
          }}
        >
          Big Boys Gym · Manizales, Colombia
        </p>
      </div>
    </div>
  );
}
