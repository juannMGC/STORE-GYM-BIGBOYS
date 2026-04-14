"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { LoginPanel } from "@/components/auth/login-panel";

export default function LoginSlugPage() {
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : "entrar";
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
      <LoginPanel slug={slug} />
    </div>
  );
}
