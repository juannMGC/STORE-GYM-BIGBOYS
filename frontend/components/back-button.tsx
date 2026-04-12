"use client";

import { useRouter } from "next/navigation";

interface BackButtonProps {
  label?: string;
  /** Si se pasa, navega a esa ruta fija */
  href?: string;
  /** Clases adicionales opcionales */
  className?: string;
}

export function BackButton({
  label = "Volver",
  href,
  className,
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (href) {
      router.push(href);
    } else {
      if (typeof window !== "undefined" && window.history.length > 1) {
        router.back();
      } else {
        router.push("/");
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        background: "none",
        border: "none",
        color: "#a1a1aa",
        cursor: "pointer",
        fontSize: "13px",
        fontFamily: "var(--font-display)",
        letterSpacing: "2px",
        textTransform: "uppercase",
        padding: "8px 0",
        transition: "color 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = "#f7e047";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = "#a1a1aa";
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <polyline points="15 18 9 12 15 6" />
      </svg>
      {label}
    </button>
  );
}
