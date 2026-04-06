import Link from "next/link";
import { LOGIN_ENTRY_HREF } from "@/lib/auth-routes";
import { INSTAGRAM_PROFILE_URL } from "@/data/instagram-gallery";
import { InstagramIcon } from "@/components/instagram-icon";

export function SiteFooter() {
  return (
    <footer className="relative z-10 mt-auto border-t-4 border-brand-border bg-brand-black py-10 text-center">
      <div className="mx-auto max-w-6xl px-4">
        <p className="font-display text-xl uppercase tracking-[0.2em] text-brand-yellow">
          BIG BOYS GYM
        </p>
        <p className="mt-2 text-sm text-zinc-500">
          Tienda oficial · Manizales, Colombia
        </p>
        <p className="mt-3 font-medium text-zinc-400">
          Entrená fuerte. Equipate como un profesional.
        </p>
        <div className="mt-6 flex justify-center gap-6 text-sm">
          <Link href="/tienda" className="text-brand-yellow/80 hover:text-brand-yellow">
            Tienda
          </Link>
          <a href={LOGIN_ENTRY_HREF} className="text-zinc-500 hover:text-zinc-300">
            Cuenta
          </a>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <a
            href={INSTAGRAM_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border-2 border-brand-border bg-brand-steel px-4 py-2 text-sm font-medium text-brand-yellow transition hover:border-brand-red hover:text-white"
          >
            <InstagramIcon className="h-5 w-5" decorative />
            Instagram
          </a>
        </div>
      </div>
    </footer>
  );
}
