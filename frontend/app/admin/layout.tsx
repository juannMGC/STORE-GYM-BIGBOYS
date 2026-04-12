import type { Metadata } from "next";
import { AdminShell } from "@/components/admin-shell";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Panel Admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#050505",
      }}
    >
      <AdminShell>{children}</AdminShell>
    </div>
  );
}
