import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SITE_URL } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Tienda oficial · Suplementos y ropa deportiva",
  description:
    "Tienda online Big Boys Gym: proteínas, pre-entreno, ropa deportiva y equipamiento. Envíos en Colombia desde Manizales. Calidad premium para tu entrenamiento.",
  keywords: [
    "suplementos gym",
    "proteína Colombia",
    "ropa deportiva Manizales",
    "tienda gym",
    "Big Boys Gym tienda",
  ],
  alternates: { canonical: "/tienda" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Tienda oficial · Big Boys Gym",
    description:
      "Suplementación, indumentaria y equipamiento para entrenar fuerte. Envíos a toda Colombia.",
    url: `${SITE_URL}/tienda`,
    type: "website",
    locale: "es_CO",
    siteName: "Big Boys Gym",
    images: [{ url: `${SITE_URL}/brand/logo-BigBoysGYM.png`, width: 800, height: 800 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tienda oficial · Big Boys Gym",
    description:
      "Suplementos, ropa deportiva y equipamiento. Manizales, Colombia.",
  },
};

export default function TiendaLayout({ children }: { children: ReactNode }) {
  return children;
}
