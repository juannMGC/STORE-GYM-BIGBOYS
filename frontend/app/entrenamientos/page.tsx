"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BackButton } from "@/components/back-button";

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
        background: "#050505",
      }}
    >
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

        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at center top, rgba(217,25,32,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

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

      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "48px 24px 64px",
        }}
      >
        <p
          className="font-display mb-8 text-center text-xs uppercase tracking-[0.35em] text-brand-yellow"
          style={{ letterSpacing: "4px" }}
        >
          Nuestros planes
        </p>

        {loading ? (
          <p className="text-center text-sm text-zinc-500">Cargando planes…</p>
        ) : trainings.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "48px 24px",
              border: "1px dashed #2a2a2a",
              background: "#0a0a0a",
            }}
          >
            <p className="text-zinc-500">No hay planes disponibles por ahora.</p>
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
                <div
                  className="panel-brand"
                  style={{
                    overflow: "hidden",
                    transition: "border-color 0.2s, transform 0.2s",
                    cursor: "pointer",
                    position: "relative",
                    border: "1px solid #2a2a2a",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#d91920";
                    e.currentTarget.style.transform = "translateY(-4px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#2a2a2a";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {training.featured ? (
                    <div
                      style={{
                        position: "absolute",
                        top: "12px",
                        right: "12px",
                        background: "#f7e047",
                        color: "#050505",
                        fontFamily: "var(--font-display)",
                        fontSize: "9px",
                        letterSpacing: "2px",
                        textTransform: "uppercase",
                        padding: "4px 10px",
                        zIndex: 2,
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
                      background: "#1a1a1a",
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
                          color: "#f7e047",
                          margin: 0,
                          letterSpacing: "2px",
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
                              background: "#1a1a1a",
                              border: "1px solid #2a2a2a",
                              color: "#a1a1aa",
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
                          color: "#d91920",
                          fontFamily: "var(--font-display)",
                          fontSize: "12px",
                          letterSpacing: "2px",
                          textTransform: "uppercase",
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
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
