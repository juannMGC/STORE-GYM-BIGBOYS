"use client";

import { useParams } from "next/navigation";
import { ProductDetailView } from "@/components/product-detail-view";

/**
 * Ficha de producto por slug amigable: /tienda/productos/nombreproducto
 * API: GET /api/products/by-slug/:slug
 * Slug inválido: `notFound()` en `layout.tsx` (misma fuente que metadata) y respaldo 404 en `ProductDetailView`.
 */
export default function TiendaProductoPorSlugPage() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const apiPath = `/products/by-slug/${encodeURIComponent(slug)}`;

  return <ProductDetailView apiPath={apiPath} />;
}
