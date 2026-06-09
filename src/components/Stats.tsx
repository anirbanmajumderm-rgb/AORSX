"use client";

import { useRef, memo } from "react";
import { motion, useInView } from "framer-motion";
import { Briefcase, Users, Timer, Star, Headphones } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StatsCounter } from "@/components/StatsCounter";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/context/LanguageContext";
import { useSiteData } from "@/hooks/useSiteData";
import { cn } from "@/lib/utils";

function statVal(settings: Record<string, string | null> | undefined, key: string, fallback: number): number {
  const v = settings?.[key];
  if (!v) return fallback;
  const parsed = parseInt(v, 10);
  return isNaN(parsed) ? fallback : parsed;
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: "easeOut" as const },
  }),
};

export const Stats = memo(function Stats() {
  const { t } = useLanguage();
  const { data, loading } = useSiteData();
  const settings = data?.settings;
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const metrics = [
    { icon: Briefcase, value: statVal(settings, "stats_projects", 0), suffix: "+", label: "stats.projectsDelivered", color: "from-orange to-orange/50" },
    { icon: Users, value: statVal(settings, "stats_clients", 0), suffix: "+", label: "stats.happyClients", color: "from-cyan to-cyan/50" },
    { icon: Timer, value: statVal(settings, "stats_years", 0), suffix: "+", label: "stats.yearsExperience", color: "from-orange to-orange/50" },
    { icon: Star, value: statVal(settings, "stats_satisfaction", 0), suffix: "%", label: "stats.satisfaction", color: "from-cyan to-cyan/50" },
    { icon: Headphones, value: statVal(settings, "stats_support", 0), suffix: "", label: "stats.support", prefix: "24/", color: "from-orange to-orange/50" },
  ];

  return (
    <section id="stats" className="relative py-20 md:py-30 overflow-hidden">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label={settings?.sec_stats_label || t("stats.label")}
          title={settings?.sec_stats_title || t("stats.title")}
          description={settings?.sec_stats_description || t("stats.description")}
        />

        <div
          ref={sectionRef}
          className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6"
        >
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-[var(--radius-card)] bg-card-bg border border-soft-border p-6 md:p-8">
                <Skeleton className="w-12 h-12 rounded-2xl mb-5" />
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-1.5 w-full mt-4 rounded-full" />
              </div>
            ))
          ) : (
            metrics.map((metric, i) => (
              <motion.div
                key={metric.label}
                custom={i}
                variants={itemVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                className="relative group"
              >
                <div className="absolute -inset-[1px] rounded-[var(--radius-card)] bg-gradient-to-br from-orange/20 via-cyan/20 to-cyan/20 opacity-0 blur-xl transition-opacity duration-700 group-hover:opacity-100" />

                <div
                  className={cn(
                    "relative rounded-[var(--radius-card)] bg-card-bg border border-soft-border backdrop-blur-xl p-6 md:p-8 text-center transition-all duration-500",
                    "group-hover:border-orange/30 group-hover:shadow-[0_24px_64px_rgba(0,0,0,0.45),0_0_30px_rgba(255,107,0,0.08)]"
                  )}
                >
                  <div className="relative inline-flex mb-5">
                    <div
                      className={cn(
                        "absolute inset-0 rounded-2xl blur-lg opacity-60",
                        i % 2 === 0 ? "bg-orange/30" : "bg-cyan/30"
                      )}
                    />
                    <div
                      className={cn(
                        "relative w-12 h-12 rounded-2xl flex items-center justify-center border",
                        i % 2 === 0
                          ? "bg-orange/10 border-orange/20"
                          : "bg-cyan/10 border-cyan/20"
                      )}
                    >
                      <metric.icon
                        className={cn(
                          "w-6 h-6",
                          i % 2 === 0 ? "text-orange" : "text-cyan"
                        )}
                      />
                    </div>
                  </div>

                  <StatsCounter
                    value={metric.value}
                    suffix={metric.suffix}
                    prefix={metric.prefix || ""}
                    label={t(metric.label)}
                  />

                  <div className="h-1.5 rounded-full bg-white/[0.06] mt-4 overflow-hidden">
                    <motion.div
                      initial={{ width: "0%" }}
                      animate={isInView ? { width: "100%" } : { width: "0%" }}
                      transition={{ duration: 1.5, delay: 0.5 + i * 0.15, ease: "easeOut" }}
                      className={cn(
                        "h-full rounded-full bg-gradient-to-r",
                        metric.color
                      )}
                    />
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </section>
  );
});
