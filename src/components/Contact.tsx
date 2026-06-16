"use client";

import { useMemo, memo } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Phone,
  MessageCircle,
  MapPin,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useLanguage } from "@/context/LanguageContext";
import { useSiteData } from "@/hooks/useSiteData";

const iconMap: Record<string, LucideIcon> = {
  Mail, Phone, MessageCircle, MapPin,
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

const Contact = memo(function Contact() {
  const { t } = useLanguage();
  const { data } = useSiteData();
  const contacts = data?.contacts ?? [];
  const company = data?.company;
  const isEnabled = data?.featureFlags?.contact_form !== false;
  const contactInfo = useMemo(() => contacts.map((c) => ({
    icon: iconMap[c.icon ?? ""] || Mail,
    label: c.label || c.type,
    value: c.value,
    href: c.type === "email" ? `mailto:${c.value}` : c.type === "phone" ? `tel:${c.value}` : c.type === "whatsapp" ? `https://wa.me/${c.value.replace(/\D/g, "")}` : "#",
  })), [contacts]);

  if (!isEnabled) return null;

  return (
    <section id="contact" className="relative py-20 md:py-30 overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] max-w-[60vw] max-h-[60vw] bg-gradient-to-bl from-cyan/5 to-transparent blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] max-w-[60vw] max-h-[60vw] bg-gradient-to-tr from-orange/5 to-transparent blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label={data?.settings?.sec_contact_label || t("contact.title")}
          title={data?.settings?.sec_contact_title || t("contact.title")}
          description={data?.settings?.sec_contact_subtitle || t("contact.subtitle")}
        />

        <div className="max-w-3xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-4"
          >
            {/* Contact Info Cards */}
            <motion.div variants={itemVariants} className="space-y-4">
              {contactInfo.map((info) => (
                <a
                  key={info.label}
                  href={info.href}
                  className="relative group block"
                >
                  <div className="absolute -inset-[1px] rounded-[var(--radius-card)] bg-gradient-to-br from-orange/10 via-cyan/10 to-cyan/10 opacity-0 blur-lg transition-opacity duration-500 group-hover:opacity-100" />
                  <div className="relative flex items-center gap-4 p-4 rounded-[var(--radius-card)] bg-card-bg border border-soft-border backdrop-blur-xl transition-all duration-500 group-hover:border-orange/20 group-hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-soft-border flex items-center justify-center shrink-0 group-hover:border-cyan/30 group-hover:shadow-[0_0_20px_rgba(0,229,255,0.1)] transition-all duration-500">
                      <info.icon className="w-5 h-5 text-cyan group-hover:text-orange transition-colors duration-500" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-muted-text uppercase tracking-[0.15em]">
                        {info.label}
                      </p>
                      <p className="text-sm font-medium text-main-text group-hover:text-orange transition-colors duration-300">
                        {info.value}
                      </p>
                    </div>
                    <Sparkles className="w-3 h-3 text-cyan/30 ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                </a>
              ))}
            </motion.div>

            {/* Map / Location Placeholder */}
            <motion.div
              variants={itemVariants}
              className="relative h-48 rounded-[var(--radius-card)] overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-orange/5 via-cyan/5 to-cyan/5" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,107,0,0.08)_0%,transparent_60%),radial-gradient(circle_at_70%_60%,rgba(0,229,255,0.08)_0%,transparent_60%)]" />
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(0,229,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.1) 1px, transparent 1px)",
                  backgroundSize: "30px 30px",
                }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="relative">
                  <MapPin className="w-8 h-8 text-orange mb-2" />
                  <motion.div
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-orange/30"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
                <p className="text-xs font-medium text-secondary-text">
                  {company?.address || ""}
                </p>
                <p className="text-[10px] text-muted-text mt-0.5">
                  {t("contact.title")}
                </p>
              </div>
              <div className="absolute inset-0 border border-soft-border rounded-[var(--radius-card)] group-hover:border-orange/20 transition-all duration-500" />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
});

Contact.displayName = "Contact";

export { Contact };
