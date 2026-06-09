"use client";

import dynamic from "next/dynamic";

const BackgroundEffects = dynamic(
  () => import("@/components/BackgroundEffects").then((m) => ({ default: m.BackgroundEffects })),
  { ssr: false, loading: () => null }
);

const AIAssistant = dynamic(
  () => import("@/components/AIAssistant").then((m) => ({ default: m.AIAssistant })),
  { ssr: false, loading: () => null }
);

const MaintenanceBanner = dynamic(
  () => import("@/components/MaintenanceBanner").then((m) => ({ default: m.MaintenanceBanner })),
  { ssr: false, loading: () => null }
);

const AnalyticsTracker = dynamic(
  () => import("@/components/AnalyticsTracker").then((m) => ({ default: m.AnalyticsTracker })),
  { ssr: false, loading: () => null }
);

const CinematicSystem = dynamic(
  () => import("@/components/CinematicSystem").then((m) => ({ default: m.CinematicSystem })),
  { ssr: false }
);

const CinematicIntro = dynamic(
  () => import("@/components/CinematicIntro").then((m) => ({ default: m.CinematicIntro })),
  { ssr: false }
);

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <CinematicIntro>
      <MaintenanceBanner />
      <AnalyticsTracker />
      <BackgroundEffects />
      <CinematicSystem>
        {children}
      </CinematicSystem>
      <AIAssistant />
    </CinematicIntro>
  );
}
