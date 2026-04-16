import path from "node:path";
import type { NextConfig } from "next";

const canvasStub = path.join(process.cwd(), "stubs", "canvas-stub.cjs");

/**
 * Proxy de `/api/*` al backend Nest (mismo origen en el navegador).
 * Prioridad: BACKEND_URL (solo servidor) → NEXT_PUBLIC_API_URL → localhost:3001 (PORT del API).
 */
const backend =
  process.env.BACKEND_URL?.replace(/\/$/, "") ??
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://localhost:3001";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: canvasStub,
    };
    config.module.rules.push({
      test: /\.(glb|gltf)$/,
      type: "asset/resource",
    });
    return config;
  },
  turbopack: {
    resolveAlias: {
      canvas: canvasStub,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "checkout.wompi.co",
        pathname: "/**",
      },
      { protocol: "https", hostname: "**" },
      {
        protocol: "http",
        hostname: "localhost",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.cdninstagram.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "scontent.cdninstagram.com",
        pathname: "/**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backend}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
