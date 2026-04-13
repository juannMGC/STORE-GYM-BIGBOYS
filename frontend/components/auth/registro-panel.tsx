"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { auth0SignupHref, loginPath } from "@/lib/auth-routes";

function RegistroInner({ slug }: { slug: string }) {
  const searchParams = useSearchParams();
  const raw = searchParams.get("returnTo") ?? searchParams.get("next");
  const returnTo = (raw && raw.trim()) || "/";
  const signupHref = auth0SignupHref(returnTo);
  const loginHref = `${loginPath()}?returnTo=${encodeURIComponent(returnTo)}`;
  const [acceptedLegal, setAcceptedLegal] = useState(false);

  return (
    <div className="panel-brand mx-auto max-w-md p-8">
      <p className="text-xs uppercase tracking-widest text-zinc-500">
        Registro · <span className="text-brand-yellow">{slug}</span>
      </p>
      <h1 className="font-display mt-2 text-4xl uppercase tracking-wide text-white">
        Crear cuenta
      </h1>
      <p className="mt-2 text-sm text-zinc-400">
        El registro se gestiona con Auth0. Vas a poder elegir email/contraseña o proveedores
        sociales según la configuración del tenant.
      </p>
      <p className="mt-4 text-sm text-zinc-400">
        ¿Ya tenés cuenta?{" "}
        <a href={loginHref} className="font-medium text-brand-yellow hover:underline">
          Iniciá sesión
        </a>
      </p>

      <label className="mt-8 flex cursor-pointer gap-3 text-left">
        <input
          type="checkbox"
          checked={acceptedLegal}
          onChange={(e) => setAcceptedLegal(e.target.checked)}
          className="mt-1 h-[18px] w-[18px] shrink-0 cursor-pointer accent-[#d91920]"
        />
        <span className="text-sm leading-relaxed text-zinc-400">
          Declaro haber leído y aceptado los{" "}
          <Link href="/terminos" target="_blank" rel="noopener noreferrer" className="text-brand-yellow hover:underline">
            Términos y condiciones
          </Link>{" "}
          y la{" "}
          <Link
            href="/privacidad"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-yellow hover:underline"
          >
            Política de privacidad
          </Link>
          .
        </span>
      </label>

      {acceptedLegal ? (
        <a href={signupHref} className="btn-brand mt-6 flex w-full justify-center">
          Registrarme con Auth0
        </a>
      ) : (
        <span
          className="btn-brand mt-6 flex w-full cursor-not-allowed justify-center opacity-50"
          aria-disabled="true"
        >
          Registrarme con Auth0
        </span>
      )}
    </div>
  );
}

export function RegistroPanel({ slug }: { slug: string }) {
  return (
    <Suspense fallback={<div className="text-center text-zinc-500">Cargando…</div>}>
      <RegistroInner slug={slug} />
    </Suspense>
  );
}
