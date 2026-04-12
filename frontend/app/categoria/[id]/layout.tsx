import type { Metadata } from "next";
import type { ReactNode } from "react";

const SITE = "https://store-gym-bigboys.vercel.app";

function apiBase(): string {
  return (
    process.env.BACKEND_URL?.replace(/\/$/, "") ??
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
    "http://localhost:3001"
  );
}

type Cat = {
  id: string;
  name: string;
  slug: string | null;
  description?: string | null;
  imageUrl?: string | null;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetch(`${apiBase()}/api/categories`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      return {
        title: "Categoría",
        description: "Productos de Big Boys Gym",
      };
    }
    const data = (await res.json()) as unknown;
    const list = Array.isArray(data) ? data : [];
    const categoria = list.find((c: Cat) => c.id === id) as Cat | undefined;

    if (!categoria) {
      return {
        title: "Categoría no encontrada",
        description: "La categoría que buscás no existe.",
      };
    }

    const title = categoria.name;
    const description =
      categoria.description?.trim() ||
      `Explorá todos los productos de ${categoria.name} en Big Boys Gym. Manizales, Colombia.`;
    const imageUrl = categoria.imageUrl?.trim() || "/brand/logo-bigboys.jpg";
    const pageUrl = `${SITE}/categoria/${encodeURIComponent(id)}`;

    return {
      title,
      description,
      openGraph: {
        title: `${title} · Big Boys Gym`,
        description,
        url: pageUrl,
        images: [
          {
            url: imageUrl,
            width: 800,
            height: 600,
            alt: title,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: `${title} · Big Boys Gym`,
        description,
        images: [imageUrl],
      },
      alternates: {
        canonical: pageUrl,
      },
    };
  } catch {
    return {
      title: "Categoría",
      description: "Productos de Big Boys Gym",
    };
  }
}

export default function CategoriaLayout({ children }: { children: ReactNode }) {
  return children;
}
