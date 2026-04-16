"use client";

import { useScrollProgress } from "@/hooks/use-parallax";

export function ScrollProgress() {
  const progress = useScrollProgress();

  return (
    <div
      style={{
        position: "fixed",
        top: "72px",
        left: 0,
        right: 0,
        height: "2px",
        background: "rgba(204,0,0,0.15)",
        zIndex: 999,
        pointerEvents: "none",
      }}
      aria-hidden
    >
      <div
        style={{
          height: "100%",
          width: `${progress * 100}%`,
          background: "linear-gradient(90deg, #8B0000, #CC0000, #FF0000)",
          boxShadow: "0 0 10px #FF0000",
          transition: "width 0.05s linear",
        }}
      />
    </div>
  );
}
