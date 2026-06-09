import { Hero } from "@/components/Hero";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import { SectionDivider } from "@/components/CinematicSystem";

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
      <LogoShowcase />
      <SectionDivider />
      <Suspense fallback={<SectionLoader />}>
        <About />
      </Suspense>
      <SectionDivider />
      <Suspense fallback={<SectionLoader />}>
        <Founders />
      </Suspense>
      <SectionDivider />
      <Suspense fallback={<SectionLoader />}>
        <Stats />
      </Suspense>
      <SectionDivider />
      <Suspense fallback={<SectionLoader />}>
        <Services />
      </Suspense>
      <SectionDivider />
      <Suspense fallback={<SectionLoader />}>
        <Skills />
      </Suspense>
      <SectionDivider />
      <Suspense fallback={<SectionLoader />}>
        <Projects />
      </Suspense>
      <SectionDivider />
      <Suspense fallback={<SectionLoader />}>
        <WhyChooseMe />
      </Suspense>
      <SectionDivider />
      <Suspense fallback={<SectionLoader />}>
        <Reviews />
      </Suspense>
      <SectionDivider />
      <Suspense fallback={<SectionLoader />}>
        <FAQ />
      </Suspense>
      <SectionDivider />
      <Suspense fallback={<SectionLoader />}>
        <Contact />
      </Suspense>
    </>
  );
}
