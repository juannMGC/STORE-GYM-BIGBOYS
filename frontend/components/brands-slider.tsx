"use client";

import { useState, type CSSProperties } from "react";

export type MarcaAliada = {
  id: number;
  nombre: string;
  /** Ruta bajo `/public`, p. ej. `/brands/optimum.png`. Vacío = solo texto hasta que el admin suba el logo. */
  logo: string;
  url: string;
};

// Datos de marcas aliadas — el admin puede editar este array para agregar/quitar marcas fácilmente
const MARCAS: MarcaAliada[] = [
  { id: 1, nombre: "OPTIMUM NUTRITION", logo: "", url: "#" },
  { id: 2, nombre: "MUSCLETECH", logo: "", url: "#" },
  { id: 3, nombre: "BSN", logo: "", url: "#" },
  { id: 4, nombre: "CELLUCOR", logo: "", url: "#" },
  { id: 5, nombre: "DYMATIZE", logo: "", url: "#" },
  { id: 6, nombre: "NOW SPORTS", logo: "", url: "#" },
  { id: 7, nombre: "UNIVERSAL", logo: "", url: "#" },
  { id: 8, nombre: "WEIDER", logo: "", url: "#" },
];

function BrandLogoOrText({ marca }: { marca: MarcaAliada }) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = Boolean(marca.logo?.trim()) && !imgFailed;

  const labelStyle: CSSProperties = {
    fontFamily: "var(--font-display)",
    color: "#f7e047",
    fontSize: "18px",
    letterSpacing: "3px",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  };

  if (!showImage) {
    return <span style={labelStyle}>{marca.nombre}</span>;
  }

  return (
    <img
      src={marca.logo}
      alt={marca.nombre}
      style={{
        height: "40px",
        width: "auto",
        maxWidth: "120px",
        objectFit: "contain",
      }}
      onError={() => setImgFailed(true)}
    />
  );
}

export function BrandsSlider({
  velocidad = 30,
  pausarAlHover = true,
}: {
  velocidad?: number;
  pausarAlHover?: boolean;
}) {
  const marcasDobles = [...MARCAS, ...MARCAS, ...MARCAS];

  return (
    <section
      aria-label="Marcas aliadas"
      style={{
        padding: "48px 0",
        background: "#0a0a0a",
        borderTop: "1px solid #1a1a1a",
        borderBottom: "1px solid #1a1a1a",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-display)",
          color: "#3f3f46",
          fontSize: "11px",
          letterSpacing: "4px",
          textTransform: "uppercase",
          textAlign: "center",
          marginBottom: "32px",
        }}
      >
        Nuestros aliados
      </p>

      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "120px",
          background: "linear-gradient(to right, #0a0a0a, transparent)",
          zIndex: 2,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: "120px",
          background: "linear-gradient(to left, #0a0a0a, transparent)",
          zIndex: 2,
          pointerEvents: "none",
        }}
      />

      <div
        className={["brands-slider-track", pausarAlHover ? "brands-slider-pause-hover" : ""]
          .filter(Boolean)
          .join(" ")}
        style={{
          display: "flex",
          animation: `scroll-brands ${velocidad}s linear infinite`,
          width: "max-content",
        }}
      >
        {marcasDobles.map((marca, index) => {
          const placeholder = marca.url === "#" || !marca.url.trim();
          return (
            <a
              key={`${marca.id}-${index}`}
              href={placeholder ? "#" : marca.url}
              target={placeholder ? undefined : "_blank"}
              rel={placeholder ? undefined : "noopener noreferrer"}
              onClick={placeholder ? (e) => e.preventDefault() : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 48px",
                flexShrink: 0,
                textDecoration: "none",
                opacity: 0.5,
                transition: "opacity 0.2s, filter 0.2s",
                filter: "grayscale(100%)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "1";
                e.currentTarget.style.filter = "grayscale(0%)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "0.5";
                e.currentTarget.style.filter = "grayscale(100%)";
              }}
            >
              <BrandLogoOrText marca={marca} />
            </a>
          );
        })}
      </div>

      <style>{`
        @keyframes scroll-brands {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }

        .brands-slider-pause-hover:hover {
          animation-play-state: paused;
        }

        @media (max-width: 768px) {
          .brands-slider-track {
            animation-duration: ${Math.max(velocidad * 1.35, velocidad + 10)}s;
          }
        }
      `}</style>
    </section>
  );
}
