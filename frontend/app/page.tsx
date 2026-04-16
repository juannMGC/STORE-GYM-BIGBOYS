import type { Metadata } from "next";
import Link from "next/link";
import { BrandsSlider } from "@/components/brands-slider";
import { HomeRegisterCta } from "@/components/home-register-cta";
import type { ProductListItem } from "@/lib/types";

export const metadata: Metadata = {
  title: "Inicio",
  description:
    "Big Boys Gym · Tienda oficial en Manizales, Colombia. Encontrá suplementación, ropa deportiva y equipamiento para llevar tu entrenamiento al siguiente nivel.",
  openGraph: {
    title: "Big Boys Gym · Tienda Oficial",
    description: "Suplementación y ropa deportiva en Manizales.",
    url: "https://store-gym-bigboys.vercel.app",
    images: [
      {
        url: "/brand/logo-bigboys.jpg",
        width: 400,
        height: 400,
        alt: "Big Boys Gym",
      },
    ],
  },
};

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

function apiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
}

async function fetchTrainings(): Promise<TrainingCard[]> {
  const base = apiBase();
  if (!base) return [];
  try {
    const res = await fetch(`${base}/api/trainings`, { next: { revalidate: 120 } });
    if (!res.ok) return [];
    const data = (await res.json()) as TrainingCard[];
    return Array.isArray(data) ? data.slice(0, 4) : [];
  } catch {
    return [];
  }
}

async function fetchProducts(): Promise<ProductListItem[]> {
  const base = apiBase();
  if (!base) return [];
  try {
    const res = await fetch(`${base}/api/products?orderBy=newest`, { next: { revalidate: 120 } });
    if (!res.ok) return [];
    const data = (await res.json()) as ProductListItem[];
    return Array.isArray(data) ? data.slice(0, 4) : [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [trainings, products] = await Promise.all([fetchTrainings(), fetchProducts()]);

  return (
    <main style={{ position: "relative", zIndex: 1, flex: 1 }}>
      {/* HERO */}
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
            transform: "translateY(-50%)",
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
            transform: "translateY(-50%)",
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
            style={{
              fontFamily: "var(--font-display), Impact, sans-serif",
              fontSize: "clamp(48px, 8vw, 96px)",
              color: "var(--red-neon)",
              textTransform: "uppercase",
              letterSpacing: "4px",
              lineHeight: 1,
              marginBottom: "24px",
              textShadow: "var(--glow-red)",
              animation: "slide-in-left 0.8s 0.2s ease forwards",
              opacity: 0,
              animationFillMode: "forwards",
            }}
          >
            GYM
          </h1>

          <div className="neon-line" style={{ marginBottom: "24px", width: "120px" }} />

          <p
            style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: "18px",
              lineHeight: 1.7,
              marginBottom: "40px",
              fontFamily: "var(--font-body), system-ui, sans-serif",
              fontWeight: 500,
              animation: "slide-up 0.8s 0.4s ease forwards",
              opacity: 0,
              animationFillMode: "forwards",
            }}
          >
            El gym más intenso de Manizales. Entrenamiento de élite, suplementación premium y resultados reales. 💪
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
            <Link href="/tienda" className="btn-primary">
              🛍️ Ver tienda
            </Link>
            <Link href="/entrenamientos" className="btn-outline">
              🏋️ Entrenamientos
            </Link>
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

      {/* STATS */}
      <section
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
          {[
            { numero: "500+", label: "Miembros activos", icon: "👥" },
            { numero: "10+", label: "Años de experiencia", icon: "🏆" },
            { numero: "4", label: "Planes de entrenamiento", icon: "💪" },
            { numero: "100%", label: "Compromiso contigo", icon: "⚡" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="glass card-3d"
              style={{
                padding: "32px 24px",
                textAlign: "center",
                cursor: "default",
                borderRadius: "4px",
              }}
            >
              <span style={{ fontSize: "40px", display: "block", marginBottom: "12px" }}>{stat.icon}</span>
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
                {stat.numero}
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
            </div>
          ))}
        </div>
      </section>

      {/* ENTRENAMIENTOS PREVIEW */}
      <section style={{ padding: "clamp(64px, 10vw, 100px) 24px", maxWidth: "1200px", margin: "0 auto" }}>
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
              <Link
                key={t.id}
                href={`/entrenamientos/${t.slug}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <article
                  className="card-3d glass"
                  style={{
                    padding: "24px",
                    minHeight: "220px",
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: "4px",
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
                </article>
              </Link>
            ))}
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: "40px" }}>
          <Link href="/entrenamientos" className="btn-outline">
            Ver todos →
          </Link>
        </div>
      </section>

      {/* PRODUCTOS */}
      <section
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
                  <Link
                    key={p.id}
                    href={`/tienda/productos/${slug}`}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <article
                      className="card-3d glass"
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
                    </article>
                  </Link>
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

      {/* CTA */}
      <section
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
