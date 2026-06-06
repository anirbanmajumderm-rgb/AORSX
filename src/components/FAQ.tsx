"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, Send, MessageCircle, AlertCircle } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { useSiteData } from "@/hooks/useSiteData";
import { useAnalytics } from "@/hooks/useAnalytics";
import { cn } from "@/lib/utils";

export function FAQ() {
  const { t } = useLanguage();
  const { data } = useSiteData();
  const { trackInteraction } = useAnalytics();
  const faqData = data?.faq ?? [];
  const isEnabled = data?.featureFlags?.faq_section !== false;
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    question: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!isEnabled) return null;

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (submitError) setSubmitError(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.question.trim()) {
      setSubmitError("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    trackInteraction("faq_submission", formData.question.slice(0, 100));
    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitorName: formData.name.trim(),
          visitorEmail: formData.email.trim(),
          visitorPhone: formData.phone || null,
          question: formData.question.trim(),
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to submit question");
      }
      setSubmitted(true);
      setFormData({ name: "", email: "", phone: "", question: "" });
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to submit. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="faq" className="relative py-20 md:py-30 overflow-hidden">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-orange/5 to-transparent blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-cyan/5 to-transparent blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label={data?.settings?.sec_faq_label || t("faq.title")}
          title={data?.settings?.sec_faq_title || t("faq.title")}
          description={data?.settings?.sec_faq_subtitle || t("faq.subtitle")}
        />

        <div className="grid lg:grid-cols-5 gap-12 lg:gap-16 items-start">
          <div className="lg:col-span-3 space-y-3">
            {faqData.map((item, index) => {
              const isOpen = openIndex === index;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="relative group"
                >
                  <div
                    className={cn(
                      "absolute -inset-[1px] rounded-[var(--radius-card)] opacity-0 blur-xl transition-opacity duration-500",
                      isOpen ? "opacity-100" : "group-hover:opacity-60"
                    )}
                    style={{
                      background: isOpen
                        ? "linear-gradient(135deg, rgba(255,107,0,0.15), rgba(0,229,255,0.15))"
                        : "linear-gradient(135deg, rgba(255,107,0,0.08), rgba(0,229,255,0.08))",
                    }}
                  />
                  <div
                    className={cn(
                      "relative rounded-[var(--radius-card)] bg-card-bg backdrop-blur-xl border transition-all duration-500",
                      isOpen
                        ? "border-orange/30 shadow-[0_0_30px_rgba(255,107,0,0.08)]"
                        : "border-soft-border group-hover:border-white/20 group-hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
                    )}
                  >
                    <button
                      onClick={() => toggleAccordion(index)}
                      className="w-full flex items-center justify-between gap-4 px-6 md:px-8 py-5 md:py-6 text-left cursor-pointer"
                    >
                      <span
                        className={cn(
                          "text-base md:text-lg font-semibold font-heading transition-colors duration-300 pr-4",
                          isOpen ? "gradient-text-orange" : "text-main-text"
                        )}
                      >
                        {item.question}
                      </span>
                      <div
                        className={cn(
                          "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-300",
                          isOpen
                            ? "bg-orange/10 border-orange/30 text-orange"
                            : "bg-white/5 border-soft-border text-secondary-text group-hover:border-white/20"
                        )}
                      >
                        {isOpen ? (
                          <Minus className="w-4 h-4" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                      </div>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          key="answer"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{
                            height: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
                            opacity: { duration: 0.3, delay: 0.05 },
                          }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 md:px-8 pb-6 md:pb-8">
                            <div className="w-12 h-[2px] bg-gradient-to-r from-orange to-cyan rounded-full mb-4" />
                            <p className="text-secondary-text leading-relaxed">
                              {item.answer}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="lg:col-span-2"
          >
            <div className="relative sticky top-28">
              <div className="absolute -inset-[1px] rounded-[var(--radius-card)] bg-gradient-to-br from-orange/20 via-cyan/20 to-cyan/20 opacity-30 blur-xl" />

              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative rounded-[var(--radius-card)] bg-card-bg border border-soft-border backdrop-blur-xl px-6 md:px-10 py-10 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange/20 to-cyan/20 border border-orange/30 flex items-center justify-center mx-auto mb-6"
                  >
                    <MessageCircle className="w-8 h-8 text-orange" />
                  </motion.div>
                  <h3 className="text-xl font-bold font-heading text-main-text mb-2">
                    {t("faq.askQuestion")}
                  </h3>
                  <p className="text-secondary-text text-sm leading-relaxed">
                    {t("faq.thanks") || "Thank you! We'll get back to you within 24 hours."}
                  </p>
                </motion.div>
              ) : (
                <div className="relative rounded-[var(--radius-card)] bg-card-bg border border-soft-border backdrop-blur-xl px-6 md:px-8 py-8 md:py-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange/20 to-cyan/20 border border-orange/20 flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-orange" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold font-heading text-main-text">
                        {t("faq.askQuestion")}
                      </h3>
                      <p className="text-xs text-muted-text">
                        {t("faq.subtitle")}
                      </p>
                    </div>
                  </div>

                  {submitError && (
                    <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-sm text-red-400">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {submitError}
                    </div>
                  )}

                  <form onSubmit={handleFormSubmit} className="space-y-4">
                    <Input
                      label={t("faq.name")}
                      name="name"
                      placeholder={t("faq.name")}
                      value={formData.name}
                      onChange={handleFormChange}
                      required
                    />
                    <Input
                      label={t("faq.email")}
                      name="email"
                      type="email"
                      placeholder={t("faq.email")}
                      value={formData.email}
                      onChange={handleFormChange}
                      required
                    />
                    <Input
                      label={t("faq.phone")}
                      name="phone"
                      type="tel"
                      placeholder={t("faq.phone")}
                      value={formData.phone}
                      onChange={handleFormChange}
                    />
                    <Textarea
                      label={t("faq.yourQuestion")}
                      name="question"
                      placeholder={t("faq.yourQuestion")}
                      rows={4}
                      value={formData.question}
                      onChange={handleFormChange}
                      required
                    />
                    <Button
                      variant="default"
                      size="lg"
                      className="w-full"
                      type="submit"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Sending...
                        </span>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          {t("faq.submit")}
                        </>
                      )}
                    </Button>
                  </form>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
