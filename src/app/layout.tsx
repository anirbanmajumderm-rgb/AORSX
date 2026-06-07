import type { Metadata } from "next";
import { Poppins, JetBrains_Mono, Inter, Space_Grotesk } from "next/font/google";
import dynamic from "next/dynamic";
import "./globals.css";

const AnalyticsTracker = dynamic(() => import("@/components/AnalyticsTracker").then((m) => m.AnalyticsTracker));

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-jetbrains",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space",
  display: "swap",
});

let cachedMetadata: Metadata | null = null;

export async function generateMetadata(): Promise<Metadata> {
  if (cachedMetadata) return cachedMetadata;
  try {
    const { prisma } = await import("@/lib/prisma");
    const [settings, company] = await Promise.all([
      prisma.setting.findMany({
        where: { key: { in: ["meta_title", "meta_description", "meta_keywords", "site_name"] } },
      }),
      prisma.company.findFirst(),
    ]);
    const meta: Record<string, string> = {};
    for (const s of settings) meta[s.key] = s.value || "";
    const siteName = meta.site_name || company?.name || "A-ORSX";
    const description = meta.meta_description || "A-ORSX — AI SaaS Agency.";
    const title = meta.meta_title || siteName;
    cachedMetadata = {
      title,
      description,
      openGraph: {
        title,
        description,
        siteName,
        type: "website",
        locale: "en_US",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
      robots: {
        index: true,
        follow: true,
      },
    };
    return cachedMetadata;
  } catch {
    return {
      title: "A-ORSX",
      description: "A-ORSX — AI SaaS Agency.",
    };
  }
}

const fontCombos: Record<string, { body: string; heading: string; mono: string }> = {
  elegant: { body: "var(--font-poppins)", heading: "var(--font-poppins)", mono: "var(--font-jetbrains)" },
  modern: { body: "var(--font-inter)", heading: "var(--font-space)", mono: "var(--font-jetbrains)" },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${jetbrainsMono.variable} ${inter.variable} ${spaceGrotesk.variable} scroll-smooth`}
      style={{
        "--font-body": "var(--font-inter)",
        "--font-heading-custom": "var(--font-poppins)",
        "--font-mono-custom": "var(--font-jetbrains)",
        "--font-brand": "var(--font-space)",
        "--font-brand-alt": "var(--font-inter)",
      } as React.CSSProperties}
    >
      <body className="relative min-h-screen bg-primary-bg text-main-text antialiased overflow-x-hidden">
        <AnalyticsTracker />
        {children}
      </body>
    </html>
  );
}
