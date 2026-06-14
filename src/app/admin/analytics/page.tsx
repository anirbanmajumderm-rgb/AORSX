"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp, Users, MessageSquare, Eye, Calendar,
  ArrowUpRight, ArrowDownRight, Download, Globe
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { StatCardGrid } from "@/components/admin/shared/StatCardGrid";
import { ChartWidget } from "@/components/admin/dashboard/ChartWidget";
import { cn } from "@/lib/utils";

export default function AdminAnalytics() {
  const { showToast } = useToast();
  const [data, setData] = useState<any>(null);
  const [period, setPeriod] = useState("month");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/analytics/detailed?period=${period}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          setData(json.data);
        } else {
          showToast("error", json.error || "Failed to load analytics");
        }
      })
      .catch(() => {
        showToast("error", "Failed to load analytics data");
      })
      .finally(() => setLoading(false));
  }, [period]);

  const periods = [
    { key: "week", label: "Week" },
    { key: "month", label: "Month" },
    { key: "year", label: "Year" },
  ];

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-16 w-64 rounded-xl bg-white/[0.02] animate-pulse shimmer-overlay" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-white/[0.02] animate-pulse shimmer-overlay" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-72 rounded-2xl bg-white/[0.02] animate-pulse shimmer-overlay" />
          ))}
        </div>
        <div className="h-64 rounded-2xl bg-white/[0.02] animate-pulse shimmer-overlay" />
      </div>
    );
  }

  const statCards = [
    { title: "Total Projects", value: data?.totalProjects ?? 0, icon: TrendingUp, variant: "orange" as const, description: "All portfolio projects" },
    { title: "Active Services", value: data?.totalServices ?? 0, icon: Users, variant: "cyan" as const, description: "Services currently live" },
    { title: "Total Reviews", value: data?.totalReviews ?? 0, icon: MessageSquare, variant: "purple" as const, description: "User reviews received" },
    { title: "Pending Reviews", value: data?.pendingReviews ?? 0, icon: Eye, variant: "pink" as const, description: "Awaiting moderation" },
  ];

  const breakdownItems = [
    { label: "Skills", value: data?.totalSkills ?? 0, color: "bg-neon-cyan", percent: Math.min(((data?.totalSkills ?? 0) / 25) * 100, 100) },
    { label: "Questions", value: data?.totalQuestions ?? 0, color: "bg-neon-orange", percent: Math.min(((data?.totalQuestions ?? 0) / 300) * 100, 100) },
    { label: "Contacts", value: data?.totalContacts ?? 0, color: "bg-purple-500", percent: Math.min(((data?.totalContacts ?? 0) / 60) * 100, 100) },
    { label: "Unanswered", value: data?.pendingQuestions ?? 0, color: "bg-amber-500", percent: Math.min(((data?.pendingQuestions ?? 0) / Math.max(data?.totalQuestions ?? 1, 1)) * 100, 100) },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Analytics" description="Track performance metrics and user engagement">
        <div className="flex items-center gap-2">
          {periods.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize",
                period === p.key
                  ? "bg-white/[0.06] text-white border border-white/[0.08]"
                  : "text-white/30 hover:text-white hover:bg-white/[0.03] border border-transparent"
              )}
            >
              {p.label}
            </button>
          ))}
          <div className="w-px h-6 bg-white/[0.04] mx-1" />
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => {
              const csv = [
                ["Metric", "Value"].join(","),
                ...statCards.map((s) => [s.title, s.value].join(",")),
                "",
                "Breakdown",
                ...breakdownItems.map((b) => [b.label, b.value].join(",")),
              ].join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `analytics-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download size={12} /> Export
          </Button>
        </div>
      </PageHeader>

      <StatCardGrid stats={statCards} columns={4} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-heading text-base font-bold">Visitors Overview</h3>
              <p className="text-xs text-white/30">Visitors vs Pageviews</p>
            </div>
            <Badge variant="cyan" className="text-[10px]">Last 12 months</Badge>
          </div>
          <ChartWidget
            type="bar"
            data={data?.monthlyData || []}
            bars={[
              { key: "visitors", color: "#00e5ff" },
              { key: "pageviews", color: "#ff6b00" },
            ]}
            height={290}
          />
        </div>

        <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-heading text-base font-bold">User Interactions</h3>
              <p className="text-xs text-white/30">Interaction trend over time</p>
            </div>
            <Badge variant="cyan" className="text-[10px]">Trend</Badge>
          </div>
          <ChartWidget
            type="line"
            data={data?.monthlyData || []}
            lines={[
              { key: "interactions", color: "#a855f7" },
            ]}
            height={290}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-white/[0.04] bg-white/[0.02] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-heading text-base font-bold">Top Pages</h3>
              <p className="text-xs text-white/30">Pages ranked by traffic volume</p>
            </div>
            <Badge variant="default" className="text-[10px]">By traffic</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  {["Page", "Views", "Change", ""].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-[10px] font-medium uppercase tracking-wider text-white/20">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data?.topPages || []).map((page: any, i: number) => (
                  <tr key={i} className="border-b border-white/[0.02] hover:bg-white/[0.01] transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Globe size={12} className="text-white/20 shrink-0" />
                        <code className="text-xs text-white/60 font-mono">{page.path}</code>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-white/80 font-medium">{(page.views || 0).toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className={cn("inline-flex items-center gap-1 text-xs font-medium", (page.change || 0) >= 0 ? "text-emerald-400" : "text-red-400")}>
                        {(page.change || 0) >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        {Math.abs(page.change || 0)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button variant="ghost" size="sm" className="h-7 text-[10px] text-white/30">View</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-heading text-base font-bold">Data Breakdown</h3>
              <p className="text-xs text-white/30">Content distribution overview</p>
            </div>
            <Calendar size={14} className="text-white/20" />
          </div>
          <div className="space-y-5">
            {breakdownItems.map((item) => (
              <div key={item.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/60">{item.label}</span>
                  <span className="text-white/80 font-medium">{item.value.toLocaleString()}</span>
                </div>
                <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all duration-700", item.color)} style={{ width: `${item.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
