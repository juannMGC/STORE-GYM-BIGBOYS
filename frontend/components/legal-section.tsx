import type { ReactNode } from "react";

type Props = {
  numero: string;
  titulo: string;
  children: ReactNode;
};

export function LegalSection({ numero, titulo, children }: Props) {
  return (
    <div style={{ marginBottom: "36px" }}>
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "18px",
          color: "#f7e047",
          letterSpacing: "3px",
          textTransform: "uppercase",
          margin: "0 0 16px",
          display: "flex",
          gap: "12px",
          alignItems: "center",
        }}
      >
        <span style={{ color: "#d91920", fontSize: "14px" }}>{numero}.</span>
        {titulo}
      </h2>
      <div
        style={{
          color: "#a1a1aa",
          fontSize: "14px",
          lineHeight: 1.8,
          borderLeft: "2px solid #1a1a1a",
          paddingLeft: "20px",
        }}
      >
        {children}
      </div>
    </div>
  );
}
