"use client";

import { useParams } from "next/navigation";
import { ProductDetailView } from "@/components/product-detail-view";

export default function ProductoPage() {
  const params = useParams();
  const id = params.id as string;
  return <ProductDetailView apiPath={`/products/${id}`} />;
}
