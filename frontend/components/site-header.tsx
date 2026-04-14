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

const mobileNavLink: CSSProperties = {
  display: "block",
  padding: "12px 20px",
  color: "#e4e4e7",
  textDecoration: "none",
  fontFamily: "var(--font-display)",
  fontSize: "14px",
  letterSpacing: "2px",
  textTransform: "uppercase",
  borderBottom: "1px solid #1a1a1a",
};

const mobileDivider: CSSProperties = {
  height: "1px",
  background: "#2a2a2a",
  margin: "4px 0",
};

/**
 * Auth en nav: usa `useAuth` (no `useUser` de Auth0).
 * Móvil: menú hamburguesa; desktop: nav completa (≥768px).
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
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

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

  const closeMobile = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-[100] border-b-4 border-brand-red bg-brand-black/95 shadow-[0_4px_24px_rgba(0,0,0,0.6)] backdrop-blur-sm">
      <div
        className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4"
        style={{ minHeight: "60px" }}
      >
        <Link
          href="/"
          onClick={closeMobile}
          className="flex min-w-0 items-center gap-2 transition hover:opacity-90 sm:gap-3"
        >
          <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-sm border-2 border-brand-yellow/80 bg-black sm:h-14 sm:w-14">
            <Image
              src="/brand/logo-bigboys.jpg"
              alt="BIG BOYS GYM"
              fill
              className="object-cover"
              sizes="56px"
            />
          </span>
          <span className="font-display text-xl leading-none tracking-wide text-brand-yellow sm:text-3xl">
            BIG BOYS
            <span className="block font-display text-xs text-zinc-400 sm:text-base">
              GYM · TIENDA
            </span>
          </span>
        </Link>

        <nav className="header-desktop-nav hidden flex-1 flex-wrap items-center justify-end gap-1 text-sm md:flex sm:gap-2">
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
          {isLoggedIn && user?.role === "CLIENT" && (
            <Link
              href="/carrito"
              className="rounded-sm px-2 py-1.5 font-semibold uppercase tracking-wide text-brand-yellow hover:bg-brand-red/20"
            >
              Carrito
            </Link>
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

        <div className="flex shrink-0 items-center gap-2 md:gap-3">
          {isLoading && (
            <div
              className="shrink-0 animate-pulse rounded-full border border-[#2a2a2a] bg-[#1a1a1a]"
              style={{ width: "40px", height: "40px" }}
              aria-hidden
            />
          )}
          {isLoggedIn && !isLoading && (
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
                      <>
                        <Link
                          href="/carrito"
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
                          🛒 Carrito
                        </Link>
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
                      </>
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
          )}

          <button
            type="button"
            className="header-hamburger-btn flex items-center justify-center md:hidden"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "8px",
              color: "#e4e4e7",
            }}
          >
            {menuOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <nav
          className="header-mobile-nav border-t border-brand-border bg-[#111111] md:hidden"
          style={{ padding: "8px 0" }}
        >
          <Link href="/" style={mobileNavLink} onClick={closeMobile}>
            Inicio
          </Link>
          <Link href="/tienda" style={mobileNavLink} onClick={closeMobile}>
            Tienda
          </Link>

          {!isLoggedIn && !isLoading && (
            <>
              <div style={mobileDivider} />
              <a href={entrarHref} style={mobileNavLink} onClick={closeMobile}>
                Entrar
              </a>
              <a href={registroHref} style={{ ...mobileNavLink, color: "#d91920" }} onClick={closeMobile}>
                Registro
              </a>
            </>
          )}

          {isLoggedIn && (
            <>
              <div style={mobileDivider} />
              {user?.role === "CLIENT" && (
                <>
                  <Link href="/carrito" style={mobileNavLink} onClick={closeMobile}>
                    Carrito
                  </Link>
                  <Link href="/mis-pedidos" style={mobileNavLink} onClick={closeMobile}>
                    Mis pedidos
                  </Link>
                </>
              )}
              <Link href="/perfil" style={mobileNavLink} onClick={closeMobile}>
                Mi perfil
              </Link>
              {isAdmin && (
                <Link href="/admin" style={mobileNavLink} onClick={closeMobile}>
                  Panel admin
                </Link>
              )}
              <div style={mobileDivider} />
              <a
                href="/auth/logout"
                style={{ ...mobileNavLink, color: "#d91920", borderBottom: "none" }}
                onClick={closeMobile}
              >
                Cerrar sesión
              </a>
            </>
          )}
        </nav>
      ) : null}
    </header>
  );
}
