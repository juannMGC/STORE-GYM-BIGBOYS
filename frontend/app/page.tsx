import type { Metadata } from "next";
import { HomePageView } from "@/components/home-page-view";
import type { ProductListItem } from "@/lib/types";

export const metadata: Metadata = {
  title: "Inicio",
  description:
    "Big Boys Gym · Tienda oficial en Manizales, Colombia. Encontrá suplementación, ropa deportiva y equipamiento para llevar tu entrenamiento al siguiente nivel.",
  openGraph: {
    title: "Big Boys Gym · Tienda Oficial",
    description: "Suplementación y ropa deportiva en Manizales.",
    url: "https://store-gym-bigboys.vercel.app",
    images: [
      {
        url: "/brand/logo-BigBoysGYM.png",
        width: 400,
        height: 400,
        alt: "Big Boys Gym",
      },
    ],
  },
};

type TrainingCard = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  priceLabel: string | null;
  imageUrl: string | null;
  icon: string | null;
  featured: boolean;
};

function apiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
}

async function fetchTrainings(): Promise<TrainingCard[]> {
  const base = apiBase();
  if (!base) return [];
  try {
    const res = await fetch(`${base}/api/trainings`, { next: { revalidate: 120 } });
    if (!res.ok) return [];
    const data = (await res.json()) as TrainingCard[];
    return Array.isArray(data) ? data.slice(0, 4) : [];
  } catch {
    return [];
  }
}

async function fetchProducts(): Promise<ProductListItem[]> {
  const base = apiBase();
  if (!base) return [];
  try {
    const res = await fetch(`${base}/api/products?orderBy=newest`, { next: { revalidate: 120 } });
    if (!res.ok) return [];
    const data = (await res.json()) as ProductListItem[];
    return Array.isArray(data) ? data.slice(0, 4) : [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [trainings, products] = await Promise.all([fetchTrainings(), fetchProducts()]);
  return <HomePageView trainings={trainings} products={products} />;
}
