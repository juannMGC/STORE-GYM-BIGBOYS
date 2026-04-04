import { INSTAGRAM_PROFILE_URL } from "@/data/instagram-gallery";
import { InstagramIcon } from "@/components/instagram-icon";

/** Bloque final al pie de la home: icono Instagram + enlace al perfil. */
export function InstagramHomeCta() {
  return (
    <section
      className="relative z-10 border-b-4 border-brand-border bg-gradient-to-b from-brand-steel to-brand-black py-14"
      aria-label="Instagram Big Boys Gym"
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 text-center">
        <p className="font-display text-sm uppercase tracking-[0.35em] text-brand-yellow">
          Seguinos
        </p>
        <a
          href={INSTAGRAM_PROFILE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex flex-col items-center gap-3 transition hover:opacity-95"
        >
          <span className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-brand-yellow bg-brand-black text-brand-yellow shadow-[8px_8px_0_0_rgba(217,25,32,0.45)] transition group-hover:border-brand-red group-hover:text-white md:h-24 md:w-24">
            <InstagramIcon className="h-12 w-12 md:h-14 md:w-14" decorative />
          </span>
          <span className="font-display text-2xl uppercase tracking-wide text-white md:text-3xl">
            @bigboys.gym
          </span>
          <span className="text-sm text-brand-yellow underline-offset-4 group-hover:underline">
            instagram.com/bigboys.gym
          </span>
        </a>
      </div>
    </section>
  );
}
