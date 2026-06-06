import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ─── Stable Webpack config for Next.js 16 on Windows ───

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },

  // Required stub — Next.js 16 errors if webpack config exists without turbopack key.
  // The actual bundler is selected via CLI (--webpack).
  // See: node_modules/next/dist/lib/turbopack-warning.js:157-172
  turbopack: {},

  serverExternalPackages: ["bcryptjs", "@prisma/client"],

  typescript: {
    tsconfigPath: "tsconfig.json",
  },

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

  onDemandEntries: {
    maxInactiveAge: 300 * 1000,
    pagesBufferLength: 5,
  },

  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
