"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GlassCard } from "@/components/ui/GlassCard";
import { useSiteData } from "@/hooks/useSiteData";
import { getIcon } from "@/lib/icon-map";

export function WhyChooseMe() {
  const { data } = useSiteData();
  const items = data?.whyChooseMe ?? [];

  if (items.length === 0) return null;

  return (
    <section id="why-choose-me" className="relative py-20 md:py-30 overflow-hidden">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label={data?.settings?.sec_why_label || "WHY CHOOSE US"}
          title={data?.settings?.sec_why_title || "Why Choose Me"}
          description={data?.settings?.sec_why_description || "What sets my work apart from the rest"}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, index) => {
            const Icon = getIcon(item.icon);
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <GlassCard glow hover className="p-6 md:p-8 h-full group">
                  <div className="flex flex-col h-full">
                    <div className="flex items-center gap-4 mb-5">
                      <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-orange/20 via-cyan/20 to-orange/20 border border-orange/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-orange/30 via-cyan/30 to-orange/30 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <Icon className="w-6 h-6 text-white relative z-10" />
                      </div>
                      <h3 className="text-lg font-bold font-heading text-main-text">
                        {item.title}
                      </h3>
                    </div>

                    {item.description && (
                      <p className="text-muted-text text-sm leading-relaxed flex-1">
                        {item.description}
                      </p>
                    )}

                    <div className="mt-5 pt-4 border-t border-soft-border">
                      <span className="inline-flex items-center gap-2 text-xs text-cyan font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {data?.settings?.sec_guarantee_label || "Guaranteed Quality"}
                      </span>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
