"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { LOGIN_ENTRY_HREF } from "@/lib/auth-routes";
import { useAuth } from "@/lib/auth-context";
import { INSTAGRAM_PROFILE_URL } from "@/data/instagram-gallery";
import { InstagramIcon } from "@/components/instagram-icon";

const LEGAL_LINKS = [
  { href: "/terminos", label: "Términos y condiciones" },
  { href: "/privacidad", label: "Política de privacidad" },
  { href: "/devoluciones", label: "Devoluciones" },
] as const;

const navLink: CSSProperties = {
  color: "rgba(255,255,255,0.65)",
  textDecoration: "none",
  fontSize: "14px",
  transition: "var(--transition)",
};

export function SiteFooter() {
  const year = new Date().getFullYear();
  const { isLoggedIn, isLoading } = useAuth();

  return (
    <footer
      style={{
        background: "#000000",
        borderTop: "1px solid rgba(204,0,0,0.3)",
        padding: "60px 24px 24px",
        position: "relative",
        zIndex: 2,
        marginTop: "auto",
      }}
    >
      <div className="neon-line" style={{ marginBottom: "48px" }} />

      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "40px",
          marginBottom: "48px",
        }}
      >
        <div>
          <motion.div
            whileHover={{
              scale: 1.05,
              transition: { duration: 0.3 },
            }}
            style={{
              display: "inline-block",
              marginBottom: "16px",
            }}
          >
            <motion.div
              animate={{
                filter: [
                  "drop-shadow(0 0 10px rgba(204,0,0,0.3))",
                  "drop-shadow(0 0 20px rgba(204,0,0,0.6))",
                  "drop-shadow(0 0 10px rgba(204,0,0,0.3))",
                ],
                y: [0, -4, 0],
              }}
              whileHover={{
                filter:
                  "drop-shadow(0 0 24px rgba(204,0,0,0.9)) " +
                  "drop-shadow(0 0 48px rgba(204,0,0,0.4))",
                scale: 1.06,
              }}
              transition={{
                filter: {
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
                y: {
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
                scale: { duration: 0.3 },
              }}
              style={{ display: "inline-block" }}
            >
              <Image
                src="/brand/logo-BigBoysGYM.png"
                alt="Big Boys Gym"
                width={160}
                height={80}
                quality={85}
                sizes="160px"
                style={{
                  height: "80px",
                  width: "auto",
                  objectFit: "contain",
                }}
              />
            </motion.div>
          </motion.div>
          <p
            style={{
              color: "rgba(255,255,255,0.4)",
              fontSize: "13px",
              lineHeight: 1.7,
              marginBottom: "16px",
            }}
          >
            El gym más intenso de Manizales.
            <br />
            Transformamos cuerpos y vidas. 💪
          </p>
        </div>

        <div>
          <p
            style={{
              fontFamily: "var(--font-display), Impact, sans-serif",
              color: "#ffd700",
              fontSize: "11px",
              letterSpacing: "3px",
              textTransform: "uppercase",
              marginBottom: "16px",
            }}
          >
            Navegación
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <Link href="/" style={navLink}>
              Inicio
            </Link>
            <Link href="/entrenamientos" style={navLink}>
              Entrenamientos
            </Link>
            <Link href="/tienda" style={navLink}>
              Tienda
            </Link>
            {!isLoading && isLoggedIn ? (
              <Link href="/perfil" style={navLink}>
                Mi perfil
              </Link>
            ) : !isLoading ? (
              <a href={LOGIN_ENTRY_HREF} style={navLink}>
                Cuenta
              </a>
            ) : null}
          </div>
        </div>

        <div>
          <p
            style={{
              fontFamily: "var(--font-display), Impact, sans-serif",
              color: "#ffd700",
              fontSize: "11px",
              letterSpacing: "3px",
              textTransform: "uppercase",
              marginBottom: "16px",
            }}
          >
            Legal
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {LEGAL_LINKS.map((link) => (
              <Link key={link.href} href={link.href} style={navLink}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p
            style={{
              fontFamily: "var(--font-display), Impact, sans-serif",
              color: "#ffd700",
              fontSize: "11px",
              letterSpacing: "3px",
              textTransform: "uppercase",
              marginBottom: "16px",
            }}
          >
            Contacto
          </p>
          <a
            href={INSTAGRAM_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="glass"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 16px",
              borderRadius: "4px",
              color: "#ffd700",
              textDecoration: "none",
              fontSize: "14px",
              border: "1px solid rgba(204,0,0,0.35)",
            }}
          >
            <InstagramIcon className="h-5 w-5" decorative />
            Instagram
          </a>
          <p style={{ marginTop: "16px", color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>
            Manizales, Colombia
          </p>
        </div>
      </div>

      <div className="neon-line" style={{ marginBottom: "24px" }} />

      <p
        style={{
          color: "rgba(255,255,255,0.2)",
          fontSize: "12px",
          textAlign: "center",
          fontFamily: "var(--font-display), Impact, sans-serif",
          letterSpacing: "2px",
        }}
      >
        © {year} BIG BOYS GYM · MANIZALES, COLOMBIA
      </p>
    </footer>
  );
}
