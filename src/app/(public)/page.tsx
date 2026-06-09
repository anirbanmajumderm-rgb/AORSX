import { Hero } from "@/components/Hero";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import { CineSection, SectionDivider } from "@/components/CinematicSystem";

const LogoShowcase = dynamic(() => import("@/components/LogoShowcase").then((m) => ({ default: m.LogoShowcase })));
const About = dynamic(() => import("@/components/About").then((m) => ({ default: m.About })));
const Founders = dynamic(() => import("@/components/Founders").then((m) => ({ default: m.Founders })));
const Stats = dynamic(() => import("@/components/Stats").then((m) => ({ default: m.Stats })));
const Services = dynamic(() => import("@/components/Services").then((m) => ({ default: m.Services })));
const Skills = dynamic(() => import("@/components/Skills").then((m) => ({ default: m.Skills })));
const Projects = dynamic(() => import("@/components/Projects").then((m) => ({ default: m.Projects })));
const WhyChooseMe = dynamic(() => import("@/components/WhyChooseMe").then((m) => ({ default: m.WhyChooseMe })));
const Reviews = dynamic(() => import("@/components/Reviews").then((m) => ({ default: m.Reviews })));
const FAQ = dynamic(() => import("@/components/FAQ").then((m) => ({ default: m.FAQ })));
const Contact = dynamic(() => import("@/components/Contact").then((m) => ({ default: m.Contact })));

function SectionLoader() {
  return <div className="h-64 w-full rounded-2xl bg-white/[0.02] animate-pulse" />;
}

export const revalidate = 86400;

export default function Home() {
  return (
    <>
      <Hero />
      <CineSection variant="slide-up">
        <LogoShowcase />
      </CineSection>
      <SectionDivider />
      <Suspense fallback={<SectionLoader />}>
        <CineSection variant="slide-up" delay={0.1}>
          <About />
        </CineSection>
      </Suspense>
      <SectionDivider />
      <Suspense fallback={<SectionLoader />}>
        <CineSection variant="slide-up" delay={0.1}>
          <Founders />
        </CineSection>
      </Suspense>
      <SectionDivider />
      <Suspense fallback={<SectionLoader />}>
        <CineSection variant="zoom-in" delay={0.1}>
          <Stats />
        </CineSection>
      </Suspense>
      <SectionDivider />
      <Suspense fallback={<SectionLoader />}>
        <CineSection variant="slide-up" delay={0.1}>
          <Services />
        </CineSection>
      </Suspense>
      <SectionDivider />
      <Suspense fallback={<SectionLoader />}>
        <CineSection variant="slide-left" delay={0.1}>
          <Skills />
        </CineSection>
      </Suspense>
      <SectionDivider />
      <Suspense fallback={<SectionLoader />}>
        <CineSection variant="slide-up" delay={0.1}>
          <Projects />
        </CineSection>
      </Suspense>
      <SectionDivider />
      <Suspense fallback={<SectionLoader />}>
        <CineSection variant="slide-right" delay={0.1}>
          <WhyChooseMe />
        </CineSection>
      </Suspense>
      <SectionDivider />
      <Suspense fallback={<SectionLoader />}>
        <CineSection variant="slide-up" delay={0.1}>
          <Reviews />
        </CineSection>
      </Suspense>
      <SectionDivider />
      <Suspense fallback={<SectionLoader />}>
        <CineSection variant="fade" delay={0.1}>
          <FAQ />
        </CineSection>
      </Suspense>
      <SectionDivider />
      <Suspense fallback={<SectionLoader />}>
        <CineSection variant="slide-up" delay={0.1}>
          <Contact />
        </CineSection>
      </Suspense>
    </>
  );
}
