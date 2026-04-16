"use client";

import Link from "next/link";
import { BrandsSlider } from "@/components/brands-slider";
import { HomeRegisterCta } from "@/components/home-register-cta";
import { TiltCard } from "@/components/tilt-card";
import { useCounter } from "@/hooks/use-counter";
import { useMagnetic } from "@/hooks/use-magnetic";
import { useParallax } from "@/hooks/use-parallax";
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

function StatBlock({
  icon,
  end,
  suffix,
  label,
  delay,
}: {
  icon: string;
  end: number;
  suffix: "+" | "%" | "";
  label: string;
  delay: string;
}) {
  const { count, ref } = useCounter(end, 2200);
  const display =
    suffix === "%" ? `${count}%` : suffix === "+" ? `${count}+` : `${count}`;

  return (
    <div ref={ref} data-reveal data-reveal-delay={delay}>
      <TiltCard
        className="card-3d glass"
        intensity={7}
        style={{
          padding: "32px 24px",
          textAlign: "center",
          cursor: "default",
          borderRadius: "4px",
        }}
      >
        <span style={{ fontSize: "40px", display: "block", marginBottom: "12px" }}>{icon}</span>
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
          {display}
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
          {label}
        </p>
      </TiltCard>
    </div>
  );
}

export function HomePageView({
  trainings,
  products,
}: {
  trainings: TrainingCard[];
  products: ProductListItem[];
}) {
  const heroParallax = useParallax(0.12);
  const subtitle = useTypewriter(TYPEWRITER_TEXTS, 72, 2200);

  const magnetTienda = useMagnetic(0.28);
  const magnetEntren = useMagnetic(0.28);

  return (
    <main style={{ position: "relative", zIndex: 1, flex: 1 }}>
      <section
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
            transform: `translateY(${heroParallax * 0.4}px)`,
            background: `
              radial-gradient(ellipse at 20% 50%, rgba(204,0,0,0.15) 0%, transparent 60%),
              radial-gradient(ellipse at 80% 50%, rgba(139,0,0,0.1) 0%, transparent 60%),
              radial-gradient(ellipse at 50% 100%, rgba(204,0,0,0.05) 0%, transparent 50%)`,
          }}
        />

        <div
          style={{
            position: "absolute",
            right: "-5%",
            top: "50%",
            transform: `translateY(calc(-50% + ${heroParallax * 0.2}px))`,
            width: "55%",
            opacity: 0.12,
            filter: "blur(1px)",
            animation: "float 8s ease-in-out infinite",
            pointerEvents: "none",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/logo-BigBoysGYM.jpg"
            alt=""
            style={{ width: "100%", filter: "drop-shadow(0 0 60px rgba(204,0,0,0.8))" }}
          />
        </div>

        <div
          className="home-hero-logo-foreground"
          style={{
            position: "absolute",
            right: "5%",
            top: "50%",
            transform: `translateY(calc(-50% + ${heroParallax * 0.35}px))`,
            width: "min(40%, 420px)",
            animation: "float 6s ease-in-out infinite",
            filter: "drop-shadow(0 0 30px rgba(204,0,0,0.5))",
            zIndex: 2,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-BigBoysGYM.jpg" alt="" style={{ width: "100%" }} />
        </div>

        <div
          style={{
            position: "relative",
            zIndex: 3,
            maxWidth: "640px",
            padding: "0 clamp(16px, 4vw, 48px)",
          }}
        >
          <div className="badge-neon" style={{ marginBottom: "24px" }}>
            ⚡ Manizales · Colombia
          </div>

          <h1
            style={{
              fontFamily: "var(--font-display), Impact, sans-serif",
              fontSize: "clamp(48px, 8vw, 96px)",
              color: "#ffffff",
              textTransform: "uppercase",
              letterSpacing: "4px",
              lineHeight: 1,
              marginBottom: "8px",
              animation: "slide-in-left 0.8s ease forwards",
            }}
          >
            BIG BOYS
          </h1>
          <h1
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
          </h1>

          <div className="neon-line" style={{ marginBottom: "24px", width: "120px" }} />

          <p
            style={{
              color: "rgba(255,255,255,0.75)",
              fontSize: "18px",
              lineHeight: 1.7,
              marginBottom: "40px",
              fontFamily: "var(--font-body), system-ui, sans-serif",
              fontWeight: 500,
              minHeight: "32px",
            }}
          >
            {subtitle}
            <span
              style={{
                display: "inline-block",
                borderRight: "2px solid #CC0000",
                animation: "blink 1s step-end infinite",
                marginLeft: "4px",
                height: "1.1em",
                verticalAlign: "text-bottom",
                width: "2px",
              }}
              aria-hidden
            />
          </p>

          <div
            style={{
              display: "flex",
              gap: "16px",
              flexWrap: "wrap",
              animation: "slide-up 0.8s 0.6s ease forwards",
              opacity: 0,
              animationFillMode: "forwards",
            }}
          >
            <span ref={magnetTienda} style={{ display: "inline-block" }}>
              <Link href="/tienda" className="btn-primary">
                🛍️ Ver tienda
              </Link>
            </span>
            <span ref={magnetEntren} style={{ display: "inline-block" }}>
              <Link href="/entrenamientos" className="btn-outline">
                🏋️ Entrenamientos
              </Link>
            </span>
            <HomeRegisterCta />
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: "32px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
            animation: "float 2s ease-in-out infinite",
          }}
        >
          <span
            style={{
              color: "var(--gray-dark)",
              fontSize: "11px",
              fontFamily: "var(--font-display), Impact, sans-serif",
              letterSpacing: "3px",
            }}
          >
            SCROLL
          </span>
          <div
            style={{
              width: "1px",
              height: "40px",
              background: "linear-gradient(var(--red), transparent)",
              boxShadow: "var(--glow-sm)",
            }}
          />
        </div>
      </section>

      <section
        data-reveal
        style={{
          padding: "clamp(48px, 8vw, 80px) 24px",
          position: "relative",
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
          <StatBlock icon="👥" end={500} suffix="+" label="Miembros activos" delay="1" />
          <StatBlock icon="🏆" end={10} suffix="+" label="Años de experiencia" delay="2" />
          <StatBlock icon="💪" end={4} suffix="" label="Planes de entrenamiento" delay="3" />
          <StatBlock icon="⚡" end={100} suffix="%" label="Compromiso contigo" delay="4" />
        </div>
      </section>

      <section
        data-reveal="left"
        style={{ padding: "clamp(64px, 10vw, 100px) 24px", maxWidth: "1200px", margin: "0 auto" }}
      >
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
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
        </div>

        {trainings.length === 0 ? (
          <p style={{ textAlign: "center", color: "rgba(255,255,255,0.45)" }}>
            Cargá el API para ver planes de entrenamiento.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "24px",
            }}
          >
            {trainings.map((t) => (
              <div key={t.id} data-reveal>
                <Link href={`/entrenamientos/${t.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <TiltCard
                    className="card-3d glass"
                    intensity={8}
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
                    <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "14px", flex: 1, lineHeight: 1.5 }}>
                      {t.description}
                    </p>
                    <p
                      style={{
                        marginTop: "16px",
                        fontFamily: "var(--font-display), Impact, sans-serif",
                        color: "var(--gold)",
                        letterSpacing: "2px",
                      }}
                    >
                      ${Number(t.price).toLocaleString("es-CO")}{" "}
                      <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>
                        {t.priceLabel ?? "por mes"}
                      </span>
                    </p>
                  </TiltCard>
                </Link>
              </div>
            ))}
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: "40px" }}>
          <Link href="/entrenamientos" className="btn-outline">
            Ver todos →
          </Link>
        </div>
      </section>

      <section
        data-reveal="right"
        style={{
          padding: "clamp(64px, 10vw, 100px) 24px",
          borderTop: "1px solid rgba(204,0,0,0.15)",
          background: "rgba(255,255,255,0.02)",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
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
              PRODUCTOS{" "}
              <span style={{ color: "var(--red-neon)", textShadow: "var(--glow-red)" }}>DESTACADOS</span>
            </h2>
            <div className="neon-line" style={{ width: "80px", margin: "20px auto" }} />
          </div>

          {products.length === 0 ? (
            <p style={{ textAlign: "center", color: "rgba(255,255,255,0.45)" }}>
              No hay productos para mostrar.
            </p>
          ) : (
            <div
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
                  <div key={p.id} data-reveal>
                    <Link href={`/tienda/productos/${slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                      <TiltCard
                        className="card-3d glass"
                        intensity={7}
                        style={{
                          overflow: "hidden",
                          borderRadius: "4px",
                          display: "flex",
                          flexDirection: "column",
                          height: "100%",
                        }}
                      >
                        <div
                          style={{
                            aspectRatio: "4/3",
                            background: "#0a0a0a",
                            position: "relative",
                            overflow: "hidden",
                          }}
                        >
                          {img ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={img}
                              alt={p.title}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
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
                          <h3 style={{ fontSize: "15px", marginBottom: "8px", color: "#fff", lineHeight: 1.3 }}>
                            {p.title}
                          </h3>
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
                      </TiltCard>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ textAlign: "center", marginTop: "40px" }}>
            <Link href="/tienda" className="btn-primary">
              Ir a la tienda
            </Link>
          </div>
        </div>
      </section>

      <div className="glass" style={{ borderTop: "1px solid rgba(204,0,0,0.2)", borderBottom: "1px solid rgba(204,0,0,0.2)" }}>
        <BrandsSlider velocidad={25} pausarAlHover />
      </div>

      <section
        data-reveal="scale"
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
            <span style={{ color: "var(--red-neon)", textShadow: "var(--glow-red)", display: "block" }}>
              SIGUIENTE NIVEL?
            </span>
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
            <Link href="/entrenamientos" className="btn-primary" style={{ fontSize: "16px", padding: "18px 40px" }}>
              🏋️ Empezar ahora
            </Link>
            <a
              href="https://wa.me/573171184925"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline"
              style={{ fontSize: "16px", padding: "18px 40px" }}
            >
              💬 Hablar con un asesor
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
