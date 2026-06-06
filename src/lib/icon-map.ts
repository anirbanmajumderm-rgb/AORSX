import {
  Brain, Code2, Zap, Palette, Cloud, Server, MessageSquare, Link2,
  Globe, MessageCircle, GitMerge, BarChart3, Smartphone, Shield,
  TrendingUp, Lightbulb, type LucideIcon,
} from "lucide-react";

const rawMap: Record<string, LucideIcon> = {
  brain: Brain,
  code2: Code2, code: Code2,
  zap: Zap,
  palette: Palette,
  cloud: Cloud,
  server: Server,
  "message-square": MessageSquare, messagesquare: MessageSquare,
  link2: Link2, "git-merge": GitMerge, gitmerge: GitMerge,
  globe: Globe,
  "message-circle": MessageCircle, messagecircle: MessageCircle,
  "bar-chart": BarChart3, barchart: BarChart3, bar_chart: BarChart3,
  smartphone: Smartphone, "smart-phone": Smartphone,
  shield: Shield,
  "trending-up": TrendingUp, trendingup: TrendingUp, trending_up: TrendingUp,
  lightbulb: Lightbulb, "light-bulb": Lightbulb,
};

const iconMap: Record<string, LucideIcon> = {};
for (const [k, v] of Object.entries(rawMap)) {
  iconMap[k] = v;
  iconMap[k.replace(/[\s_-]/g, "").toLowerCase()] = v;
}

export function getIcon(name: string | null | undefined): LucideIcon {
  if (!name) return Code2;
  const key = name.replace(/[\s_-]/g, "").toLowerCase();
  return iconMap[key] || iconMap[name] || Code2;
}
