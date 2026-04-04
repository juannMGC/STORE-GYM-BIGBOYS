import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <section className="relative overflow-hidden bg-zinc-950 text-white">
        <div className="absolute inset-0 opacity-40">
          <Image
            src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&q=80"
            alt=""
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-24 sm:py-32">
          <p className="text-sm font-semibold uppercase tracking-widest text-amber-400">
            Big Boys Gym
          </p>
          <h1 className="mt-2 max-w-2xl text-4xl font-black leading-tight tracking-tight sm:text-5xl">
            Fuerza, disciplina y comunidad
          </h1>
          <p className="mt-4 max-w-xl text-lg text-zinc-300">
            Entrená en un ambiente serio, con equipamiento de calidad y el apoyo
            de un equipo que empuja tus límites. Conocé nuestra tienda y llevate
            lo mejor para tu rutina.
          </p>
          <Link
            href="/tienda"
            className="mt-8 inline-flex rounded-lg bg-amber-500 px-6 py-3 text-base font-semibold text-zinc-950 hover:bg-amber-400"
          >
            Ir a la tienda
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-2xl font-bold text-zinc-900">
          El lugar para crecer
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-zinc-600">
          Sala de pesas, zona funcional y asesoramiento. Sumate a Big Boys y
          formá parte de la familia.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {[
            {
              src: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80",
              alt: "Entrenamiento con pesas",
            },
            {
              src: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&q=80",
              alt: "Zona de gimnasio",
            },
            {
              src: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80",
              alt: "Equipamiento",
            },
          ].map((img) => (
            <div
              key={img.src}
              className="relative aspect-[4/3] overflow-hidden rounded-xl shadow-lg"
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover transition hover:scale-105"
                sizes="(max-width: 640px) 100vw, 33vw"
              />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
