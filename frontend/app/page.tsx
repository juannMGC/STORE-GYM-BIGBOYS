import Image from "next/image";
import Link from "next/link";
import { REGISTRO_ENTRY_HREF } from "@/lib/auth-routes";
import { InstagramCarousel } from "@/components/instagram-carousel";
import { InstagramHomeCta } from "@/components/instagram-home-cta";

export default function HomePage() {
  return (
    <main className="relative z-10">
      <section className="relative overflow-hidden border-b-4 border-brand-border bg-brand-black">
        <div className="absolute inset-0 opacity-[0.35]">
          <Image
            src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&q=80"
            alt=""
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-brand-black via-brand-black/85 to-brand-black/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-transparent to-brand-black/50" />

        <div className="relative mx-auto flex max-w-6xl flex-col gap-8 px-4 py-20 sm:flex-row sm:items-center sm:py-28">
          <div className="relative mx-auto h-40 w-40 shrink-0 border-4 border-brand-yellow shadow-[8px_8px_0_0_rgba(217,25,32,0.6)] sm:h-48 sm:w-48">
            <Image
              src="/brand/logo-bigboys.jpg"
              alt="BIG BOYS GYM"
              fill
              className="object-cover"
              sizes="200px"
            />
          </div>
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="font-display text-xl uppercase tracking-[0.35em] text-brand-yellow">
              BIG BOYS GYM
            </p>
            <h1 className="mt-2 font-display text-5xl uppercase leading-[0.95] text-white sm:text-6xl md:text-7xl">
              Fuerza real
              <span className="block text-brand-red">Sin excusas</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg">
              Equipamiento serio, comunidad que empuja tus límites y tienda con lo que
              necesitás para entrenar duro. Bienvenido a la familia.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4 sm:justify-start">
              <Link href="/tienda" className="btn-brand">
                Ir a la tienda
              </Link>
              <a href={REGISTRO_ENTRY_HREF} className="btn-brand-outline inline-block text-center">
                Crear cuenta
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b-4 border-brand-border bg-brand-steel py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center font-display text-4xl uppercase tracking-wide text-white md:text-5xl">
            El lugar para <span className="text-brand-yellow">crecer</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-zinc-400">
            Sala de pesas, zona funcional y asesoramiento. Sumate al ritmo de BIG
            BOYS.
          </p>
        </div>
      </section>

      <InstagramCarousel />

      <InstagramHomeCta />
    </main>
  );
}
