"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { motion } from "framer-motion";

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

interface ChartProps {
  dailyViews: { date: string; count: number }[];
  interactionChartData: any[];
  interactionTypes: string[];
}

export function Charts({ dailyViews, interactionChartData, interactionTypes }: ChartProps) {
  const colors = ["#00E5FF", "#FF6B00", "#A855F7", "#22C55E", "#F59E0B", "#EF4444"];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
  );
}
