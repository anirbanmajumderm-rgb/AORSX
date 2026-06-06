"use client";

import { motion } from "framer-motion";
import { Mail, Phone, Globe, AtSign, GitBranch } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useLanguage } from "@/context/LanguageContext";
import { useSiteData } from "@/hooks/useSiteData";
import { cn } from "@/lib/utils";

const imgCache = (url: string) => `${url}?t=${Date.now()}`;

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function PersonCard({ person, index }: { person: any; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.15 }}
      className="relative group"
    >
      <div className="absolute -inset-[1px] rounded-[var(--radius-card)] bg-gradient-to-br from-orange/20 via-cyan/20 to-cyan/20 opacity-0 blur-xl transition-opacity duration-700 group-hover:opacity-100" />

      <motion.div
        animate={index % 2 === 0 ? { y: [0, -6, 0] } : { y: [0, 6, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: index * 0.5 }}
        className={cn(
          "relative rounded-[var(--radius-card)] bg-card-bg border border-soft-border backdrop-blur-xl p-8 md:p-10 transition-all duration-500",
          "group-hover:border-orange/30 group-hover:shadow-[0_24px_64px_rgba(0,0,0,0.45),0_0_30px_rgba(255,107,0,0.08)]"
        )}
      >
        {/* Avatar */}
        <div className="flex items-center gap-5 mb-6">
          <div className="relative">
            {person.photo ? (
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-cyan/30 shadow-lg shadow-cyan/20">
                <img
                  src={imgCache(person.photo)}
                  alt={person.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                    const parent = (e.target as HTMLElement).parentElement;
                    if (parent) {
                      parent.classList.add(
                        "bg-gradient-to-br", "from-orange", "via-cyan", "to-cyan",
                        "flex", "items-center", "justify-center"
                      );
                      const span = document.createElement("span");
                      span.className = "text-3xl font-bold font-heading text-white";
                      span.textContent = getInitials(person.name);
                      parent.appendChild(span);
                    }
                  }}
                />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange via-cyan to-cyan flex items-center justify-center shadow-lg shadow-cyan/20">
                <span className="text-3xl font-bold font-heading text-white">
                  {getInitials(person.name)}
                </span>
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-cyan border-2 border-card-bg flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan animate-ping opacity-75" />
              <div className="absolute w-2.5 h-2.5 rounded-full bg-cyan" />
            </div>
          </div>
          <div>
            <h3 className="text-xl md:text-2xl font-bold font-heading text-main-text">
              {person.name}
            </h3>
            <span className="text-sm text-cyan font-medium tracking-wide">
              {person.role}
            </span>
          </div>
        </div>

        {person.bio && (
          <p className="text-secondary-text text-sm leading-relaxed mb-8">
            {person.bio}
          </p>
        )}

        {/* Contact */}
        {person.email && (
          <div className="space-y-3 mb-8">
            <a
              href={`mailto:${person.email}`}
              className="flex items-center gap-3 text-sm text-secondary-text hover:text-cyan transition-colors group/link"
            >
              <span className="w-9 h-9 rounded-xl bg-white/[0.04] border border-soft-border flex items-center justify-center group-hover/link:border-cyan/30 group-hover/link:bg-cyan/5 transition-all duration-300">
                <Mail className="w-4 h-4" />
              </span>
              {person.email}
            </a>
            {person.phone && (
              <a
                href={`tel:${person.phone}`}
                className="flex items-center gap-3 text-sm text-secondary-text hover:text-cyan transition-colors group/link"
              >
                <span className="w-9 h-9 rounded-xl bg-white/[0.04] border border-soft-border flex items-center justify-center group-hover/link:border-cyan/30 group-hover/link:bg-cyan/5 transition-all duration-300">
                  <Phone className="w-4 h-4" />
                </span>
                {person.phone}
              </a>
            )}
          </div>
        )}

        {/* Social Links */}
        {(person.linkedin || person.twitter || person.github) && (
          <div className="flex items-center gap-3 pt-6 border-t border-soft-border">
            {person.linkedin && (
              <a href={person.linkedin} aria-label="LinkedIn" className="w-10 h-10 rounded-xl bg-white/[0.04] border border-soft-border flex items-center justify-center text-secondary-text hover:text-cyan hover:border-cyan/30 hover:bg-cyan/5 transition-all duration-300">
                <Globe className="w-4 h-4" />
              </a>
            )}
            {person.twitter && (
              <a href={person.twitter} aria-label="Twitter" className="w-10 h-10 rounded-xl bg-white/[0.04] border border-soft-border flex items-center justify-center text-secondary-text hover:text-cyan hover:border-cyan/30 hover:bg-cyan/5 transition-all duration-300">
                <AtSign className="w-4 h-4" />
              </a>
            )}
            {person.github && (
              <a href={person.github} aria-label="GitHub" className="w-10 h-10 rounded-xl bg-white/[0.04] border border-soft-border flex items-center justify-center text-secondary-text hover:text-cyan hover:border-cyan/30 hover:bg-cyan/5 transition-all duration-300">
                <GitBranch className="w-4 h-4" />
              </a>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export function Founders() {
  const { t } = useLanguage();
  const { data } = useSiteData();
  const company = data?.company;
  const isEnabled = data?.featureFlags?.team_section !== false;

  if (!isEnabled) return null;

  const people: any[] = [];

  if (data?.teamMembers && data.teamMembers.length > 0) {
    data.teamMembers.forEach((m) => {
      people.push({
        name: m.name,
        role: m.role,
        bio: m.bio || null,
        email: m.email || null,
        phone: m.phone || null,
        linkedin: m.linkedin || null,
        twitter: m.twitter || null,
        github: m.github || null,
        photo: m.photo || null,
      });
    });
  } else if (company?.founderName) {
    people.push({
      name: company.founderName,
      role: company.founderRole || "Founder & CEO",
      bio: company.founderBio || null,
      email: company.email || null,
      phone: company.phone || null,
      linkedin: company.linkedin || null,
      twitter: company.twitter || null,
      github: company.github || null,
      photo: company.founderImage || null,
    });
  }

  if (people.length === 0) return null;

  return (
    <section id="leadership" className="relative py-20 md:py-30 overflow-hidden">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label={t("founders.title")}
          title={t("founders.title")}
          description={t("founders.subtitle")}
        />

        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          {people.map((person, i) => (
            <PersonCard key={`${person.name}-${i}`} person={person} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
