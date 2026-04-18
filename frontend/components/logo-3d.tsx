"use client";

import dynamic from "next/dynamic";

const Logo3DScene = dynamic(
  () => import("./logo-3d-scene").then((mod) => ({ default: mod.Logo3DScene })),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          width: "100%",
          height: "min(100svh, 100dvh)",
          background: "#000000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            border: "3px solid rgba(204,0,0,0.3)",
            borderTopColor: "#CC0000",
            animation: "spin 1s linear infinite",
          }}
        />
        <span
          style={{
            color: "#CC0000",
            fontFamily: "monospace",
            fontSize: "12px",
            letterSpacing: "4px",
          }}
        >
          CARGANDO...
        </span>
      </div>
    ),
  },
);

export { Logo3DScene };
export { DEFAULT_LOGO_MODEL_URL, SHOP_LOGO_MODEL_URL, TRAININGS_LOGO_MODEL_URL } from "./logo-3d-model-urls";
