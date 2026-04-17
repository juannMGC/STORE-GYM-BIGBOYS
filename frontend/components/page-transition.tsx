"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{
          duration: 0.4,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}
      >
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          style={{
            position: "fixed",
            top: "64px",
            left: 0,
            right: 0,
            height: "2px",
            background: "linear-gradient(90deg, #8B0000, #FF0000)",
            transformOrigin: "left",
            zIndex: 9999,
            pointerEvents: "none",
            boxShadow: "0 0 10px #FF0000",
          }}
          aria-hidden
        />
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
