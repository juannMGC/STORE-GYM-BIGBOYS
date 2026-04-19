import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SITE_URL } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Entrenamientos · Planes y rutinas",
  description:
    "Planes de gym en Manizales: personalizado, mensualidad, alto rendimiento y más. Biblioteca de ejercicios gratuita. Big Boys Gym — comunidad y resultados.",
  keywords: [
    "gym Manizales",
    "entrenamiento personalizado",
    "rutinas de gimnasio",
    "Big Boys Gym",
    "mensualidad gym",
  ],
  alternates: { canonical: "/entrenamientos" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Entrenamientos · Planes y rutinas | Big Boys Gym",
    description:
      "Elegí tu plan, explorá la biblioteca de ejercicios y llevá tu training al siguiente nivel.",
    url: `${SITE_URL}/entrenamientos`,
    type: "website",
    locale: "es_CO",
    siteName: "Big Boys Gym",
    images: [{ url: `${SITE_URL}/brand/logo-BigBoysGYM.png`, width: 800, height: 800 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Entrenamientos · Big Boys Gym",
    description:
      "Planes, rutinas y biblioteca de ejercicios. Manizales, Colombia.",
  },
};

export default function EntrenamientosLayout({ children }: { children: ReactNode }) {
  return children;
}
