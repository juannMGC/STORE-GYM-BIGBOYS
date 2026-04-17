"use client";

import { useEffect, useState } from "react";

/** `< 768px` */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

/** sm: &lt;768, md: 768–1023, lg: ≥1024 */
export function useBreakpoint() {
  const [bp, setBp] = useState<"sm" | "md" | "lg">("lg");
  useEffect(() => {
    const q = () => {
      const w = window.innerWidth;
      if (w < 768) setBp("sm");
      else if (w < 1024) setBp("md");
      else setBp("lg");
    };
    q();
    window.addEventListener("resize", q);
    return () => window.removeEventListener("resize", q);
  }, []);
  return bp;
}
