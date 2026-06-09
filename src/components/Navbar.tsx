"use client";

import { useState, useEffect, startTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowUpRight, Globe, Lock } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { useSiteData } from "@/hooks/useSiteData";
import { CineLetters } from "@/components/CinematicSystem";
import { usePathname } from "next/navigation";

const navItems = ["home", "about", "services", "projects", "reviews", "skills", "faq", "contact"] as const;

import { memo } from "react";

export const Navbar = memo(function Navbar() {
  const pathname = usePathname();
  const { lang, setLang, t } = useLanguage();
  const { data } = useSiteData();
  const company = data?.company;
  const siteName = company?.name || data?.settings?.site_name || "Portfolio";
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    if (company?.logo) startTransition(() => setLogoError(false));
  }, [company?.logo]);

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      for (let i = navItems.length - 1; i >= 0; i--) {
        const el = document.getElementById(navItems[i]);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 150) {
            setActiveSection(navItems[i]);
            break;
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  if (pathname.startsWith("/admin")) return null;
  const siteInitial = siteName[0];

  const toggleLang = () => {
    setLang(lang === "en" ? "bn" : "en");
  };

  return (
    <motion.header
      suppressHydrationWarning
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        scrolled
          ? "bg-black/80 backdrop-blur-xl border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)]"
          : "bg-transparent border-b border-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <a href="#home" className="flex items-center gap-2.5 group relative min-w-0">
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF6B00] to-[#00E5FF] flex items-center justify-center shadow-[0_0_16px_rgba(255,107,0,0.25)] group-hover:shadow-[0_0_24px_rgba(0,229,255,0.35)] transition-all duration-500 overflow-hidden shrink-0">
              {company?.logo && !logoError ? (
                <Image
                  src={company.logo}
                  alt={siteName}
                  fill
                  sizes="36px"
                  className="object-contain p-1"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <span className="text-white font-bold text-sm drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">{siteInitial}</span>
              )}
            </div>
            <CineLetters
              text={siteName}
              className="brand-text text-[0.95rem] sm:text-lg md:text-xl tracking-tight truncate min-w-0"
              delay={0.8}
              stagger={0.08}
            />
          </a>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <a
                key={item}
                href={`#${item}`}
                className={cn(
                  "relative px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300",
                  activeSection === item
                    ? "text-white"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                )}
              >
                {activeSection === item && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-0 bg-white/5 rounded-xl border border-white/10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10" suppressHydrationWarning>{t(`nav.${item}`)}</span>
                {activeSection === item && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute -bottom-[2px] left-4 right-4 h-[2px] bg-gradient-to-r from-[#FF6B00] to-[#00E5FF] rounded-full shadow-[0_0_8px_rgba(255,107,0,0.5)]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </a>
            ))}
          </nav>

          {/* Right Side */}
          <div className="hidden md:flex items-center gap-3">
            {/* Admin Login */}
            <a
              href="/admin/login"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-white/40 hover:text-white hover:bg-white/5 transition-all duration-300"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Admin</span>
            </a>

            {/* Language Switcher */}
            <button
              onClick={toggleLang}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-all duration-300 border border-white/10"
            >
              <Globe className="w-4 h-4" />
              <span suppressHydrationWarning>{lang === "en" ? "বাংলা" : "English"}</span>
            </button>

            {/* CTA Button */}
            <a
              href="#contact"
              className="relative inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl bg-[#FF6B00] text-white hover:shadow-[0_0_30px_rgba(255,107,0,0.3)] transition-all duration-300 hover:-translate-y-0.5 group"
            >
              <span suppressHydrationWarning>{t("nav.letsWorkTogether")}</span>
              <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden relative z-50 w-10 h-10 flex items-center justify-center rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden overflow-hidden border-t border-white/10 bg-black/95 backdrop-blur-xl"
          >
            <div className="px-4 py-6 space-y-2">
              {navItems.map((item) => (
                <a
                  key={item}
                  href={`#${item}`}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "block px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300",
                    activeSection === item
                      ? "bg-white/5 text-white border border-white/10"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  )}
                >
                  <span className="flex items-center gap-2" suppressHydrationWarning>
                    {t(`nav.${item}`)}
                    {activeSection === item && (
                      <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#FF6B00] to-[#00E5FF]" />
                    )}
                  </span>
                </a>
              ))}
              <div className="pt-4 flex flex-col gap-3">
                <a
                  href="/admin/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-white/40 hover:text-white hover:bg-white/5 transition-all duration-300"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </a>
                <button
                  onClick={() => { toggleLang(); setMobileOpen(false); }}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-all duration-300 border border-white/10"
                >
                  <Globe className="w-4 h-4" />
                  <span suppressHydrationWarning>{lang === "en" ? "বাংলা" : "English"}</span>
                </button>
                <a
                  href="#contact"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium bg-[#FF6B00] text-white hover:shadow-[0_0_30px_rgba(255,107,0,0.3)] transition-all duration-300"
                >
                  <span suppressHydrationWarning>{t("nav.letsWorkTogether")}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
});
