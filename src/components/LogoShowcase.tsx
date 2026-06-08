"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Sparkles } from "lucide-react";
import { useSiteData } from "@/hooks/useSiteData";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export function LogoShowcase() {
  const { data } = useSiteData();
  const company = data?.company;
  const [logoError, setLogoError] = useState(false);

  if (!company?.logo || logoError) return null;

  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full bg-gradient-to-br from-orange/5 via-cyan/5 to-orange/5 blur-[120px] animate-breathe" />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        {/* Label */}
        <motion.div variants={itemVariants} className="text-center mb-10">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-semibold tracking-[0.2em] uppercase text-cyan bg-cyan/10 border border-cyan/20 rounded-full">
            <Sparkles className="w-3 h-3" />
            Our Brand
          </span>
        </motion.div>

        {/* Logo display */}
        <motion.div variants={itemVariants} className="flex justify-center">
          <div className="relative group">
            {/* Glow effects */}
            <div className="absolute -inset-20 bg-gradient-to-br from-orange/20 via-cyan/20 to-orange/20 rounded-[50%] opacity-0 blur-[80px] transition-opacity duration-1000 group-hover:opacity-100" />
            <div className="absolute -inset-10 bg-gradient-to-br from-orange/10 via-cyan/10 to-orange/10 rounded-full opacity-40 blur-[60px] animate-pulse-soft" />

            {/* Logo container */}
            <div className="relative rounded-3xl bg-black/40 backdrop-blur-2xl border border-white/10 p-8 md:p-12 transition-all duration-700 group-hover:border-orange/30 group-hover:shadow-[0_0_60px_rgba(255,107,0,0.15),0_0_120px_rgba(0,229,255,0.08)]">
              <motion.div
                animate={{
                  y: [0, -6, 0],
                  scale: [1, 1.02, 1],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="flex items-center justify-center"
              >
                <Image
                  src={company.logo}
                  alt={`${company.name} logo`}
                  width={400}
                  height={160}
                  className="max-w-[280px] md:max-w-[400px] max-h-[120px] md:max-h-[160px] object-contain"
                  style={{
                    filter: "drop-shadow(0 0 30px rgba(255,107,0,0.2))",
                  }}
                  onError={() => setLogoError(true)}
                />
              </motion.div>

              {/* Corner decorations */}
              <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-orange/30 rounded-tl-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-cyan/30 rounded-tr-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-cyan/30 rounded-bl-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-orange/30 rounded-br-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            </div>

            {/* Orbiting glow dots */}
            <motion.div
              className="absolute -inset-12 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    background: i % 2 === 0 ? "#FF6B00" : "#00E5FF",
                    top: "50%",
                    left: "-4px",
                    marginTop: "-4px",
                    boxShadow: `0 0 8px ${i % 2 === 0 ? "rgba(255,107,0,0.6)" : "rgba(0,229,255,0.6)"}`,
                    transform: `rotate(${i * 45}deg) translateX(${i % 2 === 0 ? 60 : 80}px)`,
                  }}
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.25,
                  }}
                />
              ))}
            </motion.div>

            {/* Second orbit ring */}
            <motion.div
              className="absolute -inset-16 rounded-full border border-dashed border-white/5"
              animate={{ rotate: -360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            />
          </div>
        </motion.div>

        {/* Tagline */}
        {company.tagline && (
          <motion.p
            variants={itemVariants}
            className="text-center mt-8 text-lg text-secondary-text/70 tracking-wide font-light"
          >
            {company.tagline}
          </motion.p>
        )}
      </motion.div>
    </section>
  );
}
