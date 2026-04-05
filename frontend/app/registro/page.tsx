import Link from "next/link";

export default function RegistroPage() {
  const returnTo = "/tienda";
  const href = `/auth/login?screen_hint=signup&returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="panel-brand mx-auto max-w-md p-8">
        <h1 className="font-display text-4xl uppercase tracking-wide text-white">
          Crear cuenta
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          El registro se gestiona con Auth0. Vas a poder elegir email/contraseña o
          proveedores sociales según la configuración del tenant.
        </p>
        <p className="mt-4 text-sm text-zinc-400">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="font-medium text-brand-yellow hover:underline">
            Iniciá sesión
          </Link>
        </p>
        <a href={href} className="btn-brand mt-8 flex w-full justify-center">
          Registrarme con Auth0
        </a>
      </div>
    </div>
  );
}
