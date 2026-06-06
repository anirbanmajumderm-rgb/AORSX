"use client";

import { useState, useMemo, memo } from "react";
import { motion } from "framer-motion";
import { ArrowUp, GitBranch, Globe, AtSign, Mail, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useSiteData } from "@/hooks/useSiteData";
import { CineLetters } from "@/components/CinematicSystem";
import { usePathname } from "next/navigation";

const navItems = ["home", "about", "services", "projects", "reviews", "skills", "faq", "contact"] as const;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const Footer = memo(function Footer() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { data } = useSiteData();
  const company = data?.company;
  const services = data?.services ?? [];
  const serviceKeys = useMemo(() => services.map((_, i) => `services.items.${i}.name`), [services]);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState<"idle" | "subscribing" | "success" | "error">("idle");
  const [newsletterMessage, setNewsletterMessage] = useState("");

  if (pathname.startsWith("/admin")) return null;

  const socialLinks = [
    { label: "GitHub", icon: GitBranch, href: company?.github ? `https://github.com/${company.github}` : "#" },
    { label: "LinkedIn", icon: Globe, href: company?.linkedin || "#" },
    { label: "Twitter", icon: AtSign, href: company?.twitter || "#" },
    { label: "Email", icon: Mail, href: company?.email ? `mailto:${company.email}` : "#" },
  ];

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterStatus("subscribing");
    setNewsletterMessage("");
    try {
      const res = await fetch("/api/contact-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Newsletter Subscriber",
          email: newsletterEmail.trim(),
          message: "Newsletter subscription request",
          subject: "Newsletter Signup",
        }),
      });
      if (!res.ok) throw new Error("Failed to subscribe");
      setNewsletterStatus("success");
      setNewsletterMessage("Subscribed successfully!");
      setNewsletterEmail("");
    } catch {
      setNewsletterStatus("error");
      setNewsletterMessage("Failed to subscribe. Try again.");
    }
  };

  return (
    <footer suppressHydrationWarning className="relative border-t border-white/10">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid md:grid-cols-4 gap-10 items-start"
        >
          <motion.div variants={itemVariants} className="md:col-span-1">
            <a href="#home" className="flex items-center gap-2.5 mb-4 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF6B00] to-[#00E5FF] flex items-center justify-center shadow-[0_0_16px_rgba(255,107,0,0.2)] group-hover:shadow-[0_0_24px_rgba(0,229,255,0.3)] transition-all duration-500">
                <span className="text-white font-bold text-sm drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">{(company?.name || "C")[0]}</span>
              </div>
              <CineLetters
                text={company?.name || data?.settings?.site_name || "Portfolio"}
                className="brand-text text-lg"
                delay={0.5}
                stagger={0.06}
              />
            </a>
            <p className="text-sm text-white/60 leading-relaxed mb-3">
              {company?.description || t("footer.description")}
            </p>
            <p className="text-xs text-white/40 italic">
              {company?.tagline || t("footer.tagline")}
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="md:col-span-1">
            <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-5">
              {t("footer.navigation")}
            </h4>
            <nav className="flex flex-col gap-3">
              {navItems.map((item) => (
                <a
                  key={item}
                  href={`#${item}`}
                  className="text-sm text-white/60 hover:text-white hover:translate-x-1 transition-all duration-300"
                >
                  {t(`nav.${item}`)}
                </a>
              ))}
            </nav>
          </motion.div>

          <motion.div variants={itemVariants} className="md:col-span-1">
            <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-5">
              {t("services.title")}
            </h4>
            <nav className="flex flex-col gap-3">
              {serviceKeys.map((key) => (
                <a
                  key={key}
                  href="#services"
                  className="text-sm text-white/60 hover:text-white hover:translate-x-1 transition-all duration-300"
                >
                  {t(key)}
                </a>
              ))}
            </nav>
          </motion.div>

          <motion.div variants={itemVariants} className="md:col-span-1">
            <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-5">
              {t("footer.social")}
            </h4>
            <div className="flex gap-3 mb-6">
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-[#00E5FF] hover:border-[#00E5FF]/30 hover:bg-[#00E5FF]/5 hover:shadow-[0_0_20px_rgba(0,229,255,0.15)] transition-all duration-300"
                  aria-label={link.label}
                >
                  <link.icon className="w-4 h-4" />
                </a>
              ))}
            </div>

            <div>
              <label htmlFor="newsletter-email" className="block text-xs text-white/40 mb-2">
                {t("footer.stayUpdated") || "Stay updated"}
              </label>
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                <input
                  id="newsletter-email"
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="flex-1 px-3 py-2 text-sm rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#00E5FF]/50 focus:shadow-[0_0_15px_rgba(0,229,255,0.1)] transition-all duration-300"
                />
                <button
                  type="submit"
                  disabled={newsletterStatus === "subscribing"}
                  className="px-3 py-2 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#00E5FF] text-white text-sm font-medium hover:shadow-[0_0_25px_rgba(255,107,0,0.3)] transition-all duration-300 disabled:opacity-50"
                >
                  {newsletterStatus === "subscribing" ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin block" />
                  ) : newsletterStatus === "success" ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Mail className="w-4 h-4" />
                  )}
                </button>
              </form>
              {newsletterMessage && (
                <p className={`text-xs mt-1 ${newsletterStatus === "success" ? "text-green-400" : "text-red-400"}`}>
                  {newsletterMessage}
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>

        <div className="relative my-12">
          <div className="h-px bg-gradient-to-r from-transparent via-[#FF6B00]/50 to-transparent" />
          <div className="h-px bg-gradient-to-r from-transparent via-[#00E5FF]/30 to-transparent mt-px" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-2 text-xs text-white/40">
            <span>&copy; {new Date().getFullYear()} <span className="brand-text-solid">{company?.name || data?.settings?.site_name || "Portfolio"}</span></span>
            <span className="w-1 h-1 rounded-full bg-[#00E5FF]" />
            <span>{t("footer.rights")}</span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <a
              href="#"
              className="text-white/40 hover:text-[#00E5FF] transition-colors duration-300 hover:shadow-[0_0_10px_rgba(0,229,255,0.3)]"
            >
              {t("footer.terms")}
            </a>
            <span className="w-1 h-1 rounded-full bg-[#00E5FF]/60" />
            <a
              href="#"
              className="text-white/40 hover:text-[#00E5FF] transition-colors duration-300 hover:shadow-[0_0_10px_rgba(0,229,255,0.3)]"
            >
              {t("footer.privacy")}
            </a>
          </div>

          <button
            onClick={scrollToTop}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-white/60 hover:text-white hover:border-[#00E5FF]/30 hover:shadow-[0_0_20px_rgba(0,229,255,0.15)] transition-all duration-300"
          >
            <ArrowUp className="w-3 h-3" />
            Top
          </button>
        </motion.div>
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";

export { Footer };
