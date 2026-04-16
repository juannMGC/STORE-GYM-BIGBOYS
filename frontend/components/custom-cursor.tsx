"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export function CustomCursor() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin") ?? false;
  const [desktop, setDesktop] = useState(false);

  const [hovering, setHovering] = useState(false);
  const [clicking, setClicking] = useState(false);
  const [burst, setBurst] = useState(false);
  const mouseRef = useRef({ x: 0, y: 0 });
  const trailRef = useRef({ x: 0, y: 0 });
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const burstRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 769px)");
    const apply = () => setDesktop(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (isAdmin || !desktop) return;

    document.body.classList.add("custom-cursor-active");

    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      if (dotRef.current) {
        dotRef.current.style.left = `${e.clientX}px`;
        dotRef.current.style.top = `${e.clientY}px`;
      }
      if (burstRef.current) {
        burstRef.current.style.left = `${e.clientX}px`;
        burstRef.current.style.top = `${e.clientY}px`;
      }
    };

    const onDown = () => {
      setClicking(true);
      setBurst(true);
      window.setTimeout(() => setBurst(false), 420);
    };
    const onUp = () => setClicking(false);

    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isInteractive = target.closest(
        "a, button, [role='button'], input, select, textarea, label",
      );
      setHovering(!!isInteractive);
    };

    let raf = 0;
    const loop = () => {
      trailRef.current.x += (mouseRef.current.x - trailRef.current.x) * 0.12;
      trailRef.current.y += (mouseRef.current.y - trailRef.current.y) * 0.12;
      if (ringRef.current) {
        ringRef.current.style.left = `${trailRef.current.x}px`;
        ringRef.current.style.top = `${trailRef.current.y}px`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    document.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mousedown", onDown);
    document.addEventListener("mouseup", onUp);
    document.addEventListener("mouseover", onOver, true);

    return () => {
      document.body.classList.remove("custom-cursor-active");
      cancelAnimationFrame(raf);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("mouseover", onOver, true);
    };
  }, [isAdmin, desktop]);

  if (isAdmin || !desktop) return null;

  return (
    <>
      <style>{`
        body.custom-cursor-active,
        body.custom-cursor-active * {
          cursor: none !important;
        }
      `}</style>

      <div
        ref={dotRef}
        className="custom-cursor-dot"
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          width: clicking ? "8px" : hovering ? "6px" : "10px",
          height: clicking ? "8px" : hovering ? "6px" : "10px",
          background: "#CC0000",
          borderRadius: "50%",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
          zIndex: 99999,
          transition: "width 0.1s, height 0.1s",
          boxShadow: clicking ? "0 0 20px #FF0000, 0 0 40px #CC0000" : "0 0 10px #CC0000",
        }}
        aria-hidden
      />

      <div
        ref={ringRef}
        className="custom-cursor-ring"
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          width: hovering ? "50px" : clicking ? "20px" : "36px",
          height: hovering ? "50px" : clicking ? "20px" : "36px",
          border: `2px solid ${hovering ? "#FF0000" : "rgba(204,0,0,0.5)"}`,
          borderRadius: "50%",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
          zIndex: 99998,
          transition: "width 0.2s, height 0.2s, border-color 0.2s",
          boxShadow: hovering ? "0 0 15px rgba(255,0,0,0.4)" : "none",
        }}
        aria-hidden
      />

      {burst ? (
        <div
          ref={burstRef}
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            width: "60px",
            height: "60px",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            zIndex: 99997,
            animation: "cursor-burst 0.4s ease-out forwards",
          }}
          aria-hidden
        >
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="cursor-particle-burst"
              style={
                {
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: "4px",
                  height: "4px",
                  marginLeft: "-2px",
                  marginTop: "-2px",
                  background: "#FF0000",
                  borderRadius: "50%",
                  "--burst-angle": `${i * 60}deg`,
                } as CSSProperties
              }
            />
          ))}
        </div>
      ) : null}
    </>
  );
}
