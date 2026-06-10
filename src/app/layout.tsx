import type { Metadata, Viewport } from "next";
import { Poppins, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "sans-serif"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
  display: "optional",
  preload: false,
  fallback: ["monospace"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

let cachedMetadata: { data: Metadata; ts: number } | null = null;
const METADATA_CACHE_TTL = 60_000;

export async function generateMetadata(): Promise<Metadata> {
  if (cachedMetadata && Date.now() - cachedMetadata.ts < METADATA_CACHE_TTL) return cachedMetadata.data;
  try {
    const { prisma } = await import("@/lib/prisma");
    const [settings, company] = await Promise.all([
      prisma.setting.findMany({
        where: { key: { in: ["meta_title", "meta_description", "meta_keywords", "site_name"] } },
      }),
      prisma.company.findFirst({ select: { name: true, favicon: true, logo: true } }),
    ]);
    const meta: Record<string, string> = {};
    for (const s of settings) meta[s.key] = s.value || "";
    const siteName = meta.site_name || company?.name || "A-ORSX";
    const description = meta.meta_description || "A-ORSX — AI SaaS Agency.";
    const title = meta.meta_title || siteName;
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXTAUTH_URL || "http://localhost:3000";

    const data: Metadata = {
      metadataBase: new URL(baseUrl),
      title,
      description,
      icons: {
        icon: company?.favicon || "/favicon.svg",
        shortcut: "/favicon.svg",
      },
      openGraph: {
        title,
        description,
        siteName,
        type: "website",
        locale: "en_US",
        images: company?.logo ? [{ url: company.logo }] : [],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: company?.logo ? [company.logo] : [],
      },
      robots: {
        index: true,
        follow: true,
      },
    };
    cachedMetadata = { data, ts: Date.now() };
    return data;
  } catch {
    return {
      title: "A-ORSX",
      description: "A-ORSX — AI SaaS Agency.",
    };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${jetbrainsMono.variable} scroll-smooth`}
      style={{
        overflowX: "hidden",
        width: "100%",
        maxWidth: "100%",
        "--font-body": "var(--font-poppins)",
        "--font-heading-custom": "var(--font-poppins)",
        "--font-mono-custom": "var(--font-jetbrains)",
        "--font-brand": "var(--font-poppins)",
        "--font-brand-alt": "var(--font-poppins)",
      } as React.CSSProperties}
      suppressHydrationWarning
    >
      <body className="relative min-h-screen w-full max-w-full bg-primary-bg text-main-text antialiased overflow-x-hidden">
        <AnalyticsTracker />
        {children}
      </body>
    </html>
  );
}
