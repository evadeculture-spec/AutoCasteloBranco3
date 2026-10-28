import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  agentRules: false,
  experimental: {
    // Fotos são redimensionadas no browser; 5 MB fica abaixo do limite de 6 MB das funções Netlify
    serverActions: { bodySizeLimit: "5mb" },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [384, 640, 828, 1080, 1280, 1600, 1920],
    localPatterns: [
      { pathname: "/seed/**", search: "" },
      { pathname: "/api/media/**", search: "" },
    ],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      { source: "/seed/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
    ];
  },
};

export default nextConfig;
