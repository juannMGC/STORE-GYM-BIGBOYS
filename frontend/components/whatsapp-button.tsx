"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useIsMobile } from "@/hooks/use-breakpoint";

const WHATSAPP_NUMBER = "573171184925";

export function WhatsAppButton() {
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipHoverRef = useRef(false);

  const isAdmin = pathname?.startsWith("/admin") ?? false;

  useEffect(() => {
    if (isAdmin) return;
    const timer = setTimeout(() => setVisible(true), 2000);
    const handleScroll = () => {
      if (window.scrollY > 100) setVisible(true);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isAdmin]);

  useEffect(() => {
    if (!visible || isAdmin) return;
    const showTimer = setTimeout(() => {
      setShowTooltip(true);
    }, 1000);
    const hideTimer = setTimeout(() => {
      if (!tooltipHoverRef.current) setShowTooltip(false);
    }, 5000);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [visible, isAdmin]);

  function getMessage(): string {
    if (pathname?.includes("/tienda/productos/")) {
      return (
        "Hola Big Boys Gym! 💪 Tengo una consulta " +
        "sobre un producto que vi en la tienda."
      );
    }
    if (pathname?.includes("/checkout")) {
      return "Hola Big Boys Gym! Necesito ayuda con mi pedido.";
    }
    if (pathname?.includes("/mis-pedidos")) {
      return "Hola Big Boys Gym! Quisiera consultar sobre el estado de mi pedido.";
    }
    return "Hola Big Boys Gym! 💪 Tengo una consulta, ¿me pueden ayudar?";
  }

  const whatsappUrl =
    `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(getMessage())}`;

  if (isAdmin) return null;
  if (!visible) return null;

  return (
    <>
      {showTooltip ? (
        <div className="whatsapp-tooltip">
          💬 ¿Necesitás ayuda?
          <br />
          <span className="whatsapp-tooltip-accent">Escribinos por WhatsApp</span>
          <div className="whatsapp-tooltip-arrow" />
        </div>
      ) : null}

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contactar por WhatsApp"
        className="whatsapp-float-btn"
        style={{
          width: isMobile ? 52 : 60,
          height: isMobile ? 52 : 60,
          bottom: isMobile ? 16 : undefined,
          right: isMobile ? 16 : undefined,
        }}
        onMouseEnter={(e) => {
          tooltipHoverRef.current = true;
          setShowTooltip(true);
          const el = e.currentTarget;
          el.style.transform = "scale(1.08)";
          el.style.boxShadow =
            "0 0 24px rgba(204,0,0,0.55), 0 0 48px rgba(204,0,0,0.25), 0 8px 32px rgba(0,0,0,0.5)";
        }}
        onMouseLeave={(e) => {
          tooltipHoverRef.current = false;
          setShowTooltip(false);
          const el = e.currentTarget;
          el.style.transform = "scale(1)";
          el.style.boxShadow = "0 0 20px rgba(204,0,0,0.35), 0 4px 24px rgba(0,0,0,0.45)";
        }}
        onFocus={() => {
          tooltipHoverRef.current = true;
          setShowTooltip(true);
        }}
        onBlur={() => {
          tooltipHoverRef.current = false;
          setShowTooltip(false);
        }}
      >
        <span className="whatsapp-pulse" aria-hidden />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="#25D366"
          width={32}
          height={32}
          className="whatsapp-icon"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>

      <style>{`
        .whatsapp-tooltip {
          position: fixed;
          z-index: 999;
          max-width: min(240px, calc(100vw - 32px));
          padding: 12px 18px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 500;
          line-height: 1.45;
          font-family: var(--font-body), system-ui, sans-serif;
          color: rgba(255, 255, 255, 0.92);
          background: rgba(0, 0, 0, 0.82);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(204, 0, 0, 0.45);
          box-shadow:
            0 0 24px rgba(204, 0, 0, 0.25),
            0 8px 32px rgba(0, 0, 0, 0.5);
          animation: whatsapp-fade-in-up 0.3s ease;
          bottom: calc(16px + 60px + 10px + env(safe-area-inset-bottom, 0px));
          right: max(16px, env(safe-area-inset-right, 0px));
        }
        @media (min-width: 768px) {
          .whatsapp-tooltip {
            bottom: 90px;
            right: 24px;
          }
        }
        .whatsapp-tooltip-accent {
          color: #25d366;
          font-weight: 700;
          text-shadow: 0 0 12px rgba(37, 211, 102, 0.45);
        }
        .whatsapp-tooltip-arrow {
          position: absolute;
          bottom: -8px;
          right: 24px;
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 8px solid rgba(0, 0, 0, 0.82);
          filter: drop-shadow(0 0 6px rgba(204, 0, 0, 0.4));
        }
        .whatsapp-float-btn {
          position: fixed;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(145deg, #0a0a0a 0%, #1a0505 100%);
          border: 2px solid #cc0000;
          text-decoration: none;
          transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
          box-shadow:
            0 0 20px rgba(204, 0, 0, 0.35),
            0 4px 24px rgba(0, 0, 0, 0.45);
          animation: whatsapp-bounce-in 0.5s ease;
          bottom: max(16px, env(safe-area-inset-bottom, 0px));
          right: max(16px, env(safe-area-inset-right, 0px));
          overflow: visible;
        }
        @media (min-width: 768px) {
          .whatsapp-float-btn {
            bottom: 24px;
            right: 24px;
          }
        }
        .whatsapp-pulse {
          pointer-events: none;
          position: absolute;
          inset: -2px;
          border-radius: 50%;
          border: 1px solid rgba(204, 0, 0, 0.35);
          background: rgba(204, 0, 0, 0.15);
          animation: whatsapp-pulse 2s infinite;
        }
        .whatsapp-icon {
          position: relative;
          z-index: 1;
        }
        @keyframes whatsapp-fade-in-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes whatsapp-bounce-in {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1);
          }
        }
        @keyframes whatsapp-pulse {
          0% {
            transform: scale(1);
            opacity: 0.55;
          }
          70% {
            transform: scale(1.35);
            opacity: 0;
          }
          100% {
            transform: scale(1.35);
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
}
