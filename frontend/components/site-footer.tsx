"use client";

import Link from "next/link";
import { LOGIN_ENTRY_HREF } from "@/lib/auth-routes";
import { useAuth } from "@/lib/auth-context";
import { INSTAGRAM_PROFILE_URL } from "@/data/instagram-gallery";
import { InstagramIcon } from "@/components/instagram-icon";

const LEGAL_LINKS = [
  { href: "/terminos", label: "Términos y condiciones" },
  { href: "/privacidad", label: "Política de privacidad" },
  { href: "/devoluciones", label: "Devoluciones" },
] as const;

export function SiteFooter() {
  const year = new Date().getFullYear();
  const { isLoggedIn, isLoading } = useAuth();

  return (
    <footer className="relative z-10 mt-auto border-t-4 border-brand-border bg-brand-black py-10 text-center">
      <div className="mx-auto max-w-6xl px-4">
        <p className="font-display text-xl uppercase tracking-[0.2em] text-brand-yellow">
          BIG BOYS GYM
        </p>
        <p className="mt-2 text-sm text-zinc-500">Tienda oficial · Manizales, Colombia</p>
        <p className="mt-3 font-medium text-zinc-400">Entrená fuerte. Equipate como un profesional.</p>
        <div className="mt-6 flex justify-center gap-6 text-sm">
          <Link href="/tienda" className="text-brand-yellow/80 hover:text-brand-yellow">
            Tienda
          </Link>
          {!isLoading && isLoggedIn ? (
            <Link href="/perfil" className="text-zinc-500 hover:text-zinc-300">
              Mi perfil
            </Link>
          ) : !isLoading ? (
            <a href={LOGIN_ENTRY_HREF} className="text-zinc-500 hover:text-zinc-300">
              Cuenta
            </a>
          ) : (
            <span className="inline-block h-4 w-14 animate-pulse rounded bg-zinc-800" aria-hidden />
          )}
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

        <div className="mt-10 flex justify-center">
          <div className="text-left">
            <p
              style={{
                fontFamily: "var(--font-display)",
                color: "#f7e047",
                fontSize: "11px",
                letterSpacing: "3px",
                textTransform: "uppercase",
                marginBottom: "12px",
              }}
            >
              Legal
            </p>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              {LEGAL_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-[13px] text-zinc-600 transition-colors hover:text-brand-yellow"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <p
          style={{
            color: "#27272a",
            fontSize: "11px",
            marginTop: "24px",
            borderTop: "1px solid #1a1a1a",
            paddingTop: "16px",
          }}
        >
          © {year} Big Boys Gym · Manizales, Colombia ·{" "}
          <Link href="/privacidad" className="text-zinc-600 transition-colors hover:text-zinc-500">
            Privacidad
          </Link>
          {" · "}
          <Link href="/terminos" className="text-zinc-600 transition-colors hover:text-zinc-500">
            Términos
          </Link>
        </p>
      </div>
    </footer>
  );
}
