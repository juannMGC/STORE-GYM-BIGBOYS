"use client";

import { useParams } from "next/navigation";
import { RegistroPanel } from "@/components/auth/registro-panel";

export default function RegistrarSlugPage() {
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : "cuenta";

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <RegistroPanel slug={slug} />
    </div>
  );
}
