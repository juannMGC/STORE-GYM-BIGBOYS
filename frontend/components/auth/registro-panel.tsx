import { LOGIN_ENTRY_HREF } from "@/lib/auth-routes";

export function RegistroPanel({ slug }: { slug: string }) {
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
        <a href={LOGIN_ENTRY_HREF} className="font-medium text-brand-yellow hover:underline">
          Iniciá sesión
        </a>
      </p>
      <a
        href="/api/auth/login?screen_hint=signup&prompt=login&returnTo=/"
        className="btn-brand mt-8 flex w-full justify-center"
      >
        Registrarme con Auth0
      </a>
    </div>
  );
}
