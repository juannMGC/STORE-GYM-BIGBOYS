import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";

const SITE = "https://store-gym-bigboys.vercel.app";

function apiBase(): string {
  return (
    process.env.BACKEND_URL?.replace(/\/$/, "") ??
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
    "http://localhost:3001"
  );
}

type ProductApi = {
  title?: string;
  description?: string | null;
  price?: number;
  stock?: number;
  images?: { url: string }[];
  statusCode?: number;
  message?: string;
};

async function fetchProductBySlug(slug: string): Promise<ProductApi | null> {
  if (!slug) return null;
  try {
    const res = await fetch(
      `${apiBase()}/api/products/by-slug/${encodeURIComponent(slug)}`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return null;
    const producto = (await res.json()) as ProductApi;
    if (producto?.statusCode === 404) return null;
    return producto;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const producto = await fetchProductBySlug(slug);

  if (!producto || !producto.title) {
    return {
      title: "Producto no encontrado",
      description: "El producto que buscás no existe.",
    };
  }

  const title = producto.title;
  const description =
    (typeof producto.description === "string" && producto.description.trim()) ||
    `${producto.title} disponible en Big Boys Gym. Calidad premium para tu entrenamiento en Manizales.`;
  const imageUrl = producto.images?.[0]?.url ?? "/brand/logo-bigboys.jpg";
  const precio =
    typeof producto.price === "number"
      ? producto.price.toLocaleString("es-CO")
      : "";
  const pageUrl = `${SITE}/tienda/productos/${encodeURIComponent(slug)}`;
  const stock = typeof producto.stock === "number" ? producto.stock : 0;

  return {
    title,
    description,
    openGraph: {
      title: `${title} · Big Boys Gym`,
      description: `${description} Precio: $${precio} COP`,
      url: pageUrl,
      type: "website",
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 800,
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
    other: {
      "product:price:amount": String(producto.price ?? ""),
      "product:price:currency": "COP",
      "product:availability": stock > 0 ? "in stock" : "out of stock",
    },
  };
}

export default async function TiendaProductoSlugLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const producto = await fetchProductBySlug(slug);

  if (!producto?.title) {
    notFound();
  }

  const imageUrl = producto.images?.[0]?.url;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: producto.title,
    description: producto.description ?? undefined,
    image: imageUrl,
    brand: {
      "@type": "Brand",
      name: "Big Boys Gym",
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "COP",
      price: producto.price,
      availability:
        (producto.stock ?? 0) > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "Big Boys Gym",
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
