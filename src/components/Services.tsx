"use client";

import { useState, memo } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GlassCard } from "@/components/ui/GlassCard";
import { useLanguage } from "@/context/LanguageContext";
import { useSiteData } from "@/hooks/useSiteData";
import { getIcon } from "@/lib/icon-map";
import { cn } from "@/lib/utils";

function ServiceCard({ service, index }: { service: any; index: number }) {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = getIcon(service.icon);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: "easeOut" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="h-full"
    >
      <GlassCard glow hover className="p-8 h-full group">
        <div className="flex flex-col h-full relative">
          <span className="absolute top-0 right-0 text-4xl font-bold font-heading text-white/[0.03] select-none">
            {String(index + 1).padStart(2, "0")}
          </span>

          <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-orange/20 via-cyan/20 to-orange/20 border border-orange/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <div className={cn(
              "absolute -inset-1 rounded-2xl bg-gradient-to-br from-orange/30 via-cyan/30 to-orange/30 blur-md transition-opacity duration-500",
              isHovered ? "opacity-100" : "opacity-0"
            )} />
            <Icon className="w-7 h-7 text-white relative z-10" />
          </div>

          <h3 className="text-xl font-bold font-heading text-main-text mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-orange group-hover:to-cyan transition-all duration-300">
            {service.title}
          </h3>

          <p className="text-muted-text text-sm leading-relaxed flex-1">
            {service.description}
          </p>

          <div className="mt-6 pt-6 border-t border-soft-border flex items-center justify-between">
            <div className="h-1.5 flex-1 rounded-full bg-white/5 overflow-hidden mr-3">
              <motion.div
                initial={{ width: "0%" }}
                whileInView={{ width: "100%" }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, delay: index * 0.1, ease: "easeOut" }}
                className={cn(
                  "h-full rounded-full bg-gradient-to-r from-orange to-cyan transition-all duration-500",
                  isHovered && "shadow-[0_0_10px_rgba(255,107,0,0.3)]"
                )}
              />
            </div>
            <ArrowUpRight className={cn(
              "w-4 h-4 text-muted-text transition-all duration-300",
              isHovered && "text-cyan translate-x-0.5 -translate-y-0.5"
            )} />
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

export const Services = memo(function Services() {
  const { t } = useLanguage();
  const { data } = useSiteData();
  const services = data?.services ?? [];
  const isEnabled = data?.featureFlags?.services_section !== false;

  if (!isEnabled) return null;

  return (
    <section id="services" className="relative py-20 md:py-30">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label={data?.settings?.sec_services_label || t("services.title")}
          title={data?.settings?.sec_services_title || t("services.title")}
          description={data?.settings?.sec_services_subtitle || t("services.subtitle")}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {services.map((service, index) => (
            <ServiceCard key={service.id} service={service} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
});
