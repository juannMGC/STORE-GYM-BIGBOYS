"use client";

import { Auth0Provider } from "@auth0/nextjs-auth0";
import { SWRConfig } from "swr";
import { AuthProvider } from "@/lib/auth-context";
import type { ReactNode } from "react";

const auth0ProfileSwr = {
  shouldRetryOnError: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  errorRetryCount: 0,
};

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SWRConfig value={auth0ProfileSwr}>
      <Auth0Provider>
        <AuthProvider>{children}</AuthProvider>
      </Auth0Provider>
    </SWRConfig>
  );
}
