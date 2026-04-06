"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { registroUrlWithReturnTo } from "@/lib/auth-routes";

function LoginInner({ slug }: { slug: string }) {
  const searchParams = useSearchParams();
  const returnTo =
    searchParams.get("returnTo") ?? searchParams.get("next") ?? "/";
  const href = `/auth/login?returnTo=${encodeURIComponent(returnTo)}`;
  const authError = searchParams.get("error");
  const reason = searchParams.get("reason");

  return (
    <div className="panel-brand mx-auto max-w-md p-8">
      <p className="text-xs uppercase tracking-widest text-zinc-500">
        Acceso · <span className="text-brand-yellow">{slug}</span>
      </p>
      <h1 className="font-display mt-2 text-4xl uppercase tracking-wide text-white">
        Iniciar sesión
      </h1>
      {(authError === "auth" || authError === "config") && reason && (
        <div
          className="mt-4 space-y-2 rounded border border-brand-red/50 bg-brand-red/10 px-3 py-2 text-sm text-brand-red"
          role="alert"
        >
          <p>{reason}</p>
          {authError === "auth" && reason.includes("Service not found") && (
            <p className="text-xs leading-relaxed text-zinc-300">
              En Auth0 el menú <strong>APIs</strong> (barra lateral, no está dentro de Applications) →{" "}
              <strong>Create API</strong> → <strong>Identifier</strong> exactamente igual a{" "}
              <code className="text-brand-yellow">AUTH0_AUDIENCE</code> en{" "}
              <code className="text-brand-yellow">.env.local</code>. Luego{" "}
              <strong>Applications</strong> → tu app (Regular Web) → pestaña <strong>APIs</strong> →
              autorizá ese API para la aplicación.
            </p>
          )}
        </div>
      )}
      <p className="mt-2 text-sm text-zinc-400">
        Usamos Auth0 para iniciar sesión de forma segura. Serás redirigido para ingresar tus
        credenciales.
      </p>
      <p className="mt-4 text-sm text-zinc-400">
        ¿No tenés cuenta?{" "}
        <a
          href={registroUrlWithReturnTo(returnTo)}
          className="font-medium text-brand-yellow hover:underline"
        >
          Crear cuenta
        </a>
      </p>
      <a href={href} className="btn-brand mt-8 flex w-full justify-center">
        Continuar con Auth0
      </a>
      <p className="mt-6 text-center text-xs text-zinc-500">
        <Link href="/" className="hover:text-zinc-300">
          Volver al inicio
        </Link>
      </p>
    </div>
  );
}

export function LoginPanel({ slug }: { slug: string }) {
  return (
    <Suspense fallback={<div className="text-center text-zinc-500">Cargando…</div>}>
      <LoginInner slug={slug} />
    </Suspense>
  );
}
