"use client";

import { useEffect } from "react";

/**
 * Añade efecto ripple a .btn-primary y .btn-outline sin tocar cada botón.
 */
export function RippleDelegate() {
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const btn = target.closest(
        "a.btn-primary, a.btn-outline, a.btn-brand, a.btn-brand-outline, button.btn-primary, button.btn-outline, button.btn-brand",
      ) as HTMLElement | null;
      if (!btn) return;

      const ripple = document.createElement("span");
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      ripple.className = "ripple";
      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
      btn.appendChild(ripple);
      ripple.addEventListener("animationend", () => ripple.remove());
    };

    document.addEventListener("mousedown", onDown, true);
    return () => document.removeEventListener("mousedown", onDown, true);
  }, []);

  return null;
}
