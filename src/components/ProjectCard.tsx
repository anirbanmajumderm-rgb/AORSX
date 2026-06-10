"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, GitBranch } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  title: string;
  description: string | null;
  image: string | null;
  technologies: string | null;
  projectUrl: string | null;
  githubUrl: string | null;
  slug: string;
  index: number;
}

export function ProjectCard({
  title,
  description,
  image,
  technologies,
  projectUrl,
  githubUrl,
  slug,
  index,
}: ProjectCardProps) {
  const [imageError, setImageError] = useState(false);
  const techStack = technologies
    ? technologies.split(",").map((t: string) => t.trim()).filter(Boolean)
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
    >
      <Link href={`/projects/${slug}`}>
        <GlassCard glow hover className="overflow-hidden group cursor-pointer">
          <div className="relative h-48 sm:h-56 md:h-64 overflow-hidden">
            {image && !imageError ? (
              <Image
                src={image}
                alt={title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                onError={() => setImageError(true)}
                loading="lazy"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-cyan/10 via-orange/10 to-cyan/10" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-primary-bg via-primary-bg/20 to-transparent opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
              {projectUrl && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(projectUrl, "_blank", "noopener,noreferrer");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      window.open(projectUrl, "_blank", "noopener,noreferrer");
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-button)] bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-medium hover:bg-white/20 transition-all cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Live Preview
                </span>
              )}
              {githubUrl && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(githubUrl, "_blank", "noopener,noreferrer");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      window.open(githubUrl, "_blank", "noopener,noreferrer");
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-button)] bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-medium hover:bg-white/20 transition-all cursor-pointer"
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  Source
                </span>
              )}
            </div>
          </div>

          <div className="p-6 md:p-8">
            <h3 className="text-xl md:text-2xl font-bold font-heading text-main-text mb-3 group-hover:text-cyan transition-colors">
              {title}
            </h3>
            <p className="text-secondary-text text-sm leading-relaxed mb-5 line-clamp-2">
              {description}
            </p>
            <div className="flex flex-wrap gap-2">
              {techStack.map((tech: string) => (
                <span
                  key={tech}
                  className={cn(
                    "px-3 py-1 text-xs font-medium rounded-full",
                    "bg-white/5 border border-soft-border text-secondary-text",
                    "transition-all duration-300 hover:border-cyan/30 hover:text-cyan"
                  )}
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </GlassCard>
      </Link>
    </motion.div>
  );
}
