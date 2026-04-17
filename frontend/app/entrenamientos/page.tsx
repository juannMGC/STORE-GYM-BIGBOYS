"use client";

import { motion, useMotionValue, useTransform } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { BackButton } from "@/components/back-button";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { fadeUp, staggerContainer, staggerSlow } from "@/lib/motion";

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

function useTiltEnabled() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 769px)");
    setEnabled(mq.matches);
    const h = () => setEnabled(mq.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);
  return enabled;
}

function TrainingCard({ training }: { training: TrainingListItem }) {
  const tiltEnabled = useTiltEnabled();
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [10, -10]);
  const rotateY = useTransform(x, [-100, 100], [-10, 10]);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!tiltEnabled) return;
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div variants={fadeUp}>
      <div style={{ perspective: 1000 }}>
        <motion.div
          ref={cardRef}
          style={{
            rotateX: tiltEnabled ? rotateX : 0,
            rotateY: tiltEnabled ? rotateY : 0,
            transformStyle: "preserve-3d",
          }}
          whileHover={{ scale: tiltEnabled ? 1.03 : 1.02 }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          transition={{ type: "spring", stiffness: 200, damping: 22 }}
        >
        <Link href={`/entrenamientos/${training.slug}`} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
          <div
            className="card-3d"
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
                <motion.img
                  src={training.imageUrl}
                  alt={training.name}
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.35 }}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
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
                  <span style={{ color: "#22c55e", fontSize: "11px" }}>{training.schedules[0].spots} cupos</span>
                ) : null}
              </div>
            </div>
          </div>
        </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default function EntrenamientosPage() {
  const bp = useBreakpoint();
  const isMobile = bp === "sm";
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
        style={{
          minHeight: "min(92vh, 900px)",
          position: "relative",
          padding: isMobile ? "64px 16px 48px" : "72px 24px 64px",
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

        <motion.div
          animate={{
            y: [0, -12, 0],
            rotateY: [0, 4, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            position: "absolute",
            right: "-8%",
            top: "50%",
            transform: "translateY(-50%)",
            width: "min(55vw, 480px)",
            opacity: 0.12,
            filter: "blur(2px)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/logo-BigBoysGYM.png"
            alt=""
            style={{ width: "100%", height: "auto", filter: "drop-shadow(0 0 40px rgba(204,0,0,0.5))" }}
          />
        </motion.div>

        <div style={{ position: "relative", zIndex: 2 }}>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
          >
            <motion.div variants={fadeUp} className="badge-neon" style={{ marginBottom: "20px" }}>
              Big Boys Gym · Planes
            </motion.div>

            <motion.h1
              variants={fadeUp}
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
            </motion.h1>

            <motion.div
              variants={fadeUp}
              className="neon-line"
              initial={{ width: 0 }}
              animate={{ width: "100px" }}
              transition={{ duration: 0.9, delay: 0.4 }}
              style={{ margin: "0 auto 24px" }}
            />

            <motion.p
              variants={fadeUp}
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
            </motion.p>

            <motion.div
              variants={staggerContainer}
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
                <motion.div
                  key={stat.label}
                  variants={fadeUp}
                  whileHover={{
                    y: -8,
                    boxShadow: "0 0 24px rgba(204,0,0,0.25), 0 16px 32px rgba(0,0,0,0.45)",
                    borderColor: "rgba(204,0,0,0.35)",
                  }}
                  transition={{ type: "spring", stiffness: 320 }}
                  className="glass"
                  style={{
                    padding: "16px 28px",
                    minWidth: "120px",
                    borderRadius: "4px",
                    border: "1px solid rgba(255,255,255,0.06)",
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
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: isMobile ? "40px 16px 56px" : "56px 24px 80px",
        }}
      >
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
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
        </motion.p>

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
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
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
          </motion.div>
        ) : (
          <motion.div
            variants={staggerSlow}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            style={{
              display: "grid",
              gridTemplateColumns: isMobile
                ? "1fr"
                : "repeat(2, minmax(0, 1fr))",
              gap: isMobile ? "16px" : "24px",
            }}
          >
            {trainings.map((training) => (
              <TrainingCard key={training.id} training={training} />
            ))}
          </motion.div>
        )}
      </section>
    </main>
  );
}
