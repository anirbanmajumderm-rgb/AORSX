"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ExternalLink, ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { useSiteData } from "@/hooks/useSiteData";
import { memo } from "react";

const gradients = [
  "from-cyan/20 via-orange/10 to-cyan/20",
  "from-orange/20 via-cyan/10 to-orange/20",
  "from-cyan/20 via-purple/10 to-orange/20",
  "from-orange/20 via-cyan/10 to-cyan/20",
  "from-cyan/20 via-orange/10 to-cyan/20",
  "from-orange/20 via-cyan/10 to-orange/20",
];

export const Projects = memo(function Projects() {
  const { t } = useLanguage();
  const { data } = useSiteData();
  const projects = data?.projects ?? [];
  const isEnabled = data?.featureFlags?.projects_section !== false;
  if (!isEnabled) return null;
  const techStack = (p: typeof projects[number]) =>
    p.technologies ? p.technologies.split(",").map((s: string) => s.trim()) : [];
  return (
    <section id="projects" className="relative py-20 md:py-30">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label={data?.settings?.sec_projects_label || t("projects.title")}
          title={data?.settings?.sec_projects_title || t("projects.title")}
          description={data?.settings?.sec_projects_subtitle || t("projects.subtitle")}
        />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {projects.filter((p) => p.featured).slice(0, 6).map((project, index) => (
            <motion.div
              key={project.slug}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
            >
              <GlassCard glow hover className="overflow-hidden group">
                <div className="relative h-48 sm:h-56 md:h-64 overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradients[index % gradients.length]} transition-all duration-700 group-hover:scale-110`} />
                  <div className="absolute inset-0 bg-gradient-to-br from-orange/20 via-cyan/10 to-orange/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-bg via-primary-bg/20 to-transparent" />

                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                    {project.projectUrl && (
                      <a
                        href={project.projectUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-button)] bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-medium hover:bg-white/20 transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Live Preview
                      </a>
                    )}
                  </div>
                </div>

                <div className="p-6 md:p-8">
                  <h3 className="text-xl md:text-2xl font-bold font-heading text-main-text mb-3 group-hover:text-cyan transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-muted-text text-sm leading-relaxed mb-5 line-clamp-2">
                    {project.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {techStack(project).map((tech: string) => (
                      <span
                        key={tech}
                        className="px-3 py-1 text-xs font-medium rounded-full bg-white/5 border border-soft-border text-muted-text transition-all duration-300 hover:border-cyan/30 hover:text-cyan"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex justify-center mt-12"
        >
          <Link href="/projects">
            <Button variant="secondary" size="default" className="flex items-center gap-2">
              {t("projects.viewAll")}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
});
