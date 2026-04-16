"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BackButton } from "@/components/back-button";
import { TiltCard } from "@/components/tilt-card";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";

export type TrainingListItem = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  priceLabel: string | null;
  imageUrl: string | null;
  icon: string | null;
  featured: boolean;
  schedules: {
    id: string;
    day: string;
    startTime: string;
    endTime: string;
    spots: number | null;
  }[];
};

function trainingsFetchUrl(): string {
  const base = apiUrl.replace(/\/$/, "");
  return base ? `${base}/api/trainings` : "/api/trainings";
}

export default function EntrenamientosPage() {
  const [trainings, setTrainings] = useState<TrainingListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch(trainingsFetchUrl())
      .then((r) => (r.ok ? r.json() : Promise.resolve([])))
      .then((data: TrainingListItem[]) => setTrainings(Array.isArray(data) ? data : []))
      .catch(() => setTrainings([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--black)",
        overflowX: "hidden",
      }}
    >
      <section
        data-reveal
        style={{
          minHeight: "min(92vh, 900px)",
          position: "relative",
          padding: "72px 24px 64px",
          textAlign: "center",
          borderBottom: "1px solid rgba(204,0,0,0.2)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "24px",
            left: "24px",
            zIndex: 4,
          }}
        >
          <BackButton href="/" label="← Inicio" />
        </div>

        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `
              radial-gradient(ellipse at 20% 40%, rgba(204,0,0,0.12) 0%, transparent 55%),
              radial-gradient(ellipse at 80% 60%, rgba(139,0,0,0.1) 0%, transparent 55%),
              radial-gradient(ellipse at 50% 100%, rgba(204,0,0,0.06) 0%, transparent 50%)
            `,
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            position: "absolute",
            right: "-8%",
            top: "50%",
            transform: "translateY(-50%)",
            width: "min(55vw, 480px)",
            opacity: 0.12,
            filter: "blur(2px)",
            animation: "float 8s ease-in-out infinite",
            pointerEvents: "none",
            zIndex: 0,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/logo-BigBoysGYM.jpg"
            alt=""
            style={{ width: "100%", height: "auto", filter: "drop-shadow(0 0 40px rgba(204,0,0,0.5))" }}
          />
        </div>

        <div style={{ position: "relative", zIndex: 2 }}>
          <div className="badge-neon" style={{ marginBottom: "20px" }}>
            Big Boys Gym · Planes
          </div>

          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(36px, 8vw, 80px)",
              color: "#ffffff",
              textTransform: "uppercase",
              letterSpacing: "6px",
              lineHeight: 1.05,
              margin: "0 0 8px",
            }}
          >
            Entren
            <span className="text-neon">amientos</span>
          </h1>

          <div className="neon-line" style={{ width: "100px", margin: "0 auto 24px" }} />

          <p
            style={{
              color: "rgba(255,255,255,0.55)",
              fontSize: "clamp(14px, 2vw, 18px)",
              maxWidth: "560px",
              margin: "0 auto 36px",
              lineHeight: 1.65,
              fontFamily: "var(--font-body)",
              fontWeight: 500,
            }}
          >
            Todo lo que necesitás para llevar tu entrenamiento al siguiente nivel. Rutinas, consejos y más. 💪
          </p>

          <div
            style={{
              display: "flex",
              gap: "28px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            {[
              { valor: "∞", label: "Rutinas" },
              { valor: "100%", label: "Gratis" },
              { valor: "24/7", label: "Disponible" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="glass"
                style={{
                  padding: "16px 28px",
                  minWidth: "120px",
                  borderRadius: "4px",
                }}
              >
                <p
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "26px",
                    color: "var(--gold)",
                    margin: "0 0 6px",
                    letterSpacing: "2px",
                    textShadow: "var(--glow-gold)",
                  }}
                >
                  {stat.valor}
                </p>
                <p
                  style={{
                    color: "rgba(255,255,255,0.4)",
                    fontSize: "10px",
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

      <section
        data-reveal="left"
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "56px 24px 80px",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-display)",
            marginBottom: "36px",
            textAlign: "center",
            fontSize: "11px",
            letterSpacing: "6px",
            textTransform: "uppercase",
            color: "var(--gold)",
          }}
        >
          Nuestros planes
        </p>

        {loading ? (
          <p
            style={{
              textAlign: "center",
              fontSize: "14px",
              color: "rgba(255,255,255,0.45)",
              fontFamily: "var(--font-body)",
            }}
          >
            Cargando planes…
          </p>
        ) : trainings.length === 0 ? (
          <div
            className="glass"
            style={{
              textAlign: "center",
              padding: "48px 24px",
              borderRadius: "8px",
            }}
          >
            <p style={{ color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-body)" }}>
              No hay planes disponibles por ahora.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "24px",
            }}
          >
            {trainings.map((training) => (
              <Link
                key={training.id}
                href={`/entrenamientos/${training.slug}`}
                style={{ textDecoration: "none" }}
              >
                <TiltCard
                  className="card-3d"
                  intensity={8}
                  style={{
                    overflow: "hidden",
                    cursor: "pointer",
                    position: "relative",
                    borderRadius: "4px",
                  }}
                >
                  {training.featured ? (
                    <div
                      style={{
                        position: "absolute",
                        top: "12px",
                        right: "12px",
                        background: "var(--gold)",
                        color: "var(--black)",
                        fontFamily: "var(--font-display)",
                        fontSize: "9px",
                        letterSpacing: "2px",
                        textTransform: "uppercase",
                        padding: "4px 10px",
                        zIndex: 2,
                        boxShadow: "var(--glow-gold)",
                      }}
                    >
                      DESTACADO
                    </div>
                  ) : null}

                  <div
                    style={{
                      width: "100%",
                      height: "200px",
                      overflow: "hidden",
                      background: "var(--black-3)",
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {training.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={training.imageUrl}
                        alt={training.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          transition: "transform 0.3s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "scale(1.05)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "scale(1)";
                        }}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: "64px", opacity: 0.3 }}>{training.icon ?? "🏋️"}</span>
                    )}

                    <div
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: "linear-gradient(transparent, rgba(5,5,5,0.95))",
                        padding: "24px 16px 12px",
                      }}
                    >
                      <p
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: "22px",
                          color: "var(--gold)",
                          margin: 0,
                          letterSpacing: "2px",
                          textShadow: "var(--glow-gold)",
                        }}
                      >
                        ${Number(training.price).toLocaleString("es-CO")}
                      </p>
                      <p
                        style={{
                          color: "#71717a",
                          fontSize: "12px",
                          margin: 0,
                          fontFamily: "var(--font-display)",
                          letterSpacing: "1px",
                        }}
                      >
                        {training.priceLabel ?? "por mes"}
                      </p>
                    </div>
                  </div>

                  <div style={{ padding: "20px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        marginBottom: "8px",
                      }}
                    >
                      <span style={{ fontSize: "24px" }}>{training.icon ?? "🏋️"}</span>
                      <h2
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: "18px",
                          color: "#ffffff",
                          textTransform: "uppercase",
                          letterSpacing: "2px",
                          margin: 0,
                        }}
                      >
                        {training.name}
                      </h2>
                    </div>

                    <p
                      style={{
                        color: "#71717a",
                        fontSize: "13px",
                        lineHeight: 1.6,
                        margin: "0 0 16px",
                      }}
                    >
                      {training.description}
                    </p>

                    {training.schedules?.length > 0 ? (
                      <div
                        style={{
                          display: "flex",
                          gap: "6px",
                          flexWrap: "wrap",
                          marginBottom: "16px",
                        }}
                      >
                        {training.schedules.slice(0, 2).map((s) => (
                          <span
                            key={s.id}
                            style={{
                              background: "var(--glass-bg)",
                              border: "1px solid var(--glass-border)",
                              color: "rgba(255,255,255,0.55)",
                              fontSize: "11px",
                              padding: "3px 8px",
                              fontFamily: "var(--font-display)",
                              letterSpacing: "1px",
                            }}
                          >
                            {s.day} {s.startTime}
                          </span>
                        ))}
                        {training.schedules.length > 2 ? (
                          <span style={{ color: "#52525b", fontSize: "11px", padding: "3px 0" }}>
                            +{training.schedules.length - 2} más
                          </span>
                        ) : null}
                      </div>
                    ) : null}

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <span
                        style={{
                          color: "var(--red-neon)",
                          fontFamily: "var(--font-display)",
                          fontSize: "12px",
                          letterSpacing: "2px",
                          textTransform: "uppercase",
                          textShadow: "var(--glow-sm)",
                        }}
                      >
                        Ver detalle →
                      </span>
                      {training.schedules?.[0]?.spots != null && training.schedules[0].spots > 0 ? (
                        <span style={{ color: "#22c55e", fontSize: "11px" }}>
                          {training.schedules[0].spots} cupos
                        </span>
                      ) : null}
                    </div>
                  </div>
                </TiltCard>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
