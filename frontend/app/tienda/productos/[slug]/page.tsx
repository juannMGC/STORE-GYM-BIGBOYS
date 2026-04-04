"use client";

import { useParams } from "next/navigation";
import { ProductDetailView } from "@/components/product-detail-view";

/**
 * Ficha de producto por slug amigable: /tienda/productos/nombreproducto
 * API: GET /api/products/by-slug/:slug
 */
export default function TiendaProductoPorSlugPage() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const apiPath = `/products/by-slug/${encodeURIComponent(slug)}`;

  return <ProductDetailView apiPath={apiPath} />;
}
