import type { Metadata } from "next";
import { Poppins, Playfair_Display, JetBrains_Mono, Inter, Sora, Space_Grotesk, Outfit, Orbitron } from "next/font/google";
import dynamic from "next/dynamic";
import "./globals.css";

const AnalyticsTracker = dynamic(() => import("@/components/AnalyticsTracker").then((m) => m.AnalyticsTracker));

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-playfair",
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

const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-sora",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-outfit-brand",
  display: "swap",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-orbitron",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  try {
    const { prisma } = await import("@/lib/prisma");
    const settings = await prisma.setting.findMany({
      where: { key: { in: ["meta_title", "meta_description", "meta_keywords", "site_name"] } },
    });
    const meta: Record<string, string> = {};
    for (const s of settings) meta[s.key] = s.value || "";
    const company = await prisma.company.findFirst();
    const siteName = meta.site_name || company?.name || "A-ORSX";
    const description = meta.meta_description || "A-ORSX — AI SaaS Agency.";
    const title = meta.meta_title || siteName;
    return {
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
  } catch {
    return {
      title: "A-ORSX",
      description: "A-ORSX — AI SaaS Agency.",
    };
  }
}

const fontCombos: Record<string, { body: string; heading: string; mono: string }> = {
  elegant: { body: "var(--font-poppins)", heading: "var(--font-playfair)", mono: "var(--font-jetbrains)" },
  modern: { body: "var(--font-inter)", heading: "var(--font-sora)", mono: "var(--font-space)" },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let fontCombo = "elegant";
  try {
    const { prisma } = await import("@/lib/prisma");
    const setting = await prisma.setting.findUnique({ where: { key: "font_combination" } });
    if (setting?.value && fontCombos[setting.value]) fontCombo = setting.value;
  } catch {}

  const combo = fontCombos[fontCombo];

  return (
    <html
      lang="en"
      className={`${poppins.variable} ${playfair.variable} ${jetbrainsMono.variable} ${inter.variable} ${sora.variable} ${spaceGrotesk.variable} ${outfit.variable} ${orbitron.variable} scroll-smooth`}
      style={{
        "--font-body": combo.body,
        "--font-heading-custom": combo.heading,
        "--font-mono-custom": combo.mono,
        "--font-brand": "var(--font-space)",
        "--font-brand-alt": "var(--font-outfit-brand)",
      } as React.CSSProperties}
    >
      <body className="relative min-h-screen bg-primary-bg text-main-text antialiased overflow-x-hidden">
        <AnalyticsTracker />
        {children}
      </body>
    </html>
  );
}
