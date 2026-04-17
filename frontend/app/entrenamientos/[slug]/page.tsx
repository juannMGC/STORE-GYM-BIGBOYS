"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { BackButton } from "@/components/back-button";
import { useIsMobile } from "@/hooks/use-breakpoint";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";

type TrainingDetail = {
  id: string;
  name: string;
  slug: string;
  description: string;
  longDesc: string | null;
  price: number;
  priceLabel: string | null;
  imageUrl: string | null;
  icon: string | null;
  benefits: { id: string; text: string; order: number }[];
  schedules: {
    id: string;
    day: string;
    startTime: string;
    endTime: string;
    spots: number | null;
  }[];
};

function detailUrl(slug: string): string {
  const base = apiUrl.replace(/\/$/, "");
  return base ? `${base}/api/trainings/${encodeURIComponent(slug)}` : `/api/trainings/${encodeURIComponent(slug)}`;
}

export default function EntrenamientoDetallePage() {
  const isMobile = useIsMobile();
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : "";
  const [training, setTraining] = useState<TrainingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    void fetch(detailUrl(slug))
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json() as Promise<TrainingDetail>;
      })
      .then(setTraining)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050505] px-4 py-24 text-center text-zinc-500">
        Cargando…
      </main>
    );
  }

  if (notFound || !training) {
    return (
      <main className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-display text-2xl uppercase text-white">No encontrado</h1>
        <p className="mt-2 text-zinc-500">Este plan no existe o ya no está disponible.</p>
        <Link href="/entrenamientos" className="btn-brand mt-8 inline-flex">
          Ver entrenamientos
        </Link>
      </main>
    );
  }

  const waText = `Hola Big Boys Gym! 💪 Quiero información sobre el plan "${training.name}" ($${Number(training.price).toLocaleString("es-CO")} ${training.priceLabel ?? "por mes"})`;

  return (
    <main style={{ minHeight: "100vh", background: "#050505" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: isMobile ? "12px 16px 0" : "16px 24px 0" }}>
        <BackButton href="/entrenamientos" label="← Entrenamientos" />
      </div>

      <div
        style={{
          width: "100%",
          height: isMobile ? "min(250px, 45vh)" : "min(400px, 55vh)",
          background: "#1a1a1a",
          overflow: "hidden",
          position: "relative",
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
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "120px",
              opacity: 0.1,
            }}
          >
            {training.icon ?? "🏋️"}
          </div>
        )}

        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            background: "linear-gradient(transparent, #050505)",
            height: "200px",
          }}
        />

        <div style={{ position: "absolute", bottom: "24px", left: "24px" }}>
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(28px, 6vw, 36px)",
              color: "#f7e047",
              margin: "0 0 4px",
              letterSpacing: "2px",
            }}
          >
            ${Number(training.price).toLocaleString("es-CO")}
          </p>
          <p
            style={{
              color: "#71717a",
              fontFamily: "var(--font-display)",
              fontSize: "14px",
              letterSpacing: "2px",
              margin: 0,
            }}
          >
            {training.priceLabel ?? "por mes"}
          </p>
        </div>
      </div>

      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          padding: isMobile ? "24px 16px 40px" : "40px 24px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "24px",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: "40px" }}>{training.icon ?? "🏋️"}</span>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(24px, 5vw, 40px)",
              color: "#ffffff",
              textTransform: "uppercase",
              letterSpacing: "4px",
              margin: 0,
            }}
          >
            {training.name}
          </h1>
        </div>

        <div
          style={{
            marginBottom: "40px",
            paddingBottom: "40px",
            borderBottom: "1px solid #2a2a2a",
          }}
        >
          <p style={{ color: "#a1a1aa", fontSize: "16px", lineHeight: 1.8 }}>
            {training.longDesc ?? training.description}
          </p>
        </div>

        {training.benefits?.length > 0 ? (
          <div
            style={{
              marginBottom: "40px",
              paddingBottom: "40px",
              borderBottom: "1px solid #2a2a2a",
            }}
          >
            <h2
              style={{
                fontFamily: "var(--font-display)",
                color: "#f7e047",
                fontSize: "14px",
                letterSpacing: "4px",
                textTransform: "uppercase",
                marginBottom: "20px",
              }}
            >
              ✅ Qué incluye
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {training.benefits.map((b) => (
                <div key={b.id} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ color: "#d91920", fontSize: "16px", flexShrink: 0 }}>✓</span>
                  <span style={{ color: "#e4e4e7", fontSize: "15px" }}>{b.text}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {training.schedules?.length > 0 ? (
          <div
            style={{
              marginBottom: "40px",
              paddingBottom: "40px",
              borderBottom: "1px solid #2a2a2a",
            }}
          >
            <h2
              style={{
                fontFamily: "var(--font-display)",
                color: "#f7e047",
                fontSize: "14px",
                letterSpacing: "4px",
                textTransform: "uppercase",
                marginBottom: "20px",
              }}
            >
              📅 Horarios
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {training.schedules.map((s) => (
                <div
                  key={s.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "12px",
                    flexWrap: "wrap",
                    padding: "12px 16px",
                    background: "#111111",
                    border: "1px solid #2a2a2a",
                  }}
                >
                  <span style={{ color: "#e4e4e7", fontSize: "14px" }}>{s.day}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span
                      style={{
                        color: "#f7e047",
                        fontFamily: "var(--font-display)",
                        fontSize: "14px",
                        letterSpacing: "1px",
                      }}
                    >
                      {s.startTime} — {s.endTime}
                    </span>
                    {s.spots != null && s.spots > 0 ? (
                      <span
                        style={{
                          background: "#1a1a1a",
                          border: "1px solid #2a2a2a",
                          color: "#22c55e",
                          fontSize: "11px",
                          padding: "2px 8px",
                          fontFamily: "var(--font-display)",
                        }}
                      >
                        {s.spots} cupos
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            flexDirection: isMobile ? "column" : "row",
          }}
        >
          <a
            href={`https://wa.me/573171184925?text=${encodeURIComponent(waText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-brand"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "14px 24px",
              textDecoration: "none",
              flex: 1,
              minHeight: "48px",
              width: isMobile ? "100%" : "auto",
            }}
          >
            💬 Consultar por WhatsApp
          </a>

          <Link
            href="/tienda"
            className="btn-brand-outline"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "14px 24px",
              textDecoration: "none",
              flex: 1,
              minHeight: "48px",
              width: isMobile ? "100%" : "auto",
            }}
          >
            🛍️ Ver suplementos
          </Link>
        </div>
      </div>
    </main>
  );
}
