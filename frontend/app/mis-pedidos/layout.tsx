import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Mis pedidos",
  robots: { index: false, follow: false },
};

export default function MisPedidosLayout({ children }: { children: ReactNode }) {
  return children;
}
