"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useMemo, memo } from "react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GlassCard } from "@/components/ui/GlassCard";
import { useSiteData } from "@/hooks/useSiteData";
import { getIcon } from "@/lib/icon-map";
import { cn } from "@/lib/utils";

const SkillBar = memo(function SkillBar({ name, proficiency, icon: Icon, delay }: { name: string; proficiency: number; icon: React.ComponentType<{ className?: string }>; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <div ref={ref} className="relative group">
      <GlassCard glow hover={false} className="p-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan/15 to-cyan/5 border border-cyan/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <Icon className="w-5 h-5 text-cyan" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-semibold text-main-text block truncate">
              {name}
            </span>
            <span className="text-[10px] text-muted-text">
              {proficiency}% Proficiency
            </span>
          </div>
        </div>

        <div className="relative">
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              initial={{ width: "0%" }}
              animate={isInView ? { width: `${proficiency}%` } : { width: "0%" }}
              transition={{ duration: 1.2, delay, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "h-full rounded-full bg-gradient-to-r from-orange to-cyan relative",
                "shadow-[0_0_10px_rgba(255,107,0,0.3)]"
              )}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </motion.div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
});

SkillBar.displayName = "SkillBar";

const Skills = memo(function Skills() {
  const { data } = useSiteData();
  const skills = data?.skills ?? [];

  const { categories, skillsByCategory } = useMemo(() => {
    const cats = [...new Set(skills.map((s) => s.category))];
    const map = new Map<string, typeof skills>();
    for (const skill of skills) {
      const existing = map.get(skill.category) || [];
      existing.push(skill);
      map.set(skill.category, existing);
    }
    return { categories: cats, skillsByCategory: map };
  }, [skills]);

  if (skills.length === 0) return null;

  return (
    <section id="skills" className="relative py-20 md:py-30 overflow-hidden">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label={data?.settings?.sec_skills_label || "EXPERTISE"}
          title={data?.settings?.sec_skills_title || "Skills & Proficiency"}
          description={data?.settings?.sec_skills_description || "Technologies and tools I work with daily to deliver cutting-edge solutions"}
        />

        {categories.map((category, ci) => {
          const categorySkills = skillsByCategory.get(category) || [];
          return (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: ci * 0.1 }}
              className="mb-12 last:mb-0"
            >
              <h3 className="text-lg font-bold font-heading text-main-text mb-6 flex items-center gap-3">
                <span className="w-8 h-[2px] rounded-full bg-gradient-to-r from-orange to-cyan" />
                <span className="gradient-text-cyan">{category}</span>
                <span className="text-xs text-muted-text font-normal">
                  ({categorySkills.length} skills)
                </span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {categorySkills.map((skill, si) => {
                  const SkillIcon = getIcon(skill.icon);
                  return (
                    <SkillBar
                      key={skill.id}
                      name={skill.name}
                      proficiency={skill.proficiency}
                      icon={SkillIcon}
                      delay={0.3 + (ci * 0.1) + (si * 0.05)}
                    />
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
});

Skills.displayName = "Skills";

export { Skills };
