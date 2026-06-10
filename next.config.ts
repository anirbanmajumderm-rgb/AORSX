import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.amazonaws.com" },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [320, 420, 640, 768, 1024, 1280, 1536, 1920],
    imageSizes: [16, 24, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000,
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
        splitChunks: {
          chunks: "all",
          maxInitialRequests: 25,
          minSize: 20000,
          cacheGroups: {
            default: false,
            vendors: false,
            framework: {
              name: "framework",
              chunks: "all",
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
              priority: 40,
              enforce: true,
            },
            lib: {
              test: /[\\/]node_modules[\\/]/,
              name(module: { context: string }) {
                const match = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/);
                if (!match) return "lib-other";
                const packageName = match[1];
                if (["framer-motion", "lucide-react", "next-auth", "recharts"].includes(packageName)) {
                  return `lib-${packageName.replace("@", "").replace("/", "-")}`;
                }
                return "lib-other";
              },
              priority: 20,
              minSize: 30000,
              reuseExistingChunk: true,
            },
          },
        },
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
    optimizePackageImports: ["lucide-react", "framer-motion", "recharts", "three"],
  },

  onDemandEntries: {
    maxInactiveAge: 600 * 1000,
    pagesBufferLength: 3,
  },

  poweredByHeader: false,
  reactStrictMode: false,
  productionBrowserSourceMaps: false,
};

export default nextConfig;
