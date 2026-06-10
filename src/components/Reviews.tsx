"use client";

import { useState, useEffect, useRef, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useLanguage } from "@/context/LanguageContext";
import { useSiteData } from "@/hooks/useSiteData";
import { cn } from "@/lib/utils";

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export const Reviews = memo(function Reviews() {
  const { t } = useLanguage();
  const { data } = useSiteData();
  const reviews = data?.reviews ?? [];
  const isEnabled = data?.featureFlags?.reviews_section !== false;
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reviewsLengthRef = useRef(reviews.length);

  reviewsLengthRef.current = reviews.length;

  useEffect(() => {
    if (reviews.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setDirection(1);
      setCurrent((prev) => (prev + 1) % reviewsLengthRef.current);
    }, 5000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [reviews.length]);

  if (!isEnabled) return null;

  const goTo = (index: number) => {
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
  };

  const goNext = () => {
    setDirection(1);
    setCurrent((prev) => (prev + 1) % reviewsLengthRef.current);
  };

  const goPrev = () => {
    setDirection(-1);
    setCurrent((prev) => (prev - 1 + reviewsLengthRef.current) % reviewsLengthRef.current);
  };

  if (reviews.length === 0) return null;

  const review = reviews[current];
  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 200 : -200, opacity: 0, scale: 0.95 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -200 : 200, opacity: 0, scale: 0.95 }),
  };

  return (
    <section id="reviews" className="relative py-20 md:py-30 overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] max-w-[80vw] max-h-[60vw] bg-gradient-to-br from-orange/5 via-cyan/5 to-orange/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label={data?.settings?.sec_reviews_label || t("reviews.title")}
          title={data?.settings?.sec_reviews_title || t("reviews.title")}
          description={data?.settings?.sec_reviews_subtitle || t("reviews.subtitle")}
        />

        <div className="max-w-4xl mx-auto">
          {/* Main Review Card */}
          <div className="relative">
            <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-orange/20 via-cyan/20 to-cyan/20 opacity-30 blur-xl" />

            <div className="relative rounded-2xl bg-card-bg border border-soft-border backdrop-blur-xl p-8 md:p-12 overflow-hidden">
              {/* Decorative quote */}
              <Quote className="absolute top-4 right-4 w-16 h-16 text-white/5" />

              {/* Stars */}
              <div className="flex gap-1.5 mb-8">
                {Array.from({ length: 5 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Star
                      className={cn(
                        "w-5 h-5",
                        i < review.rating
                          ? "fill-orange text-orange"
                          : "text-white/20"
                      )}
                    />
                  </motion.div>
                ))}
              </div>

              {/* Review Text */}
              <div className="relative min-h-[120px]">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.p
                    key={review.id}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="text-lg md:text-xl text-secondary-text leading-relaxed italic mb-8"
                  >
                    &ldquo;{review.reviewText}&rdquo;
                  </motion.p>
                </AnimatePresence>
              </div>

              {/* Reviewer Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange to-cyan flex items-center justify-center text-white font-bold text-lg">
                    {initials(review.reviewerName)}
                  </div>
                  <div>
                    <p className="text-base font-semibold text-main-text">
                      {review.reviewerName}
                    </p>
                    <p className="text-sm text-muted-text">
                      {review.reviewerEmail || "Verified Client"}
                    </p>
                  </div>
                </div>

                {/* Navigation Arrows */}
                <div className="hidden sm:flex items-center gap-2">
                  <button
                    onClick={goPrev}
                    className="w-10 h-10 rounded-xl bg-white/5 border border-soft-border flex items-center justify-center text-secondary-text hover:text-cyan hover:border-cyan/30 hover:bg-cyan/5 transition-all duration-300"
                    aria-label="Previous review"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={goNext}
                    className="w-10 h-10 rounded-xl bg-white/5 border border-soft-border flex items-center justify-center text-secondary-text hover:text-cyan hover:border-cyan/30 hover:bg-cyan/5 transition-all duration-300"
                    aria-label="Next review"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Dots */}
          {reviews.length > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              {reviews.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goTo(index)}
                  className={cn(
                    "transition-all duration-300 rounded-full",
                    index === current
                      ? "w-8 h-2 bg-gradient-to-r from-orange to-cyan shadow-[0_0_10px_rgba(255,107,0,0.3)]"
                      : "w-2 h-2 bg-white/20 hover:bg-white/40"
                  )}
                  aria-label={`Go to review ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
});
