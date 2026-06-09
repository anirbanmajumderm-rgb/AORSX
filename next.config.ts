import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.amazonaws.com" },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  serverExternalPackages: ["bcryptjs", "@prisma/client"],

  typescript: {
    tsconfigPath: "tsconfig.json",
  },

  transpilePackages: ["@react-three/fiber", "@react-three/drei", "three"],

  compress: true,

  httpAgentOptions: {
    keepAlive: true,
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
    } else {
      config.resolve.alias = {
        ...config.resolve.alias,
        "@react-three/fiber": require.resolve("@react-three/fiber/dist/react-three-fiber.cjs.js"),
      };
    }

    if (!dev) {
      config.optimization = {
        ...config.optimization,
        sideEffects: true,
        usedExports: true,
        concatenateModules: true,
        minimize: true,
      };
      config.output = {
        ...config.output,
        filename: dev ? undefined : "static/chunks/[name].[contenthash:8].js",
        chunkFilename: dev ? undefined : "static/chunks/[name].[contenthash:8].js",
      };
    }

    return config;
  },

  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion", "recharts"],
  },

  onDemandEntries: {
    maxInactiveAge: 300 * 1000,
    pagesBufferLength: 5,
  },

  poweredByHeader: false,
  reactStrictMode: process.env.NODE_ENV === "development",
  productionBrowserSourceMaps: false,
};

export default nextConfig;
