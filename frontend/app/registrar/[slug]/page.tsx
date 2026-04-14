"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { RegistroPanel } from "@/components/auth/registro-panel";

export default function RegistrarSlugPage() {
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : "cuenta";
  const { isLoggedIn, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isLoggedIn) {
      router.replace("/");
    }
  }, [isLoggedIn, isLoading, router]);

  if (isLoading || isLoggedIn) {
    return null;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <RegistroPanel slug={slug} />
    </div>
  );
}
