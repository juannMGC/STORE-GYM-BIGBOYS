"use client";

import { Auth0Provider } from "@auth0/nextjs-auth0";
import { SWRConfig } from "swr";
import { AuthProvider } from "@/lib/auth-context";
import type { ReactNode } from "react";

/** useUser() de @auth0/nextjs-auth0 usa SWR sobre /auth/profile; sin esto, 401 reintenta en bucle. */
const auth0ProfileSwr = {
  shouldRetryOnError: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  errorRetryCount: 0,
};

export function Providers({ children }: { children: ReactNode }) {
  return (
    <Auth0Provider>
      <SWRConfig value={auth0ProfileSwr}>
        <AuthProvider>{children}</AuthProvider>
      </SWRConfig>
    </Auth0Provider>
  );
}
