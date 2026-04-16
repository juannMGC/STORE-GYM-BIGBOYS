"use client";

import type { CSSProperties, ReactNode } from "react";
import { useTilt } from "@/hooks/use-tilt";

export function TiltCard({
  children,
  intensity = 8,
  style = {},
  className = "",
}: {
  children: ReactNode;
  intensity?: number;
  style?: CSSProperties;
  className?: string;
}) {
  const ref = useTilt(intensity);

  return (
    <div
      ref={ref}
      className={`tilt-card ${className}`.trim()}
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        transformStyle: "preserve-3d",
        transition: "transform 0.5s ease",
        position: "relative",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
