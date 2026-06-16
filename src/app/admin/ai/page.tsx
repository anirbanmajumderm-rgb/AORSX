"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bot, MessageSquare, BookOpen, Package, Shield, Settings, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function AIControlCenterPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [inquiriesRes, knowledgeRes, packagesRes, configRes] = await Promise.all([
          fetch("/api/admin/inquiries"),
          fetch("/api/admin/knowledge"),
          fetch("/api/admin/packages"),
          fetch("/api/admin/ai-config"),
        ]);
        const inquiries = await inquiriesRes.json();
        const knowledge = await knowledgeRes.json();
        const packages = await packagesRes.json();
        const config = await configRes.json();

        const totalInquiries = inquiries.success ? (inquiries.data as any[]).length : 0;
        const pendingInquiries = inquiries.success ? (inquiries.data as any[]).filter((i: any) => i.status === "pending").length : 0;
        const totalKnowledge = knowledge.success ? (knowledge.data as any[]).length : 0;
        const totalPackages = packages.success ? (packages.data as any[]).length : 0;
        const aiEnabled = config.success && config.data?.auto_reply_enabled === "true";

        setStats({ totalInquiries, pendingInquiries, totalKnowledge, totalPackages, aiEnabled });
      } catch {
        setStats({ totalInquiries: 0, pendingInquiries: 0, totalKnowledge: 0, totalPackages: 0, aiEnabled: false });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-48 bg-white/5 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-28 bg-white/5 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  const cards = [
    {
      title: "AI Chatbot",
      description: "Configure auto-reply behavior",
      href: "/admin/ai/chatbot",
      icon: Bot,
      color: "from-neon-cyan/20 to-neon-cyan/5",
      textColor: "text-neon-cyan",
      badge: stats?.aiEnabled ? "Active" : "Disabled",
      badgeColor: stats?.aiEnabled ? "text-green-400" : "text-white/30",
    },
    {
      title: "Inquiries",
      description: `${stats?.pendingInquiries || 0} pending of ${stats?.totalInquiries || 0} total`,
      href: "/admin/ai/inquiries",
      icon: MessageSquare,
      color: "from-purple-500/20 to-purple-500/5",
      textColor: "text-purple-400",
    },
    {
      title: "Knowledge Base",
      description: `${stats?.totalKnowledge || 0} entries`,
      href: "/admin/ai/knowledge",
      icon: BookOpen,
      color: "from-orange-500/20 to-orange-500/5",
      textColor: "text-orange-400",
    },
    {
      title: "Packages",
      description: `${stats?.totalPackages || 0} packages`,
      href: "/admin/ai/packages",
      icon: Package,
      color: "from-emerald-500/20 to-emerald-500/5",
      textColor: "text-emerald-400",
    },
    {
      title: "Policies",
      description: "Company policy & rules",
      href: "/admin/ai/policies",
      icon: Shield,
      color: "from-blue-500/20 to-blue-500/5",
      textColor: "text-blue-400",
    },
    {
      title: "AI Settings",
      description: "Model config & training",
      href: "/admin/ai-training",
      icon: Settings,
      color: "from-pink-500/20 to-pink-500/5",
      textColor: "text-pink-400",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">AI Control Center</h1>
        <p className="text-sm text-white/40 mt-1">Manage your AI assistant configuration</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
          >
            <Link
              href={card.href}
              className="relative group block rounded-2xl bg-white/[0.02] border border-white/[0.04] p-5 hover:bg-white/[0.04] transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={cn("p-2.5 rounded-xl bg-gradient-to-br", card.color)}>
                  <card.icon className={cn("w-5 h-5", card.textColor)} />
                </div>
                {"badge" in card && card.badge ? (
                  <span className={cn("text-[10px] font-medium", card.badgeColor)}>{card.badge}</span>
                ) : (
                  <ArrowUpRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" />
                )}
              </div>
              <h3 className="text-sm font-semibold text-white">{card.title}</h3>
              <p className="text-xs text-white/40 mt-1">{card.description}</p>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
