"use client";

import { memo } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, AreaChart, Area, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { cn } from "@/lib/utils";

interface ChartWidgetProps {
  type: "bar" | "line" | "area" | "pie";
  data: any[];
  bars?: { key: string; color: string }[];
  lines?: { key: string; color: string }[];
  areas?: { key: string; color: string }[];
  pieData?: { name: string; value: number; color: string }[];
  height?: number;
  className?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0a0a0a]/95 backdrop-blur-xl px-3.5 py-2.5 shadow-xl">
      <p className="text-[11px] text-white/40 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-sm font-bold" style={{ color: p.color || p.fill }}>
          {p.name || p.dataKey}: {p.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
};

const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0a0a0a]/95 backdrop-blur-xl px-3.5 py-2.5 shadow-xl">
      <p className="text-sm font-bold" style={{ color: payload[0].payload.color }}>
        {payload[0].name}: {payload[0].value.toLocaleString()}
      </p>
    </div>
  );
};

const ChartWidget = memo(function ChartWidget({ type, data, bars, lines, areas, pieData, height = 280, className }: ChartWidgetProps) {
  const commonProps = {
    tick: { fontSize: 10, fill: "rgba(255,255,255,0.25)" },
    axisLine: false,
    tickLine: false,
  };

  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        {type === "bar" ? (
          <BarChart data={data} barSize={20} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
            <XAxis dataKey="name" {...commonProps} />
            <YAxis {...commonProps} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
            {(bars || [{ key: "value", color: "#00e5ff" }]).map((b) => (
              <Bar key={b.key} dataKey={b.key} fill={b.color} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        ) : type === "line" ? (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
            <XAxis dataKey="name" {...commonProps} />
            <YAxis {...commonProps} />
            <Tooltip content={<CustomTooltip />} />
            {(lines || [{ key: "value", color: "#00e5ff" }]).map((l) => (
              <Line key={l.key} type="monotone" dataKey={l.key} stroke={l.color} strokeWidth={2} dot={false} activeDot={{ r: 4, fill: l.color }} />
            ))}
          </LineChart>
        ) : type === "area" ? (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
            <XAxis dataKey="name" {...commonProps} />
            <YAxis {...commonProps} />
            <Tooltip content={<CustomTooltip />} />
            {(areas || [{ key: "value", color: "#00e5ff" }]).map((a) => (
              <Area key={a.key} type="monotone" dataKey={a.key} stroke={a.color} fill={a.color} fillOpacity={0.08} strokeWidth={2} />
            ))}
          </AreaChart>
        ) : (
          <PieChart>
            <Pie data={pieData || []} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value">
              {(pieData || []).map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<PieTooltip />} />
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  );
});

ChartWidget.displayName = "ChartWidget";

export { ChartWidget };
