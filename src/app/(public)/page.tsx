import { Hero } from "@/components/Hero";
import { LogoShowcase } from "@/components/LogoShowcase";
import { About } from "@/components/About";
import { Founders } from "@/components/Founders";
import { Stats } from "@/components/Stats";
import { Services } from "@/components/Services";
import { Skills } from "@/components/Skills";
import { Projects } from "@/components/Projects";
import { WhyChooseMe } from "@/components/WhyChooseMe";
import { Reviews } from "@/components/Reviews";
import { FAQ } from "@/components/FAQ";
import { Contact } from "@/components/Contact";
import { CineSection, SectionDivider } from "@/components/CinematicSystem";

export default function Home() {
  return (
    <>
      <Hero />
      <CineSection variant="slide-up">
        <LogoShowcase />
      </CineSection>
      <SectionDivider />
      <CineSection variant="slide-up" delay={0.1}>
        <About />
      </CineSection>
      <SectionDivider />
      <CineSection variant="slide-up" delay={0.1}>
        <Founders />
      </CineSection>
      <SectionDivider />
      <CineSection variant="zoom-in" delay={0.1}>
        <Stats />
      </CineSection>
      <SectionDivider />
      <CineSection variant="slide-up" delay={0.1}>
        <Services />
      </CineSection>
      <SectionDivider />
      <CineSection variant="slide-left" delay={0.1}>
        <Skills />
      </CineSection>
      <SectionDivider />
      <CineSection variant="slide-up" delay={0.1}>
        <Projects />
      </CineSection>
      <SectionDivider />
      <CineSection variant="slide-right" delay={0.1}>
        <WhyChooseMe />
      </CineSection>
      <SectionDivider />
      <CineSection variant="slide-up" delay={0.1}>
        <Reviews />
      </CineSection>
      <SectionDivider />
      <CineSection variant="fade" delay={0.1}>
        <FAQ />
      </CineSection>
      <SectionDivider />
      <CineSection variant="slide-up" delay={0.1}>
        <Contact />
      </CineSection>
    </>
  );
}
