"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import {
  Sparkles,
  ArrowRight,
  ChevronRight,
  Code2,
  Zap,
  Shield,
  Users,
  Activity,
  CheckCircle2,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useSiteData } from "@/hooks/useSiteData";

const Hero3DScene = dynamic(() => import("@/components/Hero3D"), { ssr: false });

const easeOut = [0.16, 1, 0.3, 1] as [number, number, number, number];

function GlowingButton({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative group ${className}`}>
      <div className="absolute -inset-1 bg-gradient-to-r from-orange via-cyan to-cyan rounded-[var(--radius-button)] opacity-40 blur-xl group-hover:opacity-70 group-hover:blur-2xl transition-all duration-700" />
      <div className="absolute -inset-0.5 bg-gradient-to-r from-orange via-cyan to-cyan rounded-[var(--radius-button)] opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative px-8 py-4 bg-primary-bg rounded-[calc(var(--radius-button)-1px)] flex items-center gap-2.5 text-base font-medium text-main-text group-hover:bg-transparent transition-all duration-500">
        {children}
      </div>
    </div>
  );
}

function splitList(val: string | null | undefined, fallback: string[]): string[] {
  if (!val) return fallback;
  return val.split(",").map((s) => s.trim()).filter(Boolean);
}

function heroHeadingParts(raw: string | null | undefined, fallback: string[]): string[] {
  if (!raw) return fallback;
  const parts = raw.split("|").map((s) => s.trim()).filter(Boolean);
  return parts.length >= 2 ? parts : [raw, "", ""];
}

const Hero = memo(function Hero() {
  const { lang, t } = useLanguage();
  const { data } = useSiteData();
  const settings = data?.settings;

  const techStack = splitList(settings?.hero_tech_stack, []);

  const headlineParts = heroHeadingParts(
    settings?.hero_headline ?? settings?.hero_heading,
    [t("hero.title.0"), t("hero.title.1"), t("hero.title.2")]
  );

  const subtitle = settings?.hero_subtitle || t("hero.description");

  const sk = (k: string, fallback: string): string => settings?.[k] || fallback;

  const stats = [
    { icon: Code2, label: "Projects", value: settings?.hero_projects || "—", change: sk("hero_projects_change", "") },
    { icon: Shield, label: "Uptime", value: settings?.hero_uptime || "—", change: sk("hero_uptime_label", "") },
    { icon: Users, label: "Support", value: settings?.hero_support || "—", change: sk("hero_support_label", "") },
  ];

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center pt-28 pb-20 md:pt-40 md:pb-28 overflow-hidden"
    >
      {/* Cinematic vignette */}
      <div className="absolute inset-0 vignette z-[2] pointer-events-none" />

      <div className="absolute inset-0 hero-gradient-mesh" />
      <div className="absolute top-[-10%] left-[-5%] w-[60%] h-[40%] rounded-full bg-gradient-to-r from-orange/8 to-transparent blur-[120px] animate-aurora" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[35%] rounded-full bg-gradient-to-l from-cyan/8 to-transparent blur-[120px] animate-aurora" style={{ animationDelay: "-4s" }} />
      <div className="absolute top-[15%] left-[10%] w-[600px] h-[600px] rounded-full bg-orange/6 blur-[150px] animate-cinematic-glow" />
      <div className="absolute top-[40%] right-[5%] w-[500px] h-[500px] rounded-full bg-cyan/6 blur-[140px] animate-cinematic-glow" style={{ animationDelay: "-2s" }} />
      <div className="absolute bottom-[10%] left-[35%] w-[450px] h-[450px] rounded-full bg-cyan/5 blur-[120px] animate-cinematic-glow" style={{ animationDelay: "-4s" }} />
      <div className="absolute inset-0 grid-pattern opacity-30" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              left: `${(i * 7 + 3) % 100}%`,
              top: `${(i * 13 + 7) % 100}%`,
              background: i % 2 === 0 ? "#FF6B00" : "#00E5FF",
              boxShadow: i % 2 === 0
                ? "0 0 4px rgba(255,107,0,0.6)"
                : "0 0 4px rgba(0,229,255,0.6)",
            }}
            animate={{ y: [0, -40, 0], opacity: [0.1, 0.7, 0.1], scale: [0.5, 1, 0.5] }}
            transition={{
              duration: 4 + (i % 5) * 2,
              repeat: Infinity,
              delay: i * 0.25,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* ORXS brand watermark */}
      <div className="absolute inset-0 z-[3] flex items-center justify-center pointer-events-none overflow-hidden select-none">
        <motion.span
          className="font-bold leading-none tracking-[-0.04em]"
          style={{
            fontFamily: "var(--font-space, 'Space Grotesk'), sans-serif",
            fontSize: "clamp(16rem, 35vw, 45rem)",
            background: "linear-gradient(180deg, rgba(255,107,0,0.06) 0%, rgba(0,229,255,0.04) 50%, rgba(255,107,0,0.02) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            transform: "translateY(-5%)",
          }}
          initial={{ opacity: 0, scale: 1.2 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          ORXS
        </motion.span>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* LEFT SIDE */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            {/* AI Badge */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
              className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/[0.04] border border-soft-border mb-10 group hover:bg-white/[0.06] transition-colors cursor-default"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan" />
              </span>
              <Sparkles className="w-3.5 h-3.5 text-cyan" />
              <span className="text-sm font-medium text-secondary-text tracking-wide">
                {data?.settings?.sec_hero_label || (lang === "bn" ? "নেক্সট-জেন এআই এজেন্সি" : "Next-Gen AI Agency")}
              </span>
            </motion.div>

            {/* Headline */}
            <h1 className="text-[clamp(2rem,6vw,6rem)] sm:text-[clamp(2.5rem,6vw,6rem)] font-bold font-heading tracking-tight leading-[0.92] mb-6">
              <span className="block overflow-hidden">
                <motion.span
                  className="inline-block"
                  initial={{ opacity: 0, y: 40, rotateX: -10 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  transition={{ duration: 0.7, delay: 0.4, ease: easeOut }}
                >
                  {headlineParts[0]}
                </motion.span>
              </span>
              <span className="block overflow-hidden">
                <motion.span
                  className="inline-block"
                  initial={{ opacity: 0, y: 40, rotateX: -10 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  transition={{ duration: 0.7, delay: 0.48, ease: easeOut }}
                >
                  <span className="gradient-text-orange">{headlineParts[1]}</span>
                </motion.span>
              </span>
              <span className="block overflow-hidden">
                <motion.span
                  className="inline-block"
                  initial={{ opacity: 0, y: 40, rotateX: -10 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  transition={{ duration: 0.7, delay: 0.56, ease: easeOut }}
                >
                  {headlineParts[2]}
                </motion.span>
              </span>
            </h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8, ease: "easeOut" }}
              className="text-lg md:text-xl text-secondary-text/90 leading-[1.7] max-w-lg mb-10 font-light tracking-wide"
            >
              {subtitle}
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9, ease: "easeOut" }}
              className="flex flex-wrap gap-5 mb-14"
            >
              <GlowingButton>
                <a href="#projects" className="flex items-center gap-2.5">
                  {t("hero.viewProjects")}
                  <ArrowRight className="w-4 h-4" />
                </a>
              </GlowingButton>

              <a
                href="#contact"
                className="relative inline-flex items-center gap-2.5 px-8 py-4 rounded-[var(--radius-button)] glass text-main-text text-base font-medium group hover:bg-white/[0.08] transition-all duration-300"
              >
                <span className="relative z-10 flex items-center gap-2.5">
                  {t("hero.talkWithUs")}
                  <motion.span
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </motion.span>
                </span>
              </a>
            </motion.div>

            {/* Stats Strip */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.0, ease: "easeOut" }}
              className="mb-10"
            >
              <div               className="flex flex-wrap items-center gap-4 sm:gap-6 md:gap-12">
                {stats.map((stat, si) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.1 + si * 0.1, duration: 0.4, ease: "easeOut" }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-soft-border flex items-center justify-center">
                      <stat.icon className="w-4 h-4 text-cyan" />
                    </div>
                    <div>
                      <p className="text-lg font-bold font-heading text-main-text leading-none mb-0.5">
                        {stat.value}
                      </p>
                      <p className="text-[11px] text-muted-text tracking-wide">
                        {stat.change}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Tech Stack */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.1, ease: "easeOut" }}
            >
              <p className="text-[11px] font-semibold text-muted-text tracking-[0.15em] uppercase mb-4">
                Technology Stack
              </p>
              <div className="flex flex-wrap gap-2">
                {techStack.map((tech, i) => (
                  <motion.span
                    key={tech}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.2 + i * 0.05, duration: 0.3 }}
                    className="px-3.5 py-1.5 text-xs font-medium rounded-full bg-white/[0.04] border border-soft-border text-secondary-text/80 hover:border-cyan/30 hover:text-cyan hover:bg-cyan/5 transition-all duration-300 cursor-default"
                  >
                    {tech}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* RIGHT SIDE - 3D Scene + Overlay Cards */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.3, ease: easeOut }}
            className="relative hidden lg:block"
          >
            {/* 3D Scene Background */}
            <div className="relative w-full h-full">
              <Hero3DScene />

              {/* Floating Profile/Notification Card */}
              <motion.div
                animate={{ y: [0, -10, 0], rotate: [0, 1, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute top-6 right-6 z-20 w-52 rounded-2xl bg-card-bg/90 backdrop-blur-xl border border-soft-border p-4 shadow-2xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange via-cyan to-cyan flex items-center justify-center text-white font-bold text-sm shrink-0">
                    AI
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-main-text truncate">Neural Core</p>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan" />
                      <span className="text-[10px] text-cyan font-medium">Active</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Stats Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.0, duration: 0.6 }}
                className="absolute bottom-8 left-4 z-20"
              >
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                  className="rounded-2xl bg-card-bg/90 backdrop-blur-xl border border-soft-border p-4 shadow-2xl min-w-[180px]"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Activity className="w-4 h-4 text-cyan" />
                    <span className="text-xs font-semibold text-main-text">Live Metrics</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-text">Processing</span>
                      <span className="text-cyan font-medium">2.4 GHz</span>
                    </div>
                    <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "85%" }}
                        transition={{ duration: 1.2, delay: 2.5, ease: "easeOut" }}
                        className="h-full rounded-full bg-gradient-to-r from-orange to-cyan"
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-text">Memory</span>
                      <span className="text-cyan font-medium">7.8 GB</span>
                    </div>
                    <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "62%" }}
                        transition={{ duration: 1.2, delay: 2.7, ease: "easeOut" }}
                        className="h-full rounded-full bg-gradient-to-r from-orange to-cyan"
                      />
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              {/* Notification Toast */}
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 2.4, duration: 0.6, ease: "easeOut" }}
                className="absolute top-[40%] -right-2 z-20"
              >
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="flex items-center gap-3 rounded-2xl bg-card-bg/90 backdrop-blur-xl border border-soft-border px-4 py-3 shadow-2xl min-w-[200px]"
                >
                  <div className="w-8 h-8 rounded-xl bg-cyan/10 border border-cyan/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-cyan" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-main-text">AI Model Deployed</p>
                    <p className="text-[10px] text-muted-text">v3.2.1 &bull; 2 min ago</p>
                  </div>
                </motion.div>
              </motion.div>

              {/* Floating Icons */}
              <motion.div
                animate={{ y: [0, -12, 0], rotate: [0, 3, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-6 -right-4 w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan/15 to-cyan/8 border border-soft-border backdrop-blur-xl flex items-center justify-center"
              >
                <Zap className="w-7 h-7 text-cyan/50" />
              </motion.div>

              <motion.div
                animate={{ y: [0, 8, 0], rotate: [0, -4, 0] }}
                transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[50%] -left-6 w-16 h-16 rounded-2xl bg-gradient-to-br from-orange/15 to-orange/8 border border-soft-border backdrop-blur-xl flex items-center justify-center"
              >
                <Sparkles className="w-6 h-6 text-orange/50" />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
});

Hero.displayName = "Hero";

export { Hero };
