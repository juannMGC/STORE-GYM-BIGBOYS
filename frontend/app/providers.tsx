"use client";

import { Auth0Provider } from "@auth0/nextjs-auth0";
import { AuthProvider } from "@/lib/auth-context";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <Auth0Provider>
      <AuthProvider>{children}</AuthProvider>
    </Auth0Provider>
  );
}
