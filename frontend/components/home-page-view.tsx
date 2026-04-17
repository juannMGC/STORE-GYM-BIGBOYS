"use client";

import Link from "next/link";
import { animate, motion, useInView, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { BrandsSlider } from "@/components/brands-slider";
import { HomeRegisterCta } from "@/components/home-register-cta";
import {
  fadeLeft,
  fadeUp,
  floatAnimation,
  glitchVariants,
  scaleIn,
  staggerContainer,
  staggerSlow,
} from "@/lib/motion";
import { useTypewriter } from "@/hooks/use-typewriter";
import type { ProductListItem } from "@/lib/types";

type TrainingCard = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  priceLabel: string | null;
  imageUrl: string | null;
  icon: string | null;
  featured: boolean;
};

const TYPEWRITER_TEXTS = [
  "El gym más intenso de Manizales. 💪",
  "Transforma tu cuerpo. Supera tus límites.",
  "Suplementación premium. Resultados reales.",
  "Entrená como campeón. Viví como Big Boy.",
];

function AnimatedCounter({
  end,
  suffix = "",
  duration = 2,
}: {
  end: number;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.35 });
  const [displayed, setDisplayed] = useState("0");

  useEffect(() => {
    if (!isInView) return;
    const controls = animate(0, end, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => setDisplayed(String(Math.round(v))),
    });
    return () => controls.stop();
  }, [isInView, end, duration]);

  return (
    <span ref={ref}>
      {displayed}
      {suffix}
    </span>
  );
}

const STATS = [
  { icon: "👥", end: 500, suffix: "+" as const, label: "Miembros activos" },
  { icon: "🏆", end: 10, suffix: "+" as const, label: "Años de experiencia" },
  { icon: "💪", end: 4, suffix: "" as const, label: "Planes de entrenamiento" },
  { icon: "⚡", end: 100, suffix: "%" as const, label: "Compromiso contigo" },
];

