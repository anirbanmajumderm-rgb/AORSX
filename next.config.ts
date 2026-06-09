import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },

  serverExternalPackages: ["bcryptjs", "@prisma/client"],

  typescript: {
    tsconfigPath: "tsconfig.json",
  },

  transpilePackages: ["@react-three/fiber", "@react-three/drei", "three"],

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
    } else {
      config.resolve.alias = {
        ...config.resolve.alias,
        "@react-three/fiber": require.resolve("@react-three/fiber/dist/react-three-fiber.cjs.js"),
      };
    }

    return config;
  },

  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion", "recharts", "@react-three/fiber", "@react-three/drei"],
  },

  onDemandEntries: {
    maxInactiveAge: 300 * 1000,
    pagesBufferLength: 5,
  },

  poweredByHeader: false,
  reactStrictMode: process.env.NODE_ENV === "development",
};

export default nextConfig;
