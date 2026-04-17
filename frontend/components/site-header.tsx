"use client";

import Link from "next/link";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useAuth } from "@/lib/auth-context";
import { auth0LoginHref, auth0SignupHref } from "@/lib/auth-routes";
import { NotificationBell } from "@/components/notification-bell";

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
  fontFamily: "var(--font-display), Impact, sans-serif",
  fontSize: "14px",
  letterSpacing: "2px",
  textTransform: "uppercase",
  borderBottom: "1px solid rgba(204,0,0,0.15)",
};

const mobileDivider: CSSProperties = {
  height: "1px",
  background: "rgba(204,0,0,0.2)",
  margin: "4px 0",
};

const headerShell: CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  height: "72px",
  background: "rgba(0,0,0,0.82)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  borderBottom: "1px solid rgba(204,0,0,0.3)",
  boxShadow: "0 4px 30px rgba(204,0,0,0.12)",
  zIndex: 1000,
  display: "flex",
  alignItems: "center",
  padding: "0 16px",
};

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
  const [headerHidden, setHeaderHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const lastScrollY = useRef(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const prev = lastScrollY.current;
    lastScrollY.current = latest;
    setHeaderHidden(latest > prev && latest > 100);
    setScrolled(latest > 50);
  });

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

  const isHomeActive = pathname === "/";
  const isEntrenamientosActive =
    pathname === "/entrenamientos" || pathname.startsWith("/entrenamientos/");
  const isTiendaActive = pathname.startsWith("/tienda");

  function isActive(href: string): boolean {
    if (href === "/") return isHomeActive;
    if (href === "/entrenamientos") return isEntrenamientosActive;
    if (href === "/tienda") return isTiendaActive;
    return false;
  }

  const linkBase: CSSProperties = {
    fontFamily: "var(--font-display), Impact, sans-serif",
    fontSize: "13px",
    textDecoration: "none",
    letterSpacing: "3px",
    textTransform: "uppercase",
    transition: "var(--transition)",
    position: "relative",
  };

  const mobileNavStyle = (active: boolean): CSSProperties =>
    active
      ? { ...mobileNavLink, color: "#ff0000", background: "rgba(204,0,0,0.12)", textShadow: "var(--glow-sm)" }
      : mobileNavLink;

  return (
    <motion.header
      animate={{
        y: headerHidden ? -80 : 0,
        background: scrolled ? "rgba(0,0,0,0.95)" : "rgba(0,0,0,0.82)",
      }}
      transition={{ duration: 0.3 }}
      style={{
        ...headerShell,
        borderBottom: scrolled ? "1px solid rgba(204,0,0,0.5)" : "1px solid rgba(204,0,0,0.3)",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} style={{ marginRight: "auto" }}>
          <Link
            href="/"
            className="header-brand-link"
            onClick={closeMobile}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              textDecoration: "none",
              minWidth: 0,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <motion.img
              src="/brand/logo-BigBoysGYM.jpg"
              alt="Big Boys Gym"
              whileHover={{ filter: "drop-shadow(0 0 16px rgba(204,0,0,0.9))" }}
              style={{
                height: "52px",
                width: "auto",
                maxWidth: "min(160px, 40vw)",
                objectFit: "contain",
                filter: "drop-shadow(0 0 8px rgba(204,0,0,0.6))",
              }}
            />
          <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <span
              style={{
                fontFamily: "var(--font-display), Impact, sans-serif",
                fontSize: "clamp(14px, 3vw, 18px)",
                color: "#ffffff",
                letterSpacing: "4px",
                textTransform: "uppercase",
                lineHeight: 1,
              }}
            >
              BIG BOYS
            </span>
            <span
              style={{
                fontFamily: "var(--font-display), Impact, sans-serif",
                fontSize: "clamp(11px, 2.5vw, 14px)",
                color: "var(--red)",
                letterSpacing: "6px",
                textTransform: "uppercase",
                textShadow: "var(--glow-sm)",
              }}
            >
              GYM
            </span>
          </div>
          </Link>
        </motion.div>

        <nav
          className="header-desktop-nav"
          style={{
            display: "flex",
            gap: "clamp(16px, 3vw, 32px)",
            alignItems: "center",
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          {[
            { href: "/", label: "Inicio" },
            { href: "/entrenamientos", label: "Entrenamientos" },
            { href: "/tienda", label: "Tienda" },
          ].map((link, i) => {
            const active = isActive(link.href);
            return (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.35 }}
                whileHover={{ y: -2 }}
              >
                <Link
                  href={link.href}
                  style={{
                    ...linkBase,
                    color: active ? "var(--red-neon)" : "rgba(255,255,255,0.7)",
                    textShadow: active ? "var(--glow-sm)" : "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--red-neon)";
                    e.currentTarget.style.textShadow = "var(--glow-sm)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive(link.href)) {
                      e.currentTarget.style.color = "rgba(255,255,255,0.7)";
                      e.currentTarget.style.textShadow = "none";
                    }
                  }}
                >
                  {link.label}
                </Link>
              </motion.div>
            );
          })}
          {isLoggedIn && user?.role === "CLIENT" && (
            <Link
              href="/carrito"
              style={{
                ...linkBase,
                color: "var(--gold)",
                fontWeight: 600,
              }}
            >
              Carrito
            </Link>
          )}
          {showGuestNav ? (
            <>
              <a
                href={entrarHref}
                style={{
                  ...linkBase,
                  color: "rgba(255,255,255,0.55)",
                  fontSize: "12px",
                }}
              >
                Entrar
              </a>
              <a href={registroHref} className="btn-primary" style={{ padding: "10px 18px", fontSize: "11px" }}>
                Registro
              </a>
            </>
          ) : null}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginLeft: "12px", flexShrink: 0 }}>
          {isLoading && (
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                border: "1px solid rgba(204,0,0,0.3)",
                background: "var(--black-3)",
                animation: "pulse 1.2s ease-in-out infinite",
              }}
              aria-hidden
            />
          )}
          {isLoggedIn && !isLoading && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <NotificationBell />
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
                    border: "2px solid #cc0000",
                    overflow: "hidden",
                    cursor: "pointer",
                    background: "#0a0a0a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                    transition: "border-color 0.2s, box-shadow 0.2s",
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#ffd700";
                    e.currentTarget.style.boxShadow = "var(--glow-sm)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#cc0000";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {user?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatarUrl}
                      alt={user.name ?? "Avatar"}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <span
                      style={{
                        color: "#ffd700",
                        fontSize: "14px",
                        fontWeight: 700,
                        fontFamily: "var(--font-display), Impact, sans-serif",
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
                      background: "rgba(0,0,0,0.95)",
                      border: "1px solid rgba(204,0,0,0.35)",
                      boxShadow: "var(--glow-sm), 0 12px 40px rgba(0,0,0,0.6)",
                      zIndex: 200,
                      overflow: "hidden",
                      backdropFilter: "blur(16px)",
                    }}
                  >
                    <div
                      style={{
                        padding: "16px",
                        borderBottom: "1px solid rgba(204,0,0,0.2)",
                        background: "rgba(17,17,17,0.9)",
                      }}
                    >
                      <p
                        style={{
                          color: "#ffd700",
                          fontFamily: "var(--font-display), Impact, sans-serif",
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
                          color: "#71717a",
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
                          e.currentTarget.style.background = "rgba(204,0,0,0.1)";
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
                              e.currentTarget.style.background = "rgba(204,0,0,0.1)";
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
                              e.currentTarget.style.background = "rgba(204,0,0,0.1)";
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
                            e.currentTarget.style.background = "rgba(204,0,0,0.1)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                          }}
                        >
                          ⚙️ Panel admin
                        </Link>
                      )}
                      <div style={{ height: "1px", background: "rgba(204,0,0,0.2)", margin: "8px 0" }} />
                      <a
                        href="/auth/logout"
                        role="menuitem"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "10px 16px",
                          color: "#ff0000",
                          textDecoration: "none",
                          fontSize: "14px",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(204,0,0,0.1)";
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
            </div>
          )}

          <button
            type="button"
            className="header-hamburger-btn flex items-center justify-center md:hidden"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            style={{
              background: "rgba(204,0,0,0.2)",
              border: "1px solid rgba(204,0,0,0.4)",
              cursor: "pointer",
              padding: "8px",
              color: "#e4e4e7",
              borderRadius: "4px",
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

      <AnimatePresence>
        {menuOpen ? (
          <motion.nav
            key="mobile-nav"
            className="header-mobile-nav md:hidden"
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            style={{
              position: "fixed",
              inset: 0,
              top: "72px",
              zIndex: 999,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-start",
              paddingTop: "32px",
              gap: "8px",
              background: "rgba(0,0,0,0.97)",
              borderTop: "1px solid rgba(204,0,0,0.25)",
              overflowY: "auto",
            }}
          >
            <Link href="/" style={{ ...mobileNavStyle(isHomeActive), fontSize: "clamp(22px, 6vw, 36px)", letterSpacing: "6px" }} onClick={closeMobile}>
              INICIO
            </Link>
            <Link
              href="/entrenamientos"
              style={{ ...mobileNavStyle(isEntrenamientosActive), fontSize: "clamp(22px, 6vw, 36px)", letterSpacing: "6px" }}
              onClick={closeMobile}
            >
              ENTRENAMIENTOS
            </Link>
            <Link href="/tienda" style={{ ...mobileNavStyle(isTiendaActive), fontSize: "clamp(22px, 6vw, 36px)", letterSpacing: "6px" }} onClick={closeMobile}>
              TIENDA
            </Link>

            {!isLoggedIn && !isLoading && (
              <>
                <div style={mobileDivider} />
                <a href={entrarHref} style={mobileNavLink} onClick={closeMobile}>
                  Entrar
                </a>
                <a
                  href={registroHref}
                  style={{ ...mobileNavLink, color: "#ff0000", borderBottom: "none" }}
                  onClick={closeMobile}
                >
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
                  style={{ ...mobileNavLink, color: "#ff0000", borderBottom: "none" }}
                  onClick={closeMobile}
                >
                  Cerrar sesión
                </a>
              </>
            )}
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </motion.header>
  );
}
