"use client";

import dynamic from "next/dynamic";
import { useLayoutEffect, useState, type ReactNode } from "react";
import { getWebglHeroMode } from "@/hooks/webgl-hero-eligibility";
import { DEFAULT_LOGO_MODEL_URL } from "./logo-3d-model-urls";
import { Logo3DStaticHero } from "./logo-3d-static-hero";

const Logo3DScene = dynamic(
  () => import("./logo-3d-scene").then((mod) => ({ default: mod.Logo3DScene })),
  { ssr: false, loading: () => <Hero3DLoader /> },
);

function Hero3DLoader() {
  return (
    <div
      style={{
        width: "100%",
        height: "min(100svh, 100dvh)",
        background: "#000000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          border: "2px solid rgba(204,0,0,0.25)",
          borderTopColor: "#CC0000",
          animation: "bbg-3d-spin 0.9s linear infinite",
        }}
      />
      <span
        style={{
          color: "rgba(204,0,0,0.75)",
          fontFamily: "monospace",
          fontSize: "11px",
          letterSpacing: "3px",
        }}
      >
        CARGANDO…
      </span>
      <style>{`
        @keyframes bbg-3d-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function HeroDecidingPlaceholder({ height }: { height: string }) {
  return (
    <div
      aria-hidden
      style={{
        width: "100%",
        height,
        background: "#000000",
      }}
    />
  );
}

export type Logo3DHeroProps = {
  height?: string;
  showScrollHint?: boolean;
  modelUrl?: string;
  lightSceneOverlays?: boolean;
  children?: ReactNode;
};

/**
 * - static: reducir movimiento, 2G, ahorro de datos (sin Three).
 * - lite: WebGL aligerado (móvil, 3G, CPUs muy pequeñas).
 * - full: experiencia completa.
 */
export function Logo3DHero({
  height = "100vh",
  showScrollHint = true,
  modelUrl = DEFAULT_LOGO_MODEL_URL,
  lightSceneOverlays = false,
  children,
}: Logo3DHeroProps) {
  const [mode, setMode] = useState<"deciding" | "static" | "lite" | "full">("deciding");

  useLayoutEffect(() => {
    const apply = () => {
      const m = getWebglHeroMode();
      if (m === "static") setMode("static");
      else if (m === "lite") setMode("lite");
      else setMode("full");
    };

    apply();

    const mqA = window.matchMedia("(hover: none)");
    const mqB = window.matchMedia("(max-width: 900px)");
    mqA.addEventListener("change", apply);
    mqB.addEventListener("change", apply);
    window.addEventListener("resize", apply);

    const conn = (navigator as Navigator & { connection?: EventTarget }).connection;
    conn?.addEventListener?.("change", apply);

    const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    mqReduce.addEventListener("change", apply);

    return () => {
      mqA.removeEventListener("change", apply);
      mqB.removeEventListener("change", apply);
      window.removeEventListener("resize", apply);
      conn?.removeEventListener?.("change", apply);
      mqReduce.removeEventListener("change", apply);
    };
  }, []);

  if (mode === "deciding") {
    return <HeroDecidingPlaceholder height={height} />;
  }

  if (mode === "static") {
    return (
      <Logo3DStaticHero height={height} lightSceneOverlays={lightSceneOverlays}>
        {children}
      </Logo3DStaticHero>
    );
  }

  return (
    <Logo3DScene
      height={height}
      showScrollHint={showScrollHint}
      modelUrl={modelUrl}
      lightSceneOverlays={lightSceneOverlays}
      performanceMode={mode === "lite"}
    >
      {children}
    </Logo3DScene>
  );
}
