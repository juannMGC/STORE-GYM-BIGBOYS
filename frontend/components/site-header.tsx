"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useAuth } from "@/lib/auth-context";
import { auth0LoginHref, auth0SignupHref } from "@/lib/auth-routes";
import { NotificationBell } from "@/components/notification-bell";

const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/entrenamientos", label: "Entrenamientos" },
  { href: "/tienda", label: "Tienda" },
] as const;

const MotionLink = motion(Link);

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

const linkBase: CSSProperties = {
  fontFamily: "var(--font-display), Impact, sans-serif",
  fontSize: "13px",
  textDecoration: "none",
  letterSpacing: "3px",
  textTransform: "uppercase",
  transition: "var(--transition)",
};

export function SiteHeader() {
  const pathname = usePathname() ?? "/";
  const returnTo = pathname || "/";
  const entrarHref = auth0LoginHref(returnTo, "login");
  const registroHref = auth0SignupHref(returnTo);
  const { user, auth0User, displayName, isLoggedIn, isLoading } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const showGuestNav = !isLoggedIn && !isLoading;

  const [menuOpen, setMenuOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const prev = lastScrollY.current;
    lastScrollY.current = latest;
    setHidden(latest > prev && latest > 150);
    setScrolled(latest > 50);
  });

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

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

  return (
    <>
      <motion.header
        animate={{
          y: hidden && !menuOpen ? -80 : 0,
          backgroundColor: scrolled || menuOpen ? "rgba(0,0,0,0.98)" : "rgba(0,0,0,0.82)",
        }}
        transition={{ duration: 0.3 }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "64px",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: `1px solid ${scrolled || menuOpen ? "rgba(204,0,0,0.5)" : "rgba(204,0,0,0.3)"}`,
          boxShadow: "0 4px 30px rgba(204,0,0,0.12)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
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
          <MotionLink
            href="/"
            onClick={() => setMenuOpen(false)}
            className="header-brand-link"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              textDecoration: "none",
              flexShrink: 0,
              minWidth: 0,
            }}
          >
            <motion.div
              style={{ display: "flex", alignItems: "center", flexShrink: 0 }}
              whileHover={{
                filter:
                  "drop-shadow(0 0 16px rgba(204,0,0,0.9)) " +
                  "drop-shadow(0 0 32px rgba(204,0,0,0.4))",
                scale: 1.08,
              }}
              animate={{
                filter: [
                  "drop-shadow(0 0 6px rgba(204,0,0,0.4))",
                  "drop-shadow(0 0 12px rgba(204,0,0,0.7))",
                  "drop-shadow(0 0 6px rgba(204,0,0,0.4))",
                ],
              }}
              transition={{
                filter: {
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
                scale: { duration: 0.2 },
              }}
            >
              <Image
                src="/brand/logo-BigBoysGYM.png"
                alt="Big Boys Gym"
                width={120}
                height={48}
                priority
                quality={90}
                sizes="(max-width: 768px) min(140px, 38vw), 120px"
                style={{
                  height: "48px",
                  width: "auto",
                  maxWidth: "min(140px, 38vw)",
                  objectFit: "contain",
                }}
              />
            </motion.div>
            <motion.div
              className="hide-mobile"
              whileHover={{
                x: 4,
                transition: { duration: 0.2 },
              }}
              style={{ display: "flex", flexDirection: "column", minWidth: 0 }}
            >
              <motion.div
                style={{
                  fontFamily: "var(--font-display), Impact, sans-serif",
                  fontSize: "16px",
                  color: "#ffffff",
                  letterSpacing: "3px",
                  lineHeight: 1,
                  textTransform: "uppercase",
                }}
              >
                BIG BOYS
              </motion.div>
              <motion.div
                animate={{
                  textShadow: [
                    "0 0 8px rgba(204,0,0,0.6)",
                    "0 0 16px rgba(204,0,0,0.9)",
                    "0 0 8px rgba(204,0,0,0.6)",
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{
                  fontFamily: "var(--font-display), Impact, sans-serif",
                  fontSize: "12px",
                  color: "#CC0000",
                  letterSpacing: "5px",
                  textTransform: "uppercase",
                }}
              >
                GYM
              </motion.div>
            </motion.div>
          </MotionLink>

          <nav
            className="nav-desktop header-desktop-nav"
            style={{
              display: "flex",
              gap: "clamp(12px, 2vw, 28px)",
              alignItems: "center",
              marginLeft: "auto",
              marginRight: "12px",
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}
          >
            {NAV_LINKS.map((link, i) => {
              const active = isActive(link.href);
              return (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.3 }}
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
              <Link href="/carrito" style={{ ...linkBase, color: "var(--gold)", fontWeight: 600 }}>
                Carrito
              </Link>
            )}
            {showGuestNav ? (
              <>
                <a href={entrarHref} style={{ ...linkBase, color: "rgba(255,255,255,0.55)", fontSize: "12px" }}>
                  Entrar
                </a>
                <a href={registroHref} className="btn-primary" style={{ padding: "10px 18px", fontSize: "11px" }}>
                  Registro
                </a>
              </>
            ) : null}
          </nav>

          <div
            className="hide-mobile"
            style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}
          >
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
                        zIndex: 1200,
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
                        <p style={{ color: "#71717a", fontSize: "12px", margin: "4px 0 0", wordBreak: "break-word" }}>
                          {user?.email ?? (auth0User as { email?: string })?.email ?? ""}
                        </p>
                      </div>
                      <nav style={{ padding: "8px 0" }}>
                        <Link href="/perfil" role="menuitem" style={dropdownLinkStyle} onClick={() => setOpen(false)}>
                          👤 Mi perfil
                        </Link>
                        {user?.role === "CLIENT" && (
                          <>
                            <Link href="/carrito" role="menuitem" style={dropdownLinkStyle} onClick={() => setOpen(false)}>
                              🛒 Carrito
                            </Link>
                            <Link href="/mis-pedidos" role="menuitem" style={dropdownLinkStyle} onClick={() => setOpen(false)}>
                              📦 Mis pedidos
                            </Link>
                          </>
                        )}
                        {isAdmin && (
                          <Link href="/admin" role="menuitem" style={dropdownLinkStyle} onClick={() => setOpen(false)}>
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
          </div>

          <div className="show-mobile-flex header-mobile-actions">
            {isLoggedIn && !isLoading && <NotificationBell />}
            <motion.button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              whileTap={{ scale: 0.92 }}
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={menuOpen}
              style={{
                background: "rgba(204,0,0,0.2)",
                border: "1px solid rgba(204,0,0,0.45)",
                cursor: "pointer",
                padding: "10px",
                borderRadius: "4px",
                display: "flex",
                flexDirection: "column",
                gap: "5px",
                alignItems: "center",
                justifyContent: "center",
                minWidth: "44px",
                minHeight: "44px",
                zIndex: 1100,
              }}
            >
              <motion.span
                animate={{
                  rotate: menuOpen ? 45 : 0,
                  y: menuOpen ? 7 : 0,
                  background: menuOpen ? "#CC0000" : "#ffffff",
                }}
                style={{ display: "block", width: "22px", height: "2px", borderRadius: "2px" }}
              />
              <motion.span
                animate={{ opacity: menuOpen ? 0 : 1, scaleX: menuOpen ? 0 : 1 }}
                style={{ display: "block", width: "22px", height: "2px", background: "#ffffff", borderRadius: "2px" }}
              />
              <motion.span
                animate={{
                  rotate: menuOpen ? -45 : 0,
                  y: menuOpen ? -7 : 0,
                  background: menuOpen ? "#CC0000" : "#ffffff",
                }}
                style={{ display: "block", width: "22px", height: "2px", borderRadius: "2px" }}
              />
            </motion.button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {menuOpen ? (
          <motion.div
            key="mob-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setMenuOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.55)",
              zIndex: 1005,
              backdropFilter: "blur(4px)",
            }}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {menuOpen ? (
          <motion.div
            key="mob-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              width: "min(320px, 88vw)",
              background: "#050505",
              borderLeft: "1px solid rgba(204,0,0,0.35)",
              zIndex: 1010,
              display: "flex",
              flexDirection: "column",
              paddingTop: "72px",
              paddingBottom: "24px",
              boxShadow: "-12px 0 48px rgba(0,0,0,0.6)",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                padding: "0 24px 32px",
                borderBottom: "1px solid rgba(204,0,0,0.2)",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <motion.div
                animate={{
                  filter: [
                    "drop-shadow(0 0 8px rgba(204,0,0,0.4))",
                    "drop-shadow(0 0 16px rgba(204,0,0,0.7))",
                    "drop-shadow(0 0 8px rgba(204,0,0,0.4))",
                  ],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{ display: "flex", alignItems: "center", flexShrink: 0 }}
              >
                <Image
                  src="/brand/logo-BigBoysGYM.png"
                  alt="Big Boys Gym"
                  width={180}
                  height={60}
                  quality={90}
                  sizes="180px"
                  style={{
                    height: "60px",
                    width: "auto",
                    objectFit: "contain",
                  }}
                />
              </motion.div>
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-display), Impact, sans-serif",
                    fontSize: "18px",
                    color: "#ffffff",
                    letterSpacing: "3px",
                    textTransform: "uppercase",
                    lineHeight: 1,
                  }}
                >
                  BIG BOYS
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-display), Impact, sans-serif",
                    fontSize: "13px",
                    color: "#CC0000",
                    letterSpacing: "5px",
                    textTransform: "uppercase",
                    textShadow: "0 0 8px rgba(204,0,0,0.6)",
                  }}
                >
                  GYM
                </div>
              </div>
            </div>

            <nav style={{ flex: 1, padding: "20px", display: "flex", flexDirection: "column", gap: "6px" }}>
              {NAV_LINKS.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: 28 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "14px 14px",
                      minHeight: "48px",
                      fontFamily: "var(--font-display), Impact, sans-serif",
                      fontSize: "18px",
                      letterSpacing: "3px",
                      textTransform: "uppercase",
                      color: isActive(link.href) ? "#FF0000" : "#ffffff",
                      textDecoration: "none",
                      borderLeft: isActive(link.href) ? "3px solid #CC0000" : "3px solid transparent",
                      background: isActive(link.href) ? "rgba(204,0,0,0.1)" : "transparent",
                    }}
                  >
                    {isActive(link.href) ? (
                      <span
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: "#CC0000",
                          boxShadow: "0 0 8px rgba(204,0,0,0.8)",
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <span style={{ width: "6px", flexShrink: 0 }} />
                    )}
                    {link.label}
                  </Link>
                </motion.div>
              ))}

              <div style={{ height: "1px", background: "rgba(204,0,0,0.2)", margin: "12px 0" }} />

              {isLoggedIn ? (
                <>
                  {user?.role === "CLIENT" && (
                    <>
                      <Link
                        href="/carrito"
                        onClick={() => setMenuOpen(false)}
                        style={{
                          display: "block",
                          padding: "12px 14px",
                          minHeight: "44px",
                          fontFamily: "var(--font-display), Impact, sans-serif",
                          fontSize: "15px",
                          letterSpacing: "2px",
                          textTransform: "uppercase",
                          color: "var(--gold)",
                          textDecoration: "none",
                        }}
                      >
                        🛒 Carrito
                      </Link>
                      <Link
                        href="/mis-pedidos"
                        onClick={() => setMenuOpen(false)}
                        style={{
                          display: "block",
                          padding: "12px 14px",
                          minHeight: "44px",
                          fontFamily: "var(--font-display), Impact, sans-serif",
                          fontSize: "15px",
                          letterSpacing: "2px",
                          textTransform: "uppercase",
                          color: "rgba(255,255,255,0.75)",
                          textDecoration: "none",
                        }}
                      >
                        📦 Mis pedidos
                      </Link>
                    </>
                  )}
                  <Link
                    href="/perfil"
                    onClick={() => setMenuOpen(false)}
                    style={{
                      display: "block",
                      padding: "12px 14px",
                      minHeight: "44px",
                      fontFamily: "var(--font-display), Impact, sans-serif",
                      fontSize: "15px",
                      letterSpacing: "2px",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.75)",
                      textDecoration: "none",
                    }}
                  >
                    👤 Mi perfil
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setMenuOpen(false)}
                      style={{
                        display: "block",
                        padding: "12px 14px",
                        minHeight: "44px",
                        fontFamily: "var(--font-display), Impact, sans-serif",
                        fontSize: "15px",
                        letterSpacing: "2px",
                        textTransform: "uppercase",
                        color: "#FFD700",
                        textDecoration: "none",
                      }}
                    >
                      ⚙️ Panel admin
                    </Link>
                  )}
                  <a
                    href="/auth/logout"
                    onClick={() => setMenuOpen(false)}
                    style={{
                      display: "block",
                      padding: "12px 14px",
                      marginTop: "8px",
                      minHeight: "44px",
                      fontFamily: "var(--font-display), Impact, sans-serif",
                      fontSize: "15px",
                      letterSpacing: "2px",
                      textTransform: "uppercase",
                      color: "#CC0000",
                      textDecoration: "none",
                    }}
                  >
                    Cerrar sesión
                  </a>
                </>
              ) : (
                !isLoading && (
                  <>
                    <a
                      href={entrarHref}
                      onClick={() => setMenuOpen(false)}
                      style={{
                        display: "block",
                        padding: "14px",
                        margin: "8px 0",
                        minHeight: "48px",
                        textAlign: "center",
                        background: "#CC0000",
                        color: "#ffffff",
                        fontFamily: "var(--font-display), Impact, sans-serif",
                        fontSize: "15px",
                        letterSpacing: "3px",
                        textTransform: "uppercase",
                        textDecoration: "none",
                      }}
                    >
                      Entrar
                    </a>
                    <a
                      href={registroHref}
                      onClick={() => setMenuOpen(false)}
                      style={{
                        display: "block",
                        padding: "12px",
                        textAlign: "center",
                        color: "rgba(255,255,255,0.85)",
                        fontFamily: "var(--font-display), Impact, sans-serif",
                        fontSize: "14px",
                        letterSpacing: "2px",
                        textDecoration: "none",
                      }}
                    >
                      Crear cuenta
                    </a>
                  </>
                )
              )}
            </nav>

            <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(204,0,0,0.2)" }}>
              <a
                href="https://wa.me/573171184925"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  color: "#25D366",
                  textDecoration: "none",
                  fontFamily: "var(--font-display), Impact, sans-serif",
                  fontSize: "13px",
                  letterSpacing: "2px",
                  minHeight: "44px",
                }}
              >
                💬 WhatsApp
              </a>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
