import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SITE_URL } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Biblioteca de ejercicios y rutinas",
  description:
    "Explorá ejercicios por grupo muscular, nivel y equipamiento. Rutinas, series, repeticiones y consejos del entrenador — Big Boys Gym, Manizales.",
  keywords: [
    "rutinas gym",
    "ejercicios manizales",
    "biblioteca ejercicios",
    "entrenamiento fuerza",
    "Big Boys Gym",
  ],
  alternates: { canonical: "/entrenamientos/rutinas" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Biblioteca de ejercicios · Big Boys Gym",
    description:
      "Filtrá por músculo, nivel y nombre. Videos, instrucciones y stats de cada ejercicio.",
    url: `${SITE_URL}/entrenamientos/rutinas`,
    type: "website",
    locale: "es_CO",
    siteName: "Big Boys Gym",
    images: [{ url: `${SITE_URL}/brand/logo-BigBoysGYM.png`, width: 800, height: 800 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Biblioteca de ejercicios · Big Boys Gym",
    description:
      "Filtrá por músculo, nivel y nombre. Videos, instrucciones y stats de cada ejercicio.",
  },
};

export default function RutinasLayout({ children }: { children: ReactNode }) {
  return children;
}
