import { AdminShell } from "@/components/admin-shell";
import type { ReactNode } from "react";

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
