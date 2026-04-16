"use client";

import { usePathname } from "next/navigation";
import { useScrollReveal } from "@/hooks/use-parallax";

export function ScrollRevealProvider() {
  const pathname = usePathname();
  useScrollReveal([pathname]);
  return null;
}
