import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Tienda",
  description:
    "Explorá todas las categorías de Big Boys Gym: suplementación, ropa deportiva y equipamiento. Envíos a toda Colombia desde Manizales.",
  openGraph: {
    title: "Tienda · Big Boys Gym",
    description:
      "Suplementación, ropa deportiva y equipamiento para tu entrenamiento.",
    url: "https://store-gym-bigboys.vercel.app/tienda",
  },
};

export default function TiendaLayout({ children }: { children: ReactNode }) {
  return children;
}
