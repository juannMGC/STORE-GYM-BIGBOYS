"use client";

import { SWRConfig } from "swr";
import { Auth0Provider } from "@auth0/nextjs-auth0";
import { AuthProvider } from "@/lib/auth-context";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        shouldRetryOnError: false,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        errorRetryCount: 0,
      }}
    >
      <Auth0Provider>
        <AuthProvider>{children}</AuthProvider>
      </Auth0Provider>
    </SWRConfig>
  );
}
