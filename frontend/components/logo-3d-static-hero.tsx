"use client";

import Image from "next/image";
import type { ReactNode } from "react";

/**
 * Hero sin WebGL: mismo espacio visual aproximado que Logo3DScene para no romper layouts.
 */
export function Logo3DStaticHero({
  height = "100vh",
  lightSceneOverlays = false,
  children,
}: {
  height?: string;
  lightSceneOverlays?: boolean;
  children?: ReactNode;
}) {
  return (
    <div
      style={{
        width: "100%",
        height,
        position: "relative",
        background: "#000000",
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: `
            radial-gradient(ellipse 85% 55% at 50% 38%, rgba(204,40,40,0.35) 0%, transparent 58%),
            radial-gradient(ellipse 60% 45% at 72% 55%, rgba(120,0,0,0.18) 0%, transparent 50%),
            radial-gradient(ellipse 50% 40% at 28% 48%, rgba(80,0,0,0.12) 0%, transparent 48%),
            #000000
          `,
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "8%",
        }}
      >
        <div
          className="logo-3d-static-hero__mark"
          style={{
            position: "relative",
            width: "min(72vw, 420px)",
            maxHeight: "55vh",
            aspectRatio: "1",
          }}
        >
          <Image
            src="/brand/logo-BigBoysGYM.png"
            alt=""
            fill
            sizes="(max-width: 768px) 72vw, 420px"
            priority
            style={{ objectFit: "contain", filter: "drop-shadow(0 0 32px rgba(204,0,0,0.45))" }}
          />
        </div>
      </div>

      {children ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 12,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            alignItems: "center",
            padding: "clamp(16px, 4vw, 48px)",
            paddingBottom: "clamp(72px, 12vh, 120px)",
            pointerEvents: "none",
          }}
        >
          <div style={{ pointerEvents: "auto", width: "100%", maxWidth: "720px" }}>{children}</div>
        </div>
      ) : null}

      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: lightSceneOverlays ? "min(120px, 18vh)" : "min(200px, 28vh)",
          background: lightSceneOverlays
            ? "linear-gradient(transparent, rgba(0,0,0,0.45))"
            : "linear-gradient(transparent, #000000)",
          pointerEvents: "none",
          zIndex: 8,
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          background: lightSceneOverlays
            ? `repeating-linear-gradient(
            0deg,
            rgba(0,0,0,0) 0px,
            rgba(0,0,0,0) 2px,
            rgba(0,0,0,0.012) 2px,
            rgba(0,0,0,0.012) 4px
          )`
            : `repeating-linear-gradient(
            0deg,
            rgba(0,0,0,0) 0px,
            rgba(0,0,0,0) 2px,
            rgba(0,0,0,0.035) 2px,
            rgba(0,0,0,0.035) 4px
          )`,
          pointerEvents: "none",
          zIndex: 9,
        }}
      />

      <style>{`
        @keyframes logo-static-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .logo-3d-static-hero__mark {
            animation: none !important;
          }
        }
        .logo-3d-static-hero__mark {
          animation: logo-static-float 5.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
