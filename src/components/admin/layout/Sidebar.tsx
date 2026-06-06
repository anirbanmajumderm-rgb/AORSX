"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard, FileText, Users, HelpCircle, BrainCircuit,
  UserCog, Shield, Bell, ToggleLeft, Settings, Sparkles,
  LogOut, ChevronLeft, Menu, X, ChevronDown, Briefcase,
  MessageSquare, BookOpen, DollarSign
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: string;
  children?: NavItem[];
}

const navSections: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [
      { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/content", label: "Site Content", icon: FileText },
      { href: "/admin/projects", label: "Projects", icon: Briefcase },
      { href: "/admin/team", label: "Team & Founders", icon: Users },
      { href: "/admin/faq", label: "FAQ & Questions", icon: HelpCircle },
    ],
  },
  {
    label: "AI Assistant",
    items: [
      { href: "/admin/ai", label: "AI Control Center", icon: BrainCircuit },
      { href: "/admin/ai/inquiries", label: "Client Inquiries", icon: MessageSquare },
      { href: "/admin/ai/knowledge", label: "Knowledge Base", icon: BookOpen },
      { href: "/admin/ai/packages", label: "Packages & Pricing", icon: DollarSign },
      { href: "/admin/ai/policies", label: "Policies", icon: FileText },
      { href: "/admin/ai-training", label: "AI Settings", icon: Settings },
    ],
  },
  {
    label: "Management",
    items: [
      { href: "/admin/users", label: "Users", icon: UserCog },
      { href: "/admin/roles", label: "Roles & Permissions", icon: Shield },
      { href: "/admin/features", label: "Feature Flags", icon: ToggleLeft },
      { href: "/admin/notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

function NavItemComponent({ item, collapsed, depth = 0, onNavigate }: { item: NavItem; collapsed: boolean; depth?: number; onNavigate: () => void }) {
  const pathname = usePathname();
  const isActive = pathname === item.href || (depth === 0 && item.children ? pathname.startsWith(item.href + "/") : false);
  const isExactActive = pathname === item.href || (item.children?.some(c => pathname === c.href));
  const [expanded, setExpanded] = useState(isActive);
  const hasChildren = item.children && item.children.length > 0;

  const badge = item.badge;

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
            isExactActive
              ? "bg-gradient-to-r from-neon-orange/10 to-neon-cyan/10 text-white"
              : "text-white/40 hover:text-white/80 hover:bg-white/[0.03]",
          )}
        >
          {isExactActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-gradient-to-b from-neon-orange to-neon-cyan shadow-[0_0_8px_rgba(0,229,255,0.3)]" />
          )}
          <div className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200",
            isExactActive
              ? "bg-gradient-to-br from-neon-orange/20 to-neon-cyan/20"
              : "bg-white/[0.03] group-hover:bg-white/[0.06]",
          )}>
            <item.icon size={16} className={cn(
              "transition-colors duration-200",
              isExactActive ? "text-neon-cyan" : "text-white/40 group-hover:text-white/70"
            )} />
          </div>
          {!collapsed && (
            <>
              <span className="flex-1 text-left">{item.label}</span>
              <ChevronDown size={14} className={cn(
                "text-white/20 transition-transform duration-200",
                expanded && "rotate-180 text-white/40"
              )} />
            </>
          )}
        </button>
        {expanded && !collapsed && item.children && (
          <div className="ml-4 mt-0.5 space-y-0.5 border-l border-white/[0.04] pl-2">
            {item.children.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                onClick={onNavigate}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                  pathname === child.href
                    ? "text-neon-cyan bg-neon-cyan/[0.04]"
                    : "text-white/30 hover:text-white/70 hover:bg-white/[0.02]",
                )}
              >
                <div className={cn(
                  "h-1.5 w-1.5 rounded-full transition-all duration-200",
                  pathname === child.href
                    ? "bg-neon-cyan shadow-[0_0_6px_rgba(0,229,255,0.5)]"
                    : "bg-white/15 group-hover:bg-white/30"
                )} />
                {child.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
        isExactActive
          ? "bg-gradient-to-r from-neon-orange/10 to-neon-cyan/10 text-white"
          : "text-white/40 hover:text-white/80 hover:bg-white/[0.03]",
      )}
    >
      {isExactActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-gradient-to-b from-neon-orange to-neon-cyan shadow-[0_0_8px_rgba(0,229,255,0.3)]" />
      )}
      <div className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200",
        isExactActive
          ? "bg-gradient-to-br from-neon-orange/20 to-neon-cyan/20"
          : "bg-white/[0.03] group-hover:bg-white/[0.06]",
      )}>
        <item.icon size={16} className={cn(
          "transition-colors duration-200",
          isExactActive ? "text-neon-cyan" : "text-white/40 group-hover:text-white/70"
        )} />
      </div>
      {!collapsed && (
        <>
          <span className="flex-1">{item.label}</span>
          {badge && (
            <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full text-[10px] font-semibold border bg-neon-cyan/15 text-neon-cyan border-neon-cyan/20">
              {badge}
            </span>
          )}
        </>
      )}
    </Link>
  );
}

