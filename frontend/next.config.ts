import path from "node:path";
import type { NextConfig } from "next";

const canvasStub = path.join(process.cwd(), "stubs", "canvas-stub.cjs");

const backend =
  process.env.BACKEND_URL?.replace(/\/$/, "") ??
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://localhost:3001";

const nextConfig: NextConfig = {
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
      { protocol: "https", hostname: "checkout.wompi.co", pathname: "/**" },
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "localhost", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "*.cdninstagram.com", pathname: "/**" },
      { protocol: "https", hostname: "scontent.cdninstagram.com", pathname: "/**" },
      { protocol: "https", hostname: "github.com", pathname: "/**" },
      { protocol: "https", hostname: "objects.githubusercontent.com", pathname: "/**" },
      { protocol: "https", hostname: "*.supabase.co", pathname: "/**" },
    ],
  },
  async headers() {
    return [
      {
        source: "/brand/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/models/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        ],
      },
    ];
  },
  webpack: (config, { dev, isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: canvasStub,
    };
    config.module.rules.push({
      test: /\.(glb|gltf)$/,
      type: "asset/resource",
    });
    if (!dev && !isServer) {
      config.optimization = config.optimization ?? {};
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        chunks: "all",
        cacheGroups: {
          ...((config.optimization.splitChunks as { cacheGroups?: object })?.cacheGroups ?? {}),
          three: {
            test: /[\\/]node_modules[\\/](three|@react-three)[\\/]/,
            name: "three-vendor",
            priority: 20,
            reuseExistingChunk: true,
          },
        },
      };
    }
    return config;
  },
  turbopack: {
    resolveAlias: {
      canvas: canvasStub,
    },
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
