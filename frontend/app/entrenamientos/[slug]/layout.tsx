import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SITE_URL } from "@/lib/site-url";

function apiBase(): string {
  return (
    process.env.BACKEND_URL?.replace(/\/$/, "") ??
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
    "http://localhost:3001"
  );
}

type TrainingPublic = {
  name?: string;
  description?: string;
  slug?: string;
  imageUrl?: string | null;
};

async function fetchTrainingMeta(slug: string): Promise<TrainingPublic | null> {
  if (!slug) return null;
  try {
    const res = await fetch(`${apiBase()}/api/trainings/${encodeURIComponent(slug)}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return (await res.json()) as TrainingPublic;
  } catch {
    return null;
  }
}

function slugFallbackTitle(slug: string): string {
  const map: Record<string, string> = {
    personalizado: "Entrenamiento personalizado",
    mensualidad: "Mensualidad y acceso al gym",
    "alto-rendimiento": "Alto rendimiento y fuerza",
  };
  return map[slug] ?? slug.replace(/-/g, " ");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const t = await fetchTrainingMeta(slug);

  const base = slugFallbackTitle(slug);
  const title = t?.name?.trim() ? t.name : base;
  const rawDesc = typeof t?.description === "string" ? t.description.trim() : "";
  const description =
    rawDesc.length > 0
      ? rawDesc.length > 158
        ? `${rawDesc.slice(0, 157)}…`
        : rawDesc
      : `${title} en Big Boys Gym, Manizales. Planes de entrenamiento profesional, seguimiento y comunidad.`;

  const url = `${SITE_URL}/entrenamientos/${encodeURIComponent(slug)}`;
  const ogImage = t?.imageUrl?.trim()
    ? [{ url: t.imageUrl, width: 1200, height: 630, alt: title }]
    : [{ url: `${SITE_URL}/brand/logo-BigBoysGYM.png`, width: 800, height: 800, alt: "Big Boys Gym" }];

  return {
    title,
    description,
    alternates: { canonical: `/entrenamientos/${slug}` },
    robots: { index: true, follow: true },
    openGraph: {
      title: `${title} · Big Boys Gym`,
      description,
      url,
      type: "website",
      locale: "es_CO",
      siteName: "Big Boys Gym",
      images: ogImage,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · Big Boys Gym`,
      description,
    },
  };
}

export default function EntrenamientoSlugLayout({ children }: { children: ReactNode }) {
  return children;
}
