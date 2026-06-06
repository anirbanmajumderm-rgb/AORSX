"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, GitBranch } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface Project {
  title: string;
  slug: string;
  description: string | null;
  content: string | null;
  technologies: string | null;
  clientName: string | null;
  companyName: string | null;
  projectUrl: string | null;
  githubUrl: string | null;
  category: string | null;
  image: string | null;
}

interface Props {
  project: Project;
}

export function ProjectDetailClient({ project }: Props) {
  const techStack = project.technologies
    ? project.technologies.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  return (
    <div className="pt-28 pb-20 md:pt-36 md:pb-30">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-sm text-secondary-text hover:text-main-text transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Hero Image */}
          <div className="relative w-full aspect-video rounded-[var(--radius-card)] overflow-hidden mb-10">
            {project.image ? (
              <Image
                src={project.image}
                alt={project.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
                className="object-cover"
                priority
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-cyan/10 via-orange/10 to-cyan/10" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-primary-bg via-primary-bg/10 to-transparent" />
          </div>

          {/* Project Info */}
          <div className="grid lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2">
              {project.category && (
                <span className="inline-block text-xs font-semibold tracking-[0.2em] uppercase text-cyan mb-3">
                  {project.category}
                </span>
              )}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-heading text-main-text mb-6 leading-tight">
                {project.title}
              </h1>
              <p className="text-lg text-secondary-text leading-relaxed mb-8">
                {project.content || project.description}
              </p>

              {/* Tech Stack */}
              {techStack.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-muted-text uppercase tracking-wider mb-4">
                    Technologies Used
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {techStack.map((tech) => (
                      <span
                        key={tech}
                        className="px-4 py-2 text-sm font-medium rounded-full bg-white/5 border border-soft-border text-secondary-text"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            {(project.projectUrl || project.githubUrl) && (
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-card-bg border border-soft-border space-y-4">
                  <h3 className="text-sm font-semibold text-muted-text uppercase tracking-wider">
                    Project Links
                  </h3>
                  <div className="space-y-3">
                    {project.projectUrl && (
                      <a
                        href={project.projectUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 px-7 py-3 rounded-[var(--radius-button)] bg-[#FF6B00] text-white font-medium hover:shadow-[0_0_30px_rgba(255,107,0,0.3)] transition-all duration-300"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Live Preview
                      </a>
                    )}
                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 px-7 py-3 rounded-[var(--radius-button)] glass text-main-text font-medium hover:bg-white/10 transition-all duration-300"
                      >
                        <GitBranch className="w-4 h-4" />
                        View Source
                      </a>
                    )}
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-card-bg border border-soft-border space-y-4">
                  <h3 className="text-sm font-semibold text-muted-text uppercase tracking-wider">
                    Details
                  </h3>
                  <div className="space-y-3">
                    {project.category && (
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full bg-cyan/20 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-cyan" />
                        </div>
                        <span className="text-sm text-secondary-text">{project.category}</span>
                      </div>
                    )}
                    {project.clientName && (
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-secondary-text">Client: {project.clientName}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
