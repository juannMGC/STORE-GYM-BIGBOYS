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
    <a href={REGISTRO_ENTRY_HREF} className="btn-outline inline-block text-center">
      Crear cuenta
    </a>
  );
}
