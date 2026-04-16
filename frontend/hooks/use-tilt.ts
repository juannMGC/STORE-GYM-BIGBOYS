"use client";

import { useEffect, useRef } from "react";

function isTouchOrNarrow(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(max-width: 768px)").matches || "ontouchstart" in window;
}

export function useTilt(intensity = 10) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || isTouchOrNarrow()) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -intensity;
      const rotateY = ((x - centerX) / centerX) * intensity;

      el.style.transform =
        `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px) scale(1.02)`;

      const percentX = (x / rect.width) * 100;
      const percentY = (y / rect.height) * 100;
      el.style.background = `
        radial-gradient(
          circle at ${percentX}% ${percentY}%,
          rgba(204,0,0,0.15) 0%,
          rgba(255,255,255,0.03) 50%,
          rgba(0,0,0,0) 100%
        )
      `;
    };

    const handleMouseLeave = () => {
      el.style.transform = "perspective(1000px) rotateX(0) rotateY(0) translateZ(0) scale(1)";
      el.style.background = "rgba(255,255,255,0.03)";
      el.style.transition = "transform 0.5s ease, background 0.5s ease";
    };

    const handleMouseEnter = () => {
      el.style.transition = "none";
    };

    el.addEventListener("mousemove", handleMouseMove);
    el.addEventListener("mouseleave", handleMouseLeave);
    el.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      el.removeEventListener("mousemove", handleMouseMove);
      el.removeEventListener("mouseleave", handleMouseLeave);
      el.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, [intensity]);

  return ref;
}
