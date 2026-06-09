"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Save, RefreshCw, AlertTriangle, Globe, Building2,
  Palette, BarChart3, Database, Eye,
  CheckCircle, XCircle, Users,
  BrainCircuit, FileText, HelpCircle, MessageSquare,
  Zap, Activity, Star,
  Clock, Mail, Phone, MapPin,
  BookOpen, Target,
  ImageUp, Trash2, Link as LinkIcon
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Textarea } from "@/components/ui/input";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { SectionHeader } from "@/components/admin/shared/SectionHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface SiteData {
  services: any[];
  projects: any[];
  reviews: any[];
  faq: any[];
  skills: any[];
  whyChooseMe: any[];
  contacts: any[];
  company: Record<string, any> | null;
  settings: Record<string, string>;
}

export default function SiteManager() {
  const { data: session, status: sessionStatus } = useSession();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("company");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [siteData, setSiteData] = useState<SiteData | null>(null);
  const [settings, setSettings] = useState<Record<string, string>>({});

  const [companyForm, setCompanyForm] = useState({
    name: "", tagline: "", description: "", vision: "", mission: "",
    email: "", phone: "", address: "",
    linkedin: "", twitter: "", github: "",
  });
  const [heroForm, setHeroForm] = useState({
    hero_headline: "", hero_subtitle: "", hero_projects: "",
    hero_uptime: "", hero_support: "", meta_description: "", meta_keywords: "",
  });
  const [statsForm, setStatsForm] = useState({
    stats_projects: "", stats_clients: "", stats_years: "",
    stats_satisfaction: "", stats_support: "",
    company_policy: "", company_rules: "", company_commitment: "",
  });

  // Logo
  const [companyLogo, setCompanyLogo] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState(false);

  async function handleUploadLogo(file: File) {
    if (!file) return;
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const r = await fetch("/api/upload", { method: "POST", body: formData });
      const d = await r.json();
      if (d.success) {
        const url = d.data.url;
        setCompanyLogo(url);
        setLogoError(false);
        const updated = { ...companyForm, logo: url };
        setCompanyForm(updated);
        await fetch("/api/company", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ logo: url }),
        });
        showToast("success", "Logo uploaded successfully");
      } else {
        showToast("error", d.error || "Failed to upload");
      }
    } catch { showToast("error", "Network error"); }
    setUploadingLogo(false);
  }

  async function handleRemoveLogo() {
    setCompanyLogo("");
    const updated = { ...companyForm, logo: "" };
    setCompanyForm(updated);
    try {
      await fetch("/api/company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logo: "" }),
      });
      showToast("success", "Logo removed");
    } catch { showToast("error", "Network error"); }
  }

  useEffect(() => {
    if (sessionStatus === "authenticated") fetchAll();
  }, [sessionStatus]);

  async function fetchAll() {
    setLoading(true);
    setError(null);
    try {
      const [siteRes, settingsRes] = await Promise.all([
        fetch("/api/site-data"),
        fetch("/api/settings"),
      ]);
      if (!siteRes.ok || !settingsRes.ok) throw new Error("Network error");
      const siteJson = await siteRes.json();
      const settingsJson = await settingsRes.json();
      if (!siteJson.success) throw new Error(siteJson.error || "Failed to load");
      const data = siteJson.data;
      setSiteData(data);

      const settingsMap = settingsJson.success ? settingsJson.data : {};
      setSettings(settingsMap);

      if (data.company) {
        setCompanyForm({
          name: data.company.name || "",
          tagline: data.company.tagline || "",
          description: data.company.description || "",
          vision: data.company.vision || "",
          mission: data.company.mission || "",
          email: data.company.email || "",
          phone: data.company.phone || "",
          address: data.company.address || "",
          linkedin: data.company.linkedin || "",
          twitter: data.company.twitter || "",
          github: data.company.github || "",
        });
        if (data.company.logo) { setCompanyLogo(data.company.logo); setLogoError(false); }
      }

      setHeroForm({
        hero_headline: settingsMap.hero_headline || settingsMap.hero_heading || data.settings?.hero_headline || data.settings?.hero_heading || "",
        hero_subtitle: settingsMap.hero_subtitle || data.settings?.hero_subtitle || "",
        hero_projects: settingsMap.hero_projects || data.settings?.hero_projects || "",
        hero_uptime: settingsMap.hero_uptime || data.settings?.hero_uptime || "",
        hero_support: settingsMap.hero_support || data.settings?.hero_support || "",
        meta_description: settingsMap.meta_description || data.settings?.meta_description || "",
        meta_keywords: settingsMap.meta_keywords || data.settings?.meta_keywords || "",
      });

      setStatsForm({
        stats_projects: settingsMap.stats_projects || data.settings?.stats_projects || "",
        stats_clients: settingsMap.stats_clients || data.settings?.stats_clients || "",
        stats_years: settingsMap.stats_years || data.settings?.stats_years || "",
        stats_satisfaction: settingsMap.stats_satisfaction || data.settings?.stats_satisfaction || "",
        stats_support: settingsMap.stats_support || data.settings?.stats_support || "",
        company_policy: settingsMap.company_policy || data.settings?.company_policy || "",
        company_rules: settingsMap.company_rules || data.settings?.company_rules || "",
        company_commitment: settingsMap.company_commitment || data.settings?.company_commitment || "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    }
    setLoading(false);
  }

  async function saveCompany() {
    try {
      const r = await fetch("/api/company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(companyForm),
      });
      const d = await r.json();
      if (d.success) showToast("success", "Company info updated");
      else showToast("error", d.error || "Failed to save");
    } catch {
      showToast("error", "Network error while saving company info");
    }
  }

  async function saveSettings(data: Record<string, string>) {
    try {
      const r = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const d = await r.json();
      if (d.success) showToast("success", "Settings saved");
      else showToast("error", d.error || "Failed to save");
    } catch {
      showToast("error", "Network error");
    }
  }

  function saveHero() {
    saveSettings(heroForm);
  }

  function saveStats() {
    saveSettings({ ...statsForm, company_values: settings.company_values || "", why_choose: settings.why_choose || "" });
  }

  if (sessionStatus === "loading" || loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-16 w-72 rounded-xl bg-white/[0.02] animate-pulse" />
        <div className="flex gap-2 mb-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-28" />
          ))}
        </div>
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!session) return null;

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] p-6">
        <div className="text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/10 mx-auto mb-4">
            <AlertTriangle size={28} className="text-amber-400/70" />
          </div>
          <p className="text-white/60 text-sm mb-4">{error}</p>
          <Button onClick={fetchAll} variant="outline" size="sm" className="gap-2">
            <RefreshCw size={14} /> Retry
          </Button>
        </div>
      </div>
    );
  }

  const tabs = [
    { key: "company", label: "Company Info", icon: Building2 },
    { key: "hero", label: "Hero & Branding", icon: Palette },
    { key: "stats", label: "Stats & Values", icon: BarChart3 },
    { key: "database", label: "Database Records", icon: Database },
    { key: "preview", label: "Quick Preview", icon: Eye },
  ];

  const dbTables = [
    { label: "Services", key: "services", icon: Zap, href: "/admin/services", color: "text-neon-cyan" },
    { label: "Skills", key: "skills", icon: BrainCircuit, href: "/admin/skills", color: "text-purple-400" },
    { label: "Projects", key: "projects", icon: FileText, href: "/admin/projects", color: "text-neon-orange" },
    { label: "Reviews", key: "reviews", icon: MessageSquare, href: "/admin/reviews", color: "text-emerald-400" },
    { label: "FAQ", key: "faq", icon: HelpCircle, href: "/admin/faq", color: "text-amber-400" },
    { label: "Why Choose Me", key: "whyChooseMe", icon: Star, href: "/admin/why-choose-me", color: "text-pink-400" },
    { label: "Contacts", key: "contacts", icon: Mail, href: "/admin/contacts", color: "text-blue-400" },
  ];

  const pendingCount = siteData?.reviews?.filter((r: any) => !r.isApproved).length || 0;
  const activeServices = siteData?.services?.filter((s: any) => s.isActive !== false).length || 0;
  const featuredProjects = siteData?.projects?.filter((p: any) => p.featured).length || 0;

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Site Manager"
        description="Unified control panel — manage every piece of content on your public website"
      >
        <Badge variant="outline" className="gap-1.5 text-[10px]">
          <Globe size={10} /> Live Site
        </Badge>
      </PageHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.key} value={tab.key} className="gap-2 capitalize">
                <Icon size={14} />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Tab 1: Company Info */}
        <TabsContent value="company">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <GlassCard className="p-6">
              <SectionHeader
                title="Company Details"
                description="Basic information about your company"
                action={
                  <Button onClick={saveCompany} size="sm" className="h-9 text-xs gap-1.5">
                    <Save size={12} /> Save Company
                  </Button>
                }
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
                <div className="space-y-2">
                  <label className="text-xs text-white/50 block">Company Name</label>
                  <Input value={companyForm.name} onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-white/50 block">Tagline</label>
                  <Input value={companyForm.tagline} onChange={(e) => setCompanyForm({ ...companyForm, tagline: e.target.value })} />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs text-white/50 block">Description</label>
                  <Textarea value={companyForm.description} onChange={(e) => setCompanyForm({ ...companyForm, description: e.target.value })} rows={3} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-white/50 block">Vision</label>
                  <Textarea value={companyForm.vision} onChange={(e) => setCompanyForm({ ...companyForm, vision: e.target.value })} rows={3} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-white/50 block">Mission</label>
                  <Textarea value={companyForm.mission} onChange={(e) => setCompanyForm({ ...companyForm, mission: e.target.value })} rows={3} />
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6 mt-6">
              <SectionHeader
                title="Leadership Team"
                description="Manage founders and team members — names, roles, bios, photos, and social links"
                action={
                  <Link href="/admin/team">
                    <Button size="sm" className="h-9 text-xs gap-1.5">
                      <Users size={12} /> Manage Team
                    </Button>
                  </Link>
                }
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
                <div className="space-y-2">
                  <label className="text-xs text-white/50 block">Company Email</label>
                  <Input type="email" value={companyForm.email} onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-white/50 block">Company Phone</label>
                  <Input value={companyForm.phone} onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-white/50 block">Address</label>
                  <Input value={companyForm.address} onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-white/50 block">LinkedIn URL</label>
                  <Input value={companyForm.linkedin} onChange={(e) => setCompanyForm({ ...companyForm, linkedin: e.target.value })} placeholder="https://linkedin.com/in/..." />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-white/50 block">Twitter URL</label>
                  <Input value={companyForm.twitter} onChange={(e) => setCompanyForm({ ...companyForm, twitter: e.target.value })} placeholder="https://twitter.com/..." />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-white/50 block">GitHub URL</label>
                  <Input value={companyForm.github} onChange={(e) => setCompanyForm({ ...companyForm, github: e.target.value })} placeholder="https://github.com/..." />
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6 mt-6">
              <div className="flex items-center gap-3 pb-4 border-b border-white/[0.04] mb-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.04]">
                  <ImageUp size={16} className="text-neon-cyan" />
                </div>
                <div>
                  <h3 className="font-heading text-base font-bold">Site Logo</h3>
                  <p className="text-xs text-white/30">Upload your brand logo (shown in navbar)</p>
                </div>
              </div>
              <div className="flex items-start gap-6">
                <div className="w-24 h-24 rounded-2xl border border-white/[0.06] bg-white/[0.02] flex items-center justify-center overflow-hidden shrink-0">
                  {companyLogo && !logoError ? (
                    <Image src={companyLogo} alt="Logo" width={96} height={96} className="w-full h-full object-contain p-2" onError={() => setLogoError(true)} />
                  ) : (
                    <ImageUp size={28} className="text-white/20" />
                  )}
                </div>
                <div className="space-y-3 flex-1">
                  <label className="relative inline-flex cursor-pointer items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white/70 hover:bg-white/[0.06] transition-all duration-300">
                    <ImageUp size={14} />
                    {uploadingLogo ? "Uploading..." : "Choose Image"}
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadLogo(file);
                      }}
                      disabled={uploadingLogo}
                    />
                  </label>
                  {companyLogo && (
                    <button
                      onClick={handleRemoveLogo}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 hover:bg-red-500/20 transition-all duration-300"
                    >
                      <Trash2 size={14} /> Remove Logo
                    </button>
                  )}
                  {companyLogo && (
                    <p className="text-[10px] text-white/20 flex items-center gap-1">
                      <LinkIcon size={10} /> {companyLogo}
                    </p>
                  )}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </TabsContent>

        {/* Tab 2: Hero & Branding */}
        <TabsContent value="hero">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <GlassCard className="p-6">
              <SectionHeader
                title="Hero Section"
                description="Homepage hero banner content"
                action={
                  <Button onClick={saveHero} size="sm" className="h-9 text-xs gap-1.5">
                    <Save size={12} /> Save Hero
                  </Button>
                }
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs text-white/50 block">Hero Heading</label>
                  <Input value={heroForm.hero_headline} onChange={(e) => setHeroForm({ ...heroForm, hero_headline: e.target.value })} />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs text-white/50 block">Hero Subtitle</label>
                  <Input value={heroForm.hero_subtitle} onChange={(e) => setHeroForm({ ...heroForm, hero_subtitle: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-white/50 block">Hero Projects Count</label>
                  <Input value={heroForm.hero_projects} onChange={(e) => setHeroForm({ ...heroForm, hero_projects: e.target.value })} placeholder="e.g. 50+" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-white/50 block">Hero Uptime %</label>
                  <Input value={heroForm.hero_uptime} onChange={(e) => setHeroForm({ ...heroForm, hero_uptime: e.target.value })} placeholder="e.g. 99.9%" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-white/50 block">Hero Support Label</label>
                  <Input value={heroForm.hero_support} onChange={(e) => setHeroForm({ ...heroForm, hero_support: e.target.value })} placeholder="e.g. 24/7 Support" />
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6 mt-6">
              <SectionHeader title="SEO & Meta" description="Search engine optimization settings" />
              <div className="grid grid-cols-1 gap-5 mt-6">
                <div className="space-y-2">
                  <label className="text-xs text-white/50 block">Meta Description</label>
                  <Textarea value={heroForm.meta_description} onChange={(e) => setHeroForm({ ...heroForm, meta_description: e.target.value })} rows={3} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-white/50 block">Meta Keywords</label>
                  <Input value={heroForm.meta_keywords} onChange={(e) => setHeroForm({ ...heroForm, meta_keywords: e.target.value })} placeholder="comma, separated, keywords" />
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </TabsContent>

        {/* Tab 3: Stats & Values */}
        <TabsContent value="stats">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <GlassCard className="p-6">
              <SectionHeader
                title="Statistics"
                description="Numbers displayed on the homepage stats section"
                action={
                  <Button onClick={saveStats} size="sm" className="h-9 text-xs gap-1.5">
                    <Save size={12} /> Save Stats
                  </Button>
                }
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
                <div className="space-y-2">
                  <label className="text-xs text-white/50 block">Projects Count</label>
                  <Input value={statsForm.stats_projects} onChange={(e) => setStatsForm({ ...statsForm, stats_projects: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-white/50 block">Clients Count</label>
                  <Input value={statsForm.stats_clients} onChange={(e) => setStatsForm({ ...statsForm, stats_clients: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-white/50 block">Years Experience</label>
                  <Input value={statsForm.stats_years} onChange={(e) => setStatsForm({ ...statsForm, stats_years: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-white/50 block">Satisfaction %</label>
                  <Input value={statsForm.stats_satisfaction} onChange={(e) => setStatsForm({ ...statsForm, stats_satisfaction: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-white/50 block">Support Rating</label>
                  <Input value={statsForm.stats_support} onChange={(e) => setStatsForm({ ...statsForm, stats_support: e.target.value })} />
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6 mt-6">
              <SectionHeader title="Company Values & Policies" description="Core values, rules, and commitments" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
                <div className="space-y-2">
                  <label className="text-xs text-white/50 block">Company Values (comma-separated)</label>
                  <Textarea value={settings.company_values || ""} onChange={(e) => setSettings({ ...settings, company_values: e.target.value })} rows={3} placeholder="Innovation, Integrity, Excellence..." />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-white/50 block">Why Choose (comma-separated)</label>
                  <Textarea value={settings.why_choose || ""} onChange={(e) => setSettings({ ...settings, why_choose: e.target.value })} rows={3} placeholder="Fast delivery, Affordable pricing..." />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-white/50 block">Company Policy</label>
                  <Textarea value={statsForm.company_policy} onChange={(e) => setStatsForm({ ...statsForm, company_policy: e.target.value })} rows={4} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-white/50 block">Company Rules</label>
                  <Textarea value={statsForm.company_rules} onChange={(e) => setStatsForm({ ...statsForm, company_rules: e.target.value })} rows={4} />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs text-white/50 block">Company Commitment</label>
                  <Textarea value={statsForm.company_commitment} onChange={(e) => setStatsForm({ ...statsForm, company_commitment: e.target.value })} rows={4} />
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </TabsContent>

        {/* Tab 4: Database Records */}
        <TabsContent value="database">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <GlassCard className="p-6">
              <SectionHeader
                title="All Database Records"
                description="Overview of every content type in the system with quick access links"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                {dbTables.map((table, i) => {
                  const count = siteData?.[table.key as keyof SiteData]
                    ? (Array.isArray(siteData[table.key as keyof SiteData])
                      ? (siteData[table.key as keyof SiteData] as any[]).length
                      : 0)
                    : 0;
                  const isPending = table.key === "reviews" && pendingCount > 0;
                  return (
                    <motion.div
                      key={table.key}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.3 }}
                      className="group relative overflow-hidden rounded-2xl border border-white/[0.04] bg-white/[0.02] p-5 transition-all duration-300 hover:border-white/[0.08] hover:bg-white/[0.03]"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.04] bg-white/[0.03]")}>
                          <table.icon size={18} className={table.color} />
                        </div>
                        {isPending && (
                          <Badge variant="destructive" className="text-[10px] gap-1">
                            <AlertTriangle size={10} /> {pendingCount} pending
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/30">{table.label}</p>
                      <p className="mt-1.5 font-heading text-2xl font-bold tracking-tight text-white">{count}</p>
                      <div className="mt-3 flex items-center gap-2.5">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          count > 0 ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.4)]" : "bg-white/20"
                        )} />
                        <span className="text-[11px] text-white/25">{count > 0 ? `${count} record${count !== 1 ? "s" : ""}` : "No records"}</span>
                        <Link
                          href={table.href}
                          className="ml-auto text-[11px] text-neon-cyan hover:text-neon-cyan/80 transition-colors font-medium"
                        >
                          Manage &rarr;
                        </Link>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </GlassCard>
          </motion.div>
        </TabsContent>

        {/* Tab 5: Quick Preview */}
        <TabsContent value="preview">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >
            <GlassCard className="p-6">
              <SectionHeader
                title="Hero Preview"
                description="How your homepage hero section appears with current settings"
              />
              <div className="mt-6 rounded-2xl border border-white/[0.04] bg-gradient-to-br from-neon-orange/[0.03] to-neon-cyan/[0.03] p-8 text-center">
                <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight text-white">
                  {heroForm.hero_headline || "Your Hero Heading"}
                </h2>
                <p className="mt-3 text-sm text-white/40 max-w-2xl mx-auto">
                  {heroForm.hero_subtitle || "Your hero subtitle will appear here"}
                </p>
                <div className="mt-6 flex items-center justify-center gap-8 flex-wrap">
                  <div className="text-center">
                    <p className="font-heading text-2xl font-bold text-neon-cyan">{heroForm.hero_projects || "—"}</p>
                    <p className="text-[11px] text-white/30 mt-0.5">Projects</p>
                  </div>
                  <div className="text-center">
                    <p className="font-heading text-2xl font-bold text-neon-orange">{heroForm.hero_uptime || "—"}</p>
                    <p className="text-[11px] text-white/30 mt-0.5">Uptime</p>
                  </div>
                  <div className="text-center">
                    <p className="font-heading text-2xl font-bold text-emerald-400">{heroForm.hero_support || "—"}</p>
                    <p className="text-[11px] text-white/30 mt-0.5">Support</p>
                  </div>
                </div>
              </div>
            </GlassCard>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <GlassCard className="p-6">
                <SectionHeader title="Company Info" description={siteData?.company?.name || "No company name set"} />
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Building2 size={15} className="text-neon-cyan" />
                    <span className="text-white/50">{siteData?.company?.tagline || "No tagline"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Mail size={15} className="text-neon-cyan" />
                    <span className="text-white/50">{siteData?.company?.email || "No email"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Phone size={15} className="text-neon-cyan" />
                    <span className="text-white/50">{siteData?.company?.phone || "No phone"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin size={15} className="text-neon-cyan" />
                    <span className="text-white/50">{siteData?.company?.address || "No address"}</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <BookOpen size={15} className="text-neon-orange mt-0.5" />
                    <div>
                      <p className="text-[11px] text-white/30 font-medium uppercase tracking-wider mb-1">Vision</p>
                      <p className="text-white/50">{siteData?.company?.vision || "No vision set"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <Target size={15} className="text-neon-orange mt-0.5" />
                    <div>
                      <p className="text-[11px] text-white/30 font-medium uppercase tracking-wider mb-1">Mission</p>
                      <p className="text-white/50">{siteData?.company?.mission || "No mission set"}</p>
                    </div>
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <SectionHeader title="Content Overview" description="Summary of all active content" />
                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                      <Zap size={15} className="text-neon-cyan" />
                      <span className="text-sm text-white/60">Active Services</span>
                    </div>
                    <span className="font-heading text-lg font-bold text-white">{activeServices}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                      <FileText size={15} className="text-neon-orange" />
                      <span className="text-sm text-white/60">Featured Projects</span>
                    </div>
                    <span className="font-heading text-lg font-bold text-white">{featuredProjects}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                      <Star size={15} className="text-amber-400" />
                      <span className="text-sm text-white/60">Approved Reviews</span>
                    </div>
                    <span className="font-heading text-lg font-bold text-white">
                      {siteData?.reviews?.filter((r: any) => r.isApproved).length || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                      <HelpCircle size={15} className="text-purple-400" />
                      <span className="text-sm text-white/60">FAQ Items</span>
                    </div>
                    <span className="font-heading text-lg font-bold text-white">{siteData?.faq?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                      <MessageSquare size={15} className="text-emerald-400" />
                      <span className="text-sm text-white/60">Total Reviews</span>
                    </div>
                    <span className="font-heading text-lg font-bold text-white">{siteData?.reviews?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                      <Activity size={15} className="text-blue-400" />
                      <span className="text-sm text-white/60">Skills</span>
                    </div>
                    <span className="font-heading text-lg font-bold text-white">{siteData?.skills?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                      <Users size={15} className="text-pink-400" />
                      <span className="text-sm text-white/60">Why Choose Items</span>
                    </div>
                    <span className="font-heading text-lg font-bold text-white">{siteData?.whyChooseMe?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                      <Mail size={15} className="text-cyan-400" />
                      <span className="text-sm text-white/60">Contacts</span>
                    </div>
                    <span className="font-heading text-lg font-bold text-white">{siteData?.contacts?.length || 0}</span>
                  </div>
                </div>
              </GlassCard>
            </div>

            <GlassCard className="p-6">
              <SectionHeader title="Review Approval Stats" description="Overview of review moderation status" />
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-xl bg-emerald-500/[0.04] border border-emerald-500/10 p-5 text-center">
                  <CheckCircle size={24} className="text-emerald-400 mx-auto mb-2" />
                  <p className="font-heading text-2xl font-bold text-emerald-400">
                    {siteData?.reviews?.filter((r: any) => r.isApproved).length || 0}
                  </p>
                  <p className="text-xs text-white/30 mt-1">Approved</p>
                </div>
                <div className="rounded-xl bg-amber-500/[0.04] border border-amber-500/10 p-5 text-center">
                  <Clock size={24} className="text-amber-400 mx-auto mb-2" />
                  <p className="font-heading text-2xl font-bold text-amber-400">{pendingCount}</p>
                  <p className="text-xs text-white/30 mt-1">Pending Approval</p>
                </div>
                <div className="rounded-xl bg-red-500/[0.04] border border-red-500/10 p-5 text-center">
                  <XCircle size={24} className="text-red-400 mx-auto mb-2" />
                  <p className="font-heading text-2xl font-bold text-red-400">
                    {siteData?.reviews?.filter((r: any) => !r.isApproved && !r.isSpam).length || 0}
                  </p>
                  <p className="text-xs text-white/30 mt-1">Unapproved</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
