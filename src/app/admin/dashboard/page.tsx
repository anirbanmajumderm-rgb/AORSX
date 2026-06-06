"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, MessageSquare, HelpCircle, Eye, Activity, Bell, TrendingUp, Building2, Edit3, Check, X } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from "recharts";
import { cn } from "@/lib/utils";

interface DashboardData {
  totalUsers: number;
  newUsersThisMonth: number;
  totalChatSessions: number;
  unansweredQuestions: number;
  totalPageViews: number;
  uniqueVisitors: number;
  dailyPageViews: { date: string; count: number }[];
  interactions: { type: string; count: number }[];
  recentActivity: { id: number; action: string; detail: string; type: string; time: string }[];
  totalInteractions: number;
  openSupportTickets: number;
  unreadNotifications: number;
  activeFeatures: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0a0a0a]/95 backdrop-blur-xl px-4 py-3 shadow-2xl">
      <p className="text-xs text-white/40 mb-2">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm font-medium" style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [dashRes, analyticsRes, companyRes] = await Promise.all([
          fetch("/api/admin/dashboard"),
          fetch("/api/admin/analytics"),
          fetch("/api/company"),
        ]);
        const dashData = await dashRes.json();
        const analyticsData = await analyticsRes.json();
        if (dashData.success) setData(dashData.data || dashData);
        if (analyticsData.success) setAnalytics(analyticsData.data || analyticsData);
        const companyData = await companyRes.json();
        if (companyData.success) {
          setCompanyName(companyData.data?.name || "");
        }
      } catch (err) {
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  async function handleSaveCompanyName() {
    const trimmed = editValue.trim();
    if (!trimmed || trimmed === companyName) { setEditing(false); return; }
    setSavingName(true);
    try {
      const r = await fetch("/api/company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const d = await r.json();
      if (d.success) {
        setCompanyName(trimmed);
        setEditing(false);
      }
    } catch {}
    setSavingName(false);
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-white/5 rounded-lg" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-28 bg-white/5 rounded-2xl" />
            ))}
          </div>
          <div className="h-80 bg-white/5 rounded-2xl" />
          <div className="h-80 bg-white/5 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
          <p className="text-red-400">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 rounded-xl bg-white/5 text-white/70 hover:bg-white/10 transition-colors text-sm">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const stats = [
    { label: "Total Users", value: data?.totalUsers ?? 0, icon: Users, color: "from-neon-orange/20 to-neon-orange/5", textColor: "text-neon-orange" },
    { label: "New This Month", value: data?.newUsersThisMonth ?? 0, icon: TrendingUp, color: "from-neon-cyan/20 to-neon-cyan/5", textColor: "text-neon-cyan" },
    { label: "AI Chat Sessions", value: data?.totalChatSessions ?? 0, icon: MessageSquare, color: "from-purple-500/20 to-purple-500/5", textColor: "text-purple-400" },
    { label: "Unanswered Questions", value: data?.unansweredQuestions ?? 0, icon: HelpCircle, color: "from-orange-500/20 to-orange-500/5", textColor: "text-orange-400" },
    { label: "Total Page Views", value: data?.totalPageViews ?? 0, icon: Eye, color: "from-green-500/20 to-green-500/5", textColor: "text-green-400" },
    { label: "Unique Visitors", value: data?.uniqueVisitors ?? 0, icon: Activity, color: "from-blue-500/20 to-blue-500/5", textColor: "text-blue-400" },
    { label: "Total Interactions", value: data?.totalInteractions ?? 0, icon: MessageSquare, color: "from-pink-500/20 to-pink-500/5", textColor: "text-pink-400" },
    { label: "Open Support Tickets", value: data?.openSupportTickets ?? 0, icon: HelpCircle, color: "from-red-500/20 to-red-500/5", textColor: "text-red-400" },
  ];

  const dailyViews = data?.dailyPageViews ?? analytics?.dailyPageViews ?? [];
  const interactions = analytics?.interactions ?? data?.interactions ?? [];
  const interactionTypes = [...new Set(interactions.map((i: any) => i.type))] as string[];
  const interactionChartData = dailyViews.map((day: any) => {
    const entry: any = { date: day.date };
    for (const type of interactionTypes) {
      const match = interactions.find((i: any) => i.date === day.date && i.type === type);
      entry[type] = match ? match.count : 0;
    }
    return entry;
  });

  const colors = ["#00E5FF", "#FF6B00", "#A855F7", "#22C55E", "#F59E0B", "#EF4444"];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-heading">Dashboard</h1>
          <p className="text-sm text-white/40 mt-1">Real-time overview of your site</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/[0.04]">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-white/50">Live</span>
          </div>
        </div>
      </div>

      {/* Company Name Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-neon-orange/20 to-neon-cyan/20 border border-white/[0.04]">
              <Building2 size={18} className="text-neon-cyan" />
            </div>
            <div>
              <p className="text-xs text-white/40 font-medium">Company Name</p>
              {editing ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="h-9 px-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm text-white outline-none focus:border-neon-cyan/40 w-40 sm:w-64"
                    autoFocus
                    onKeyDown={(e) => { if (e.key === "Enter") handleSaveCompanyName(); if (e.key === "Escape") { setEditing(false); setEditValue(companyName); } }}
                  />
                  <button onClick={handleSaveCompanyName} disabled={savingName} className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors">
                    {savingName ? <span className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" /> : <Check size={14} />}
                  </button>
                  <button onClick={() => { setEditing(false); setEditValue(companyName); }} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] text-white/40 hover:text-white/70 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-0.5">
                  <h2 className="text-lg font-bold font-heading text-white">{companyName || "Not set"}</h2>
                  <button onClick={() => { setEditValue(companyName); setEditing(true); }} className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.04] text-white/30 hover:text-neon-cyan hover:bg-neon-cyan/10 transition-all">
                    <Edit3 size={12} />
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-white/20">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
            Appears site-wide
          </div>
        </div>
      </motion.div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            className="relative group"
          >
            <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative rounded-2xl bg-white/[0.02] border border-white/[0.04] p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={cn("p-2.5 rounded-xl bg-gradient-to-br", stat.color)}>
                  <stat.icon className={cn("w-4 h-4", stat.textColor)} />
                </div>
              </div>
              <p className="text-2xl font-bold font-heading">{stat.value.toLocaleString()}</p>
              <p className="text-xs text-white/40 mt-1">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Page Views */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-6"
        >
          <h3 className="text-sm font-semibold text-white/70 mb-1">Daily Page Views</h3>
          <p className="text-xs text-white/30 mb-6">Last 30 days</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyViews}>
                <defs>
                  <linearGradient id="pageViewsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00E5FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }} tickFormatter={(v) => v?.slice(5) || ""} />
                <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="count" stroke="#00E5FF" fill="url(#pageViewsGradient)" strokeWidth={2} name="Views" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Interactions Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-6"
        >
          <h3 className="text-sm font-semibold text-white/70 mb-1">User Interactions</h3>
          <p className="text-xs text-white/30 mb-6">Per day by type</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={interactionChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }} tickFormatter={(v) => v?.slice(5) || ""} />
                <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }} />
                <Tooltip content={<CustomTooltip />} />
                {interactionTypes.map((type: string, i: number) => (
                  <Bar key={type} dataKey={type} stackId="a" fill={colors[i % colors.length]} name={type} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-6"
        >
          <h3 className="text-sm font-semibold text-white/70 mb-4">Recent Activity</h3>
          <div className="space-y-2">
            {(data?.recentActivity ?? []).slice(0, 8).map((activity) => (
              <div key={activity.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.02] transition-colors">
                <div className={cn(
                  "w-2 h-2 rounded-full shrink-0",
                  activity.type === "error" ? "bg-red-400" : activity.type === "warning" ? "bg-orange-400" : "bg-neon-cyan"
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/70 truncate">{activity.action}</p>
                  {activity.detail && <p className="text-xs text-white/30 truncate">{activity.detail}</p>}
                </div>
                <span className="text-[10px] text-white/20 shrink-0">
                  {new Date(activity.time).toLocaleDateString()}
                </span>
              </div>
            ))}
            {(data?.recentActivity ?? []).length === 0 && (
              <p className="text-sm text-white/30 text-center py-8">No recent activity</p>
            )}
          </div>
        </motion.div>

        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-4"
        >
          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-6">
            <h3 className="text-sm font-semibold text-white/70 mb-4">Quick Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.04] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Bell className="w-3.5 h-3.5 text-neon-cyan" />
                  <span className="text-xs text-white/40">Unread Notifications</span>
                </div>
                <p className="text-xl font-bold font-heading">{data?.unreadNotifications ?? 0}</p>
              </div>
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.04] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-3.5 h-3.5 text-neon-orange" />
                  <span className="text-xs text-white/40">Active Features</span>
                </div>
                <p className="text-xl font-bold font-heading">{data?.activeFeatures ?? 0}</p>
              </div>
            </div>
          </div>

          {/* Interaction Types Breakdown */}
          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-6">
            <h3 className="text-sm font-semibold text-white/70 mb-4">Interaction Types</h3>
            <div className="space-y-3">
              {interactionTypes.map((type: string, i: number) => {
                const total = interactions.filter((int: any) => int.type === type).reduce((sum: number, int: any) => sum + int.count, 0);
                return (
                  <div key={type} className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
                    <span className="text-sm text-white/60 capitalize flex-1">{type}</span>
                    <span className="text-sm font-medium text-white/80">{total}</span>
                  </div>
                );
              })}
              {interactionTypes.length === 0 && (
                <p className="text-sm text-white/30 text-center py-4">No interactions recorded yet</p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
