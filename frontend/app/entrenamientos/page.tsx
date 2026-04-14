import type { Metadata } from "next";
import { BackButton } from "@/components/back-button";

export const metadata: Metadata = {
  title: "Entrenamientos",
  description:
    "Rutinas, consejos y todo lo que necesitás para entrenar en Big Boys Gym. Manizales, Colombia.",
  robots: { index: true, follow: true },
};

export default function EntrenamientosPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#050505",
      }}
    >
      {/* Hero de la sección */}
      <section
        style={{
          position: "relative",
          padding: "80px 24px 60px",
          textAlign: "center",
          borderBottom: "1px solid #1a1a1a",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "24px",
            left: "24px",
            zIndex: 2,
          }}
        >
          <BackButton href="/" label="← Inicio" />
        </div>

        {/* Fondo decorativo */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at center top, rgba(217,25,32,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Número decorativo de fondo */}
        <div
          style={{
            position: "absolute",
            fontSize: "300px",
            fontFamily: "var(--font-display)",
            color: "#0d0d0d",
            fontWeight: 900,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            lineHeight: 1,
            userSelect: "none",
            pointerEvents: "none",
            letterSpacing: "-10px",
          }}
        >
          BB
        </div>

        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Badge */}
          <div
            style={{
              display: "inline-block",
              background: "#d91920",
              color: "white",
              fontFamily: "var(--font-display)",
              fontSize: "11px",
              letterSpacing: "4px",
              textTransform: "uppercase",
              padding: "6px 16px",
              marginBottom: "20px",
            }}
          >
            Big Boys Gym
          </div>

          {/* Título */}
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(36px, 8vw, 80px)",
              color: "#ffffff",
              textTransform: "uppercase",
              letterSpacing: "6px",
              lineHeight: 1.1,
              margin: "0 0 16px",
            }}
          >
            Entren
            <span style={{ color: "#d91920" }}>amientos</span>
          </h1>

          {/* Descripción */}
          <p
            style={{
              color: "#71717a",
              fontSize: "clamp(14px, 2vw, 18px)",
              maxWidth: "560px",
              margin: "0 auto 32px",
              lineHeight: 1.6,
            }}
          >
            Todo lo que necesitás para llevar tu entrenamiento al siguiente nivel. Rutinas, consejos y más. 💪
          </p>

          {/* Stats rápidas */}
          <div
            style={{
              display: "flex",
              gap: "32px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            {[
              { valor: "∞", label: "Rutinas" },
              { valor: "100%", label: "Gratis" },
              { valor: "24/7", label: "Disponible" },
            ].map((stat) => (
              <div key={stat.label}>
                <p
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "28px",
                    color: "#f7e047",
                    margin: "0 0 4px",
                    letterSpacing: "2px",
                  }}
                >
                  {stat.valor}
                </p>
                <p
                  style={{
                    color: "#52525b",
                    fontSize: "11px",
                    fontFamily: "var(--font-display)",
                    letterSpacing: "3px",
                    textTransform: "uppercase",
                    margin: 0,
                  }}
                >
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contenido principal — placeholder */}
      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "64px 24px",
        }}
      >
        <div
          style={{
            textAlign: "center",
            padding: "80px 24px",
            border: "1px dashed #2a2a2a",
            background: "#0a0a0a",
          }}
        >
          <p
            style={{
              fontSize: "48px",
              marginBottom: "16px",
            }}
          >
            🏋️
          </p>
          <p
            style={{
              fontFamily: "var(--font-display)",
              color: "#3f3f46",
              fontSize: "14px",
              letterSpacing: "4px",
              textTransform: "uppercase",
              marginBottom: "8px",
            }}
          >
            Contenido próximamente
          </p>
          <p
            style={{
              color: "#27272a",
              fontSize: "13px",
            }}
          >
            Estamos preparando el mejor contenido de entrenamiento para vos.
          </p>
        </div>
      </section>
    </main>
  );
}
