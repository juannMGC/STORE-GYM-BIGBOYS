"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import {
  INSTAGRAM_GALLERY,
  INSTAGRAM_PROFILE_URL,
} from "@/data/instagram-gallery";
import { InstagramIcon } from "@/components/instagram-icon";

const AUTO_MS = 5500;

export function InstagramCarousel() {
  const len = INSTAGRAM_GALLERY.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || len <= 1) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % len);
    }, AUTO_MS);
    return () => clearInterval(t);
  }, [paused, len]);

  const go = useCallback(
    (dir: -1 | 1) => {
      setIndex((i) => (i + dir + len) % len);
    },
    [len],
  );

  return (
    <section
      className="border-b-4 border-brand-border bg-brand-black py-16 md:py-20"
      aria-labelledby="instagram-gallery-heading"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="mx-auto max-w-5xl px-4">
        <div className="flex flex-col items-center text-center">
          <a
            href={INSTAGRAM_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-3 flex items-center gap-2 text-brand-yellow transition hover:text-white"
          >
            <InstagramIcon className="h-10 w-10 md:h-12 md:w-12" decorative />
            <span className="font-display text-3xl uppercase tracking-wide md:text-4xl">
              @bigboys.gym
            </span>
          </a>
          <p id="instagram-gallery-heading" className="max-w-lg text-zinc-400">
            Deslizá o esperá: cada foto al estilo del feed. Abrí el perfil para ver
            todo en{" "}
            <span className="text-zinc-300">Instagram</span>.
          </p>
        </div>

        <div className="relative mt-10">
          <div className="panel-brand relative mx-auto aspect-[4/5] max-h-[min(78vh,640px)] w-full max-w-lg overflow-hidden md:aspect-[3/4] md:max-h-[min(82vh,720px)]">
            {INSTAGRAM_GALLERY.map((img, i) => (
              <div
                key={img.src}
                className="absolute inset-0 transition-opacity duration-500 ease-out"
                style={{ opacity: i === index ? 1 : 0, pointerEvents: i === index ? "auto" : "none" }}
                aria-hidden={i !== index}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 512px"
                  priority={i === 0}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-black/90 via-transparent to-brand-black/40" />
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                  <p className="font-display text-lg uppercase tracking-wide text-white drop-shadow md:text-xl">
                    {img.alt}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    {index + 1} / {len}
                  </p>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() => go(-1)}
              className="absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center border-2 border-brand-border bg-brand-steel/90 text-2xl text-brand-yellow shadow-[4px_4px_0_0_rgba(0,0,0,0.5)] transition hover:bg-brand-red hover:text-white md:left-3"
              aria-label="Imagen anterior"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center border-2 border-brand-border bg-brand-steel/90 text-2xl text-brand-yellow shadow-[4px_4px_0_0_rgba(0,0,0,0.5)] transition hover:bg-brand-red hover:text-white md:right-3"
              aria-label="Imagen siguiente"
            >
              ›
            </button>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {INSTAGRAM_GALLERY.map((img, i) => (
              <button
                key={img.src}
                type="button"
                onClick={() => setIndex(i)}
                className={`h-2.5 rounded-full transition-all ${
                  i === index
                    ? "w-8 bg-brand-yellow"
                    : "w-2.5 bg-zinc-600 hover:bg-zinc-500"
                }`}
                aria-label={`Ir a imagen ${i + 1}`}
                aria-current={i === index}
              />
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <a
              href={INSTAGRAM_PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-brand-outline inline-flex gap-2"
            >
              <InstagramIcon className="h-6 w-6" decorative />
              Ver perfil en Instagram
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
