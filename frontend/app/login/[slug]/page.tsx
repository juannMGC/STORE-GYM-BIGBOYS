"use client";

import { useParams } from "next/navigation";
import { LoginPanel } from "@/components/auth/login-panel";

export default function LoginSlugPage() {
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : "entrar";

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <LoginPanel slug={slug} />
    </div>
  );
}
