"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useAuth } from "@/lib/auth-context";
import { auth0LoginHref, auth0SignupHref } from "@/lib/auth-routes";

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const dropdownLinkStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "10px 16px",
  color: "#e4e4e7",
  textDecoration: "none",
  fontSize: "14px",
  transition: "background 0.15s",
};

/**
 * Auth en nav: usa `useAuth` (no `useUser` de Auth0).
 * Entrar / Registro = <a> navegación completa (Auth0).
 */
export function SiteHeader() {
  const pathname = usePathname() ?? "/";
  const returnTo = pathname || "/";
  const entrarHref = auth0LoginHref(returnTo, "login");
  const registroHref = auth0SignupHref(returnTo);
  const { user, auth0User, displayName, isLoggedIn, isLoading } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const showGuestNav = !isLoggedIn && !isLoading;

  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const labelForInitials =
    user?.name?.trim() ||
    user?.email?.trim() ||
    (auth0User as { email?: string; name?: string } | undefined)?.name?.trim() ||
    (auth0User as { email?: string } | undefined)?.email?.trim() ||
    "U";

  return (
    <header className="sticky top-0 z-[100] border-b-4 border-brand-red bg-brand-black/95 shadow-[0_4px_24px_rgba(0,0,0,0.6)] backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:h-[4.5rem]">
        <Link
          href="/"
          className="flex items-center gap-3 transition hover:opacity-90"
        >
          <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-sm border-2 border-brand-yellow/80 bg-black sm:h-14 sm:w-14">
            <Image
              src="/brand/logo-bigboys.jpg"
              alt="BIG BOYS GYM"
              fill
              className="object-cover"
              sizes="56px"
            />
          </span>
          <span className="font-display text-2xl leading-none tracking-wide text-brand-yellow sm:text-3xl">
            BIG BOYS
            <span className="block font-display text-sm text-zinc-400 sm:text-base">
              GYM · TIENDA
            </span>
          </span>
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-1 text-sm sm:gap-2">
          <Link
            href="/"
            className="rounded-sm px-2 py-1.5 font-medium uppercase tracking-wide text-zinc-300 hover:bg-brand-steel hover:text-brand-yellow"
          >
            Inicio
          </Link>
          <Link
            href="/tienda"
            className="rounded-sm px-2 py-1.5 font-medium uppercase tracking-wide text-zinc-300 hover:bg-brand-steel hover:text-brand-yellow"
          >
            Tienda
          </Link>
          {isLoading && !isLoggedIn && (
            <span className="text-xs text-zinc-500">Cargando…</span>
          )}
          {isLoggedIn && (
            <>
              <Link
                href="/carrito"
                className="rounded-sm px-2 py-1.5 font-semibold uppercase tracking-wide text-brand-yellow hover:bg-brand-red/20"
              >
                Carrito
              </Link>
              <div style={{ position: "relative" }} ref={dropdownRef}>
                <button
                  type="button"
                  aria-expanded={open}
                  aria-haspopup="menu"
                  onClick={() => setOpen((v) => !v)}
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    border: "2px solid #d91920",
                    overflow: "hidden",
                    cursor: "pointer",
                    background: "#1a1a1a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                    transition: "border-color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#f7e047";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#d91920";
                  }}
                >
                  {user?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatarUrl}
                      alt={user.name ?? "Avatar"}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        color: "#f7e047",
                        fontSize: "14px",
                        fontWeight: 700,
                        fontFamily: "var(--font-display)",
                        letterSpacing: "1px",
                      }}
                    >
                      {initials(labelForInitials)}
                    </span>
                  )}
                </button>

                {open ? (
                  <div
                    role="menu"
                    style={{
                      position: "absolute",
                      top: "calc(100% + 12px)",
                      right: 0,
                      width: "min(240px, calc(100vw - 32px))",
                      background: "#111111",
                      border: "1px solid #2a2a2a",
                      boxShadow: "4px 4px 0px #d91920",
                      zIndex: 200,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        padding: "16px",
                        borderBottom: "1px solid #2a2a2a",
                        background: "#1a1a1a",
                      }}
                    >
                      <p
                        style={{
                          color: "#f7e047",
                          fontFamily: "var(--font-display)",
                          fontSize: "16px",
                          textTransform: "uppercase",
                          letterSpacing: "2px",
                          margin: 0,
                        }}
                      >
                        {user?.name?.trim() || displayName.trim() || "Mi cuenta"}
                      </p>
                      <p
                        style={{
                          color: "#52525b",
                          fontSize: "12px",
                          margin: "4px 0 0",
                          wordBreak: "break-word",
                        }}
                      >
                        {user?.email ?? (auth0User as { email?: string })?.email ?? ""}
                      </p>
                    </div>

                    <nav style={{ padding: "8px 0" }}>
                      <Link
                        href="/perfil"
                        role="menuitem"
                        style={dropdownLinkStyle}
                        onClick={() => setOpen(false)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#1a1a1a";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                        }}
                      >
                        👤 Mi perfil
                      </Link>
                      {user?.role === "CLIENT" && (
                        <Link
                          href="/mis-pedidos"
                          role="menuitem"
                          style={dropdownLinkStyle}
                          onClick={() => setOpen(false)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#1a1a1a";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                          }}
                        >
                          📦 Mis pedidos
                        </Link>
                      )}
                      {isAdmin && (
                        <Link
                          href="/admin"
                          role="menuitem"
                          style={dropdownLinkStyle}
                          onClick={() => setOpen(false)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#1a1a1a";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                          }}
                        >
                          ⚙️ Panel admin
                        </Link>
                      )}
                      <div
                        style={{
                          height: "1px",
                          background: "#2a2a2a",
                          margin: "8px 0",
                        }}
                      />
                      <a
                        href="/auth/logout"
                        role="menuitem"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "10px 16px",
                          color: "#d91920",
                          textDecoration: "none",
                          fontSize: "14px",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#1a1a1a";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                        }}
                      >
                        🚪 Cerrar sesión
                      </a>
                    </nav>
                  </div>
                ) : null}
              </div>
            </>
          )}
          {showGuestNav ? (
            <>
              <a
                href={entrarHref}
                className="rounded-sm px-2 py-1.5 font-medium text-zinc-400 hover:text-white"
              >
                Entrar
              </a>
              <a
                href={registroHref}
                className="rounded-sm border-2 border-brand-red bg-brand-red px-3 py-1.5 font-display text-sm uppercase tracking-wide text-white hover:bg-brand-red-dark"
              >
                Registro
              </a>
            </>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
