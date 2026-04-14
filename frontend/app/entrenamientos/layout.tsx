import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Entrenamientos",
  description:
    "Rutinas, consejos y todo lo que necesitás para entrenar en Big Boys Gym. Manizales, Colombia.",
  robots: { index: true, follow: true },
};

export default function EntrenamientosLayout({ children }: { children: ReactNode }) {
  return children;
}