export function HomePageView({
  trainings,
  products,
}: {
  trainings: TrainingCard[];
  products: ProductListItem[];
}) {
  const heroRef = useRef<HTMLElement>(null);
  const subtitle = useTypewriter(TYPEWRITER_TEXTS, 72, 2200);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const logoY = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const logoOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const logoScale = useTransform(scrollYProgress, [0, 1], [1, 1.3]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, -100]);

  return (
    <main style={{ position: "relative", zIndex: 1, flex: 1 }}>
      <section
        ref={heroRef}
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `
              radial-gradient(ellipse at 20% 50%, rgba(204,0,0,0.15) 0%, transparent 60%),
              radial-gradient(ellipse at 80% 50%, rgba(139,0,0,0.1) 0%, transparent 60%),
              radial-gradient(ellipse at 50% 100%, rgba(204,0,0,0.05) 0%, transparent 50%)`,
          }}
        />

        <motion.div
          style={{
            position: "absolute",
            right: "-5%",
            top: "50%",
            y: "-50%",
            width: "55%",
            opacity: 0.12,
            filter: "blur(1px)",
            pointerEvents: "none",
          }}
        >
          <motion.div animate={floatAnimation.animate} transition={floatAnimation.transition}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/logo-BigBoysGYM.jpg"
              alt=""
              style={{ width: "100%", filter: "drop-shadow(0 0 60px rgba(204,0,0,0.8))" }}
            />
          </motion.div>
        </motion.div>

        <div
          className="home-hero-logo-foreground"
          style={{
            position: "absolute",
            right: "5%",
            top: "50%",
            transform: "translateY(-50%)",
            width: "min(40%, 420px)",
            zIndex: 2,
          }}
        >
          <motion.div
            style={{
              y: logoY,
              opacity: logoOpacity,
              scale: logoScale,
              filter: "drop-shadow(0 0 30px rgba(204,0,0,0.5))",
            }}
          >
            <motion.div animate={floatAnimation.animate} transition={floatAnimation.transition}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/logo-BigBoysGYM.jpg" alt="" style={{ width: "100%" }} />
            </motion.div>
          </motion.div>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          style={{
            position: "relative",
            zIndex: 3,
            maxWidth: "640px",
            padding: "0 clamp(16px, 4vw, 48px)",
            y: textY,
          }}
        >
          <motion.div variants={fadeUp} className="badge-neon" style={{ marginBottom: "24px" }}>
            ⚡ Manizales · Colombia
          </motion.div>

          <motion.h1
            variants={fadeLeft}
            style={{
              fontFamily: "var(--font-display), Impact, sans-serif",
              fontSize: "clamp(48px, 8vw, 96px)",
              color: "#ffffff",
              textTransform: "uppercase",
              letterSpacing: "4px",
              lineHeight: 1,
              marginBottom: "8px",
            }}
          >
            BIG BOYS
          </motion.h1>

          <motion.h1
            variants={glitchVariants}
            initial="normal"
            animate="glitch"
            className="glitch"
            data-text="GYM"
            style={{
              fontFamily: "var(--font-display), Impact, sans-serif",
              fontSize: "clamp(48px, 8vw, 96px)",
              color: "var(--red-neon)",
              textTransform: "uppercase",
              letterSpacing: "4px",
              lineHeight: 1,
              marginBottom: "24px",
              textShadow: "var(--glow-red)",
              position: "relative",
            }}
          >
            GYM
          </motion.h1>

          <motion.div
            className="neon-line"
            initial={{ width: 0 }}
            animate={{ width: "120px" }}
            transition={{ duration: 1, delay: 0.8 }}
            style={{ marginBottom: "24px" }}
          />

          <motion.p
            variants={fadeUp}
            style={{
              color: "rgba(255,255,255,0.75)",
              fontSize: "18px",
              lineHeight: 1.7,
              marginBottom: "40px",
              fontFamily: "var(--font-body), system-ui, sans-serif",
              fontWeight: 500,
              minHeight: "60px",
            }}
          >
            {subtitle}
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
              style={{
                display: "inline-block",
                borderRight: "2px solid #CC0000",
                marginLeft: "4px",
                height: "1.1em",
                verticalAlign: "text-bottom",
                width: "3px",
              }}
              aria-hidden
            />
          </motion.p>

          <motion.div
            variants={staggerContainer}
            style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}
          >
            <motion.div variants={scaleIn} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
              <Link href="/tienda" className="btn-primary" style={{ fontSize: "16px", padding: "18px 40px", display: "inline-block" }}>
                🛍️ Ver tienda
              </Link>
            </motion.div>
            <motion.div variants={scaleIn} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
              <Link href="/entrenamientos" className="btn-outline" style={{ fontSize: "16px", padding: "18px 40px", display: "inline-block" }}>
                🏋️ Entrenamientos
              </Link>
            </motion.div>
            <HomeRegisterCta />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          style={{
            position: "absolute",
            bottom: "32px",
            left: "50%",
            x: "-50%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <motion.span
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              color: "var(--gray-dark)",
              fontSize: "11px",
              fontFamily: "var(--font-display), Impact, sans-serif",
              letterSpacing: "3px",
            }}
          >
            SCROLL
          </motion.span>
          <motion.div
            animate={{ scaleY: [0, 1, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            style={{
              width: "1px",
              height: "40px",
              background: "linear-gradient(var(--red), transparent)",
              transformOrigin: "top",
              boxShadow: "var(--glow-sm)",
            }}
          />
        </motion.div>
      </section>

      <motion.section
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        style={{
          padding: "clamp(48px, 8vw, 80px) 24px",
          borderTop: "1px solid rgba(204,0,0,0.2)",
          borderBottom: "1px solid rgba(204,0,0,0.2)",
          background: "linear-gradient(90deg, rgba(204,0,0,0.05), transparent, rgba(204,0,0,0.05))",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "24px",
          }}
        >
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              variants={fadeUp}
              custom={i}
              whileHover={{
                y: -12,
                boxShadow: "0 0 30px rgba(204,0,0,0.3), 0 20px 40px rgba(0,0,0,0.5)",
                borderColor: "rgba(204,0,0,0.5)",
              }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="glass card-3d"
              style={{
                padding: "32px 24px",
                textAlign: "center",
                cursor: "default",
                borderRadius: "4px",
              }}
            >
              <motion.span
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 + i }}
                style={{ fontSize: "40px", display: "block", marginBottom: "12px" }}
              >
                {stat.icon}
              </motion.span>
              <p
                style={{
                  fontFamily: "var(--font-display), Impact, sans-serif",
                  fontSize: "clamp(32px, 6vw, 48px)",
                  color: "var(--red-neon)",
                  textShadow: "var(--glow-red)",
                  lineHeight: 1,
                  marginBottom: "8px",
                  letterSpacing: "2px",
                }}
              >
                <AnimatedCounter end={stat.end} suffix={stat.suffix} duration={2.2} />
              </p>
              <p
                style={{
                  color: "rgba(255,255,255,0.5)",
                  fontSize: "13px",
                  fontFamily: "var(--font-display), Impact, sans-serif",
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                }}
              >
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <section style={{ padding: "clamp(64px, 10vw, 100px) 24px", maxWidth: "1200px", margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          style={{ textAlign: "center", marginBottom: "48px" }}
        >
          <div className="badge-neon" style={{ marginBottom: "16px" }}>
            Nuestros planes
          </div>
          <h2
            style={{
              fontFamily: "var(--font-display), Impact, sans-serif",
              fontSize: "clamp(32px, 5vw, 56px)",
              color: "#ffffff",
              letterSpacing: "6px",
            }}
          >
            ENTREN
            <span style={{ color: "var(--red-neon)", textShadow: "var(--glow-red)" }}>AMIENTOS</span>
          </h2>
          <div className="neon-line" style={{ width: "80px", margin: "20px auto" }} />
        </motion.div>

        {trainings.length === 0 ? (
          <p style={{ textAlign: "center", color: "rgba(255,255,255,0.45)" }}>
            Cargá el API para ver planes de entrenamiento.
          </p>
        ) : (
          <motion.div
            variants={staggerSlow}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "24px",
            }}
          >
            {trainings.map((t) => (
              <motion.div key={t.id} variants={fadeUp} whileHover={{ y: -8, transition: { type: "spring", stiffness: 400 } }}>
                <Link href={`/entrenamientos/${t.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <motion.div
                    className="card-3d glass"
                    whileHover={{ scale: 1.02, boxShadow: "0 0 28px rgba(204,0,0,0.35)" }}
                    transition={{ type: "spring", stiffness: 300 }}
                    style={{
                      padding: "24px",
                      minHeight: "220px",
                      display: "flex",
                      flexDirection: "column",
                      borderRadius: "4px",
                      height: "100%",
                    }}
                  >
                    {t.featured ? (
                      <span className="badge-neon" style={{ alignSelf: "flex-start", marginBottom: "12px" }}>
                        Destacado
                      </span>
                    ) : null}
                    <span style={{ fontSize: "36px", marginBottom: "8px" }}>{t.icon ?? "🏋️"}</span>
                    <h3 style={{ fontSize: "18px", marginBottom: "8px", color: "#fff" }}>{t.name}</h3>
                    <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "14px", flex: 1, lineHeight: 1.5 }}>{t.description}</p>
                    <p
                      style={{
                        marginTop: "16px",
                        fontFamily: "var(--font-display), Impact, sans-serif",
                        color: "var(--gold)",
                        letterSpacing: "2px",
                      }}
                    >
                      ${Number(t.price).toLocaleString("es-CO")}{" "}
                      <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>{t.priceLabel ?? "por mes"}</span>
                    </p>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}

        <div style={{ textAlign: "center", marginTop: "40px" }}>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} style={{ display: "inline-block" }}>
            <Link href="/entrenamientos" className="btn-outline">
              Ver todos →
            </Link>
          </motion.div>
        </div>
      </section>

      <section
        style={{
          padding: "clamp(64px, 10vw, 100px) 24px",
          borderTop: "1px solid rgba(204,0,0,0.15)",
          background: "rgba(255,255,255,0.02)",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: "center", marginBottom: "48px" }}
          >
            <div className="badge-neon" style={{ marginBottom: "16px" }}>
              Tienda oficial
            </div>
            <h2
              style={{
                fontFamily: "var(--font-display), Impact, sans-serif",
                fontSize: "clamp(32px, 5vw, 56px)",
                color: "#ffffff",
                letterSpacing: "6px",
              }}
            >
              PRODUCTOS <span style={{ color: "var(--red-neon)", textShadow: "var(--glow-red)" }}>DESTACADOS</span>
            </h2>
            <div className="neon-line" style={{ width: "80px", margin: "20px auto" }} />
          </motion.div>

          {products.length === 0 ? (
            <p style={{ textAlign: "center", color: "rgba(255,255,255,0.45)" }}>
              No hay productos para mostrar.
            </p>
          ) : (
            <motion.div
              variants={staggerSlow}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: "24px",
              }}
            >
              {products.map((p) => {
                const img = p.images?.[0]?.url;
                const slug = p.slug ?? p.id;
                return (
                  <motion.div key={p.id} variants={scaleIn} whileHover={{ y: -10 }} whileTap={{ scale: 0.98 }}>
                    <Link href={`/tienda/productos/${slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                      <motion.div
                        className="card-3d glass"
                        layout
                        style={{
                          overflow: "hidden",
                          borderRadius: "4px",
                          display: "flex",
                          flexDirection: "column",
                          height: "100%",
                        }}
                      >
                        <div style={{ aspectRatio: "4/3", background: "#0a0a0a", position: "relative", overflow: "hidden" }}>
                          {img ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={img} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                height: "100%",
                                fontSize: "48px",
                                opacity: 0.25,
                              }}
                            >
                              🏋️
                            </div>
                          )}
                        </div>
                        <div style={{ padding: "16px 18px 20px", flex: 1 }}>
                          <h3 style={{ fontSize: "15px", marginBottom: "8px", color: "#fff", lineHeight: 1.3 }}>{p.title}</h3>
                          <p
                            style={{
                              fontFamily: "var(--font-display), Impact, sans-serif",
                              color: "var(--gold)",
                              letterSpacing: "1px",
                            }}
                          >
                            ${Number(p.price).toLocaleString("es-CO")}
                          </p>
                        </div>
                      </motion.div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          <div style={{ textAlign: "center", marginTop: "40px" }}>
            <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.96 }} style={{ display: "inline-block" }}>
              <Link href="/tienda" className="btn-primary">
                Ir a la tienda
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="glass" style={{ borderTop: "1px solid rgba(204,0,0,0.2)", borderBottom: "1px solid rgba(204,0,0,0.2)" }}>
        <BrandsSlider velocidad={25} pausarAlHover />
      </div>

      <motion.section
        initial={{ opacity: 0, scale: 0.94 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        style={{
          padding: "clamp(72px, 12vw, 100px) 24px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse at center, rgba(204,0,0,0.2) 0%, transparent 70%)",
          }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/logo-BigBoysGYM.jpg"
          alt=""
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "min(600px, 90vw)",
            opacity: 0.04,
            filter: "blur(4px)",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", zIndex: 1 }}>
          <h2
            style={{
              fontFamily: "var(--font-display), Impact, sans-serif",
              fontSize: "clamp(32px, 6vw, 72px)",
              color: "#ffffff",
              letterSpacing: "4px",
              marginBottom: "16px",
            }}
          >
            ¿LISTO PARA EL
            <span style={{ color: "var(--red-neon)", textShadow: "var(--glow-red)", display: "block" }}>SIGUIENTE NIVEL?</span>
          </h2>
          <p
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: "18px",
              marginBottom: "40px",
              fontFamily: "var(--font-body), system-ui, sans-serif",
            }}
          >
            Unite al gym que forma campeones. 💪
          </p>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }} style={{ display: "inline-block" }}>
              <Link href="/entrenamientos" className="btn-primary" style={{ fontSize: "16px", padding: "18px 40px" }}>
                🏋️ Empezar ahora
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }} style={{ display: "inline-block" }}>
              <a
                href="https://wa.me/573171184925"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline"
                style={{ fontSize: "16px", padding: "18px 40px" }}
              >
                💬 Hablar con un asesor
              </a>
            </motion.div>
          </div>
        </div>
      </motion.section>
    </main>
  );
}