export default function Sidebar() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [siteName, setSiteName] = useState("Admin");
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/site-data")
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          const name = json.data?.company?.name || json.data?.settings?.site_name || "Admin";
          setSiteName(name);
        }
      })
      .catch(() => {});
  }, []);

  const initials = session?.user?.name
    ? session.user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "AD";

  const prevPathname = useRef(pathname);
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      setOpen(false);
      prevPathname.current = pathname;
    }
  }, [pathname]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed top-3 left-3 z-50 lg:hidden p-2.5 rounded-xl glass text-white/60 hover:text-white transition-all"
      >
        <Menu size={18} />
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setOpen(false)} />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 h-full z-50 flex flex-col transition-all duration-300 ease-out border-r",
          "bg-[#050505]/80 backdrop-blur-2xl border-white/[0.04]",
          open ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0",
          collapsed ? "w-[72px]" : "w-[260px]",
        )}
      >
        <div className={cn(
          "flex items-center border-b border-white/[0.04] h-16 shrink-0",
          collapsed ? "justify-center px-0" : "justify-between px-5",
        )}>
          {!collapsed ? (
            <Link href="/admin/dashboard" className="flex items-center gap-2.5 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-neon-orange to-neon-cyan shadow-[0_0_12px_rgba(0,229,255,0.2)] group-hover:shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-shadow duration-300">
                <Sparkles size={16} className="text-black" />
              </div>
              <span className="brand-text text-lg tracking-tight">
                {siteName}
              </span>
            </Link>
          ) : (
            <Link href="/admin/dashboard" className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-neon-orange to-neon-cyan shadow-[0_0_16px_rgba(255,107,0,0.25)] group-hover:shadow-[0_0_24px_rgba(0,229,255,0.35)] transition-all duration-500">
              <Sparkles size={16} className="text-black" />
            </Link>
          )}
          <button
            onClick={() => setOpen(false)}
            className="lg:hidden text-white/30 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-thin admin-scrollbar">
          {navSections.map((section) => (
            <div key={section.label}>
              {!collapsed && (
                <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/20">
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavItemComponent key={item.href} item={item} collapsed={collapsed} onNavigate={() => setOpen(false)} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-white/[0.04] p-3">
          {!collapsed ? (
            <div className="flex items-center gap-3 rounded-xl px-2 py-2">
              <Avatar className="h-8 w-8 ring-1 ring-white/[0.08]">
                <AvatarFallback className="text-[10px] bg-gradient-to-br from-neon-orange/30 to-neon-cyan/30 text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white/70 truncate">{session?.user?.name || "Admin"}</p>
                <p className="text-[11px] text-white/25 truncate">{session?.user?.email || "admin@example.com"}</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <Avatar className="h-8 w-8 ring-1 ring-white/[0.08]">
                <AvatarFallback className="text-[10px] bg-gradient-to-br from-neon-orange/30 to-neon-cyan/30 text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
          )}

          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 w-full text-sm text-red-400/50 hover:text-red-400 hover:bg-red-500/[0.06] transition-all mt-1",
              collapsed && "justify-center",
            )}
          >
            <LogOut size={16} />
            {!collapsed && "Sign Out"}
          </button>
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute -right-3 top-20 h-6 w-6 items-center justify-center rounded-full border border-white/[0.06] bg-[#050505] text-white/30 hover:text-white/70 transition-all hover:border-white/20"
        >
          <ChevronLeft size={12} className={cn("transition-transform duration-200", collapsed && "rotate-180")} />
        </button>
      </aside>
    </>
  );
}
