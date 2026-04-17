"use client";

import { useAuth } from "@/lib/auth-context";
import { REGISTRO_ENTRY_HREF } from "@/lib/auth-routes";

/** Botón “Crear cuenta” solo para visitantes sin sesión (evita flash: oculto si isLoading). */
export function HomeRegisterCta() {
  const { isLoggedIn, isLoading } = useAuth();
  if (isLoading || isLoggedIn) {
    return null;
  }
  return (
    <a
      href={REGISTRO_ENTRY_HREF}
      className="btn-outline inline-flex w-full min-h-[48px] items-center justify-center text-center sm:inline-block sm:w-auto"
    >
      Crear cuenta
    </a>
  );
}
