"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function CustomCursor() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin") ?? false;
  const [desktop, setDesktop] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [clicking, setClicking] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 28, stiffness: 220, mass: 0.45 };
  const trailX = useSpring(mouseX, springConfig);
  const trailY = useSpring(mouseY, springConfig);

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

    const move = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    const over = (e: MouseEvent) => {
      setHovering(!!(e.target as HTMLElement).closest("a, button, [role='button'], input, select, textarea, label"));
    };
    const down = () => setClicking(true);
    const up = () => setClicking(false);

    window.addEventListener("mousemove", move, { passive: true });
    window.addEventListener("mouseover", over, true);
    window.addEventListener("mousedown", down);
    window.addEventListener("mouseup", up);

    return () => {
      document.body.classList.remove("custom-cursor-active");
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", over, true);
      window.removeEventListener("mousedown", down);
      window.removeEventListener("mouseup", up);
    };
  }, [isAdmin, desktop]);

  if (isAdmin || !desktop) return null;

  return (
    <>
      <style>{`
        @media (min-width: 769px) {
          body.custom-cursor-active,
          body.custom-cursor-active * {
            cursor: none !important;
          }
        }
      `}</style>

      <motion.div
        style={{
          position: "fixed",
          left: mouseX,
          top: mouseY,
          x: "-50%",
          y: "-50%",
          pointerEvents: "none",
          zIndex: 99999,
          borderRadius: "50%",
          background: "#CC0000",
        }}
        animate={{
          width: clicking ? 6 : hovering ? 8 : 10,
          height: clicking ? 6 : hovering ? 8 : 10,
          boxShadow: clicking
            ? "0 0 20px #FF0000, 0 0 40px #CC0000"
            : "0 0 8px rgba(204,0,0,0.8)",
        }}
        transition={{ duration: 0.12 }}
      />

      <motion.div
        style={{
          position: "fixed",
          left: trailX,
          top: trailY,
          x: "-50%",
          y: "-50%",
          pointerEvents: "none",
          zIndex: 99998,
          borderRadius: "50%",
          border: hovering ? "2px solid rgba(255,0,0,0.8)" : "2px solid rgba(204,0,0,0.4)",
        }}
        animate={{
          width: hovering ? 50 : clicking ? 20 : 36,
          height: hovering ? 50 : clicking ? 20 : 36,
        }}
        transition={{ duration: 0.2 }}
      />
    </>
  );
}
