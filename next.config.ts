import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },

  serverExternalPackages: ["bcryptjs", "@prisma/client"],

  typescript: {
    tsconfigPath: "tsconfig.json",
  },

  turbopack: {},

  webpack: (config, { dev, isServer }) => {
    if (dev) {
      config.parallelism = 2;
      config.watchOptions = {
        aggregateTimeout: 600,
        poll: false,
        ignored: ["**/node_modules/**", "**/.next/**", "**/public/**", "**/prisma/**"],
      };
    }

    if (isServer) {
      config.externals = [...(config.externals || []), "bcryptjs"];
    }

    return config;
  },

  experimental: {
    serverMinification: true,
  },

  outputFileTracingIncludes: {
    "/api/**": ["./node_modules/**/*"],
  },

  onDemandEntries: {
    maxInactiveAge: 300 * 1000,
    pagesBufferLength: 5,
  },

  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
