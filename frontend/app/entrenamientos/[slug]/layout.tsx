import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Plan de entrenamiento",
  description: "Detalle del plan de entrenamiento en Big Boys Gym, Manizales.",
  robots: { index: true, follow: true },
};

export default function EntrenamientoSlugLayout({ children }: { children: ReactNode }) {
  return children;
}
