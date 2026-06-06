"use client";

import { motion } from "framer-motion";
import { Building2, Target, Eye, Heart, Shield, FileText, CheckCircle2, Scale, BookOpen } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GlassCard } from "@/components/ui/GlassCard";
import { useLanguage } from "@/context/LanguageContext";
import { useSiteData } from "@/hooks/useSiteData";
import { cn } from "@/lib/utils";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" as const },
  },
};

export function About() {
  const { t } = useLanguage();
  const { data } = useSiteData();
  const company = data?.company;
  const settings = data?.settings;

  const values = settings?.company_values
    ? settings.company_values.split(",").map((s: string) => s.trim())
    : [];

  const whyChoose = settings?.why_choose
    ? settings.why_choose.split(",").map((s: string) => s.trim())
    : [];

  const aboutTitle = settings?.about_us_headline || t("about.title");
  const aboutText = settings?.about_us_body || company?.aboutText || company?.description || t("about.subtitle");
  const mission = company?.mission || t("about.mission");
  const vision = company?.vision || t("about.vision");

  const cardMission = settings?.card_mission_title || "Our Mission";
  const cardVision = settings?.card_vision_title || "Our Vision";
  const cardValues = settings?.card_values_title || "Company Values";
  const cardWhyTitle = settings?.card_why_title || "Why Choose Us";
  const cardPolicy = settings?.card_policy_title || "Our Policy";
  const cardRules = settings?.card_rules_title || "Rules & Regulations";
  const cardCommitment = settings?.card_commitment_title || "Our Commitment";

  const cards = [
    {
      icon: Building2,
      title: company?.name || "Our Company",
      description: aboutText,
      accent: true,
      span: true,
    },
    {
      icon: Target,
      title: cardMission,
      description: mission,
    },
    {
      icon: Eye,
      title: cardVision,
      description: vision,
    },
    {
      icon: Heart,
      title: cardValues,
      isValues: true,
    },
    {
      icon: Shield,
      title: cardWhyTitle,
      isWhyChoose: true,
    },
    {
      icon: FileText,
      title: cardPolicy,
      description: settings?.company_policy || "",
    },
    {
      icon: Scale,
      title: cardRules,
      description: settings?.company_rules || "",
      span: true,
    },
    {
      icon: BookOpen,
      title: cardCommitment,
      description: settings?.company_commitment || "",
    },
  ];
  return (
    <section id="about" className="relative py-20 md:py-30 overflow-hidden">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title={aboutTitle}
          description={settings?.sec_about_subtitle || t("about.subtitle")}
        />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-5"
        >
          {cards.map((card) => (
            <motion.div
              key={card.title}
              variants={itemVariants}
              className={cn(card.span && "md:col-span-2")}
            >
              <GlassCard glow hover className="p-6 md:p-8 h-full">
                <div className="flex flex-col h-full">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-soft-border flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                    <card.icon className="w-6 h-6 text-cyan" />
                  </div>

                  <h3 className="text-xl font-bold font-heading text-main-text mb-3">
                    {card.title}
                  </h3>

                  {card.accent && (
                    <p className="text-secondary-text text-sm leading-relaxed">
                      {card.description}
                    </p>
                  )}

                  {card.description && !card.accent && !card.isValues && !card.isWhyChoose && (
                    <p className="text-secondary-text text-sm leading-relaxed flex-1">
                      {card.description}
                    </p>
                  )}

                  {card.isValues && (
                    <div className="flex flex-wrap gap-2.5 mt-1 flex-1 content-start">
                      {values.map((v) => (
                        <span
                          key={v}
                          className="px-3.5 py-1.5 text-xs font-medium rounded-full bg-white/[0.04] border border-cyan/20 text-cyan/90 shadow-[0_0_10px_rgba(0,229,255,0.08)] hover:border-cyan/40 hover:shadow-[0_0_20px_rgba(0,229,255,0.15)] transition-all duration-300"
                        >
                          {v}
                        </span>
                      ))}
                    </div>
                  )}

                  {card.isWhyChoose && (
                    <ul className="space-y-2.5 mt-1 flex-1">
                      {whyChoose.map((item) => (
                        <li
                          key={item}
                          className="flex items-center gap-2.5 text-sm text-secondary-text"
                        >
                          <CheckCircle2 className="w-4 h-4 text-orange shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
