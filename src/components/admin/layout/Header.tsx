"use client";

import { Search, Bell, ChevronRight, Home, ExternalLink } from "lucide-react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useNotifications } from "@/contexts/notification-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";

interface HeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function Header({ title, description, children }: HeaderProps) {
  const { data: session } = useSession();
  const { unreadCount } = useNotifications();
  const pathname = usePathname();
  const [searchFocused, setSearchFocused] = useState(false);

  const initials = session?.user?.name
    ? session.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "AD";

  const segments = pathname.split("/").filter(Boolean);

  return (
    <header className="sticky top-0 z-30">
      <div className={cn(
        "flex h-16 items-center justify-between border-b px-6 transition-all duration-300",
        "border-white/[0.04] bg-[#050505]/60 backdrop-blur-2xl"
      )}>
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <nav className="hidden md:flex items-center gap-1.5 text-xs">
            <Link href="/admin/dashboard" className="text-white/30 hover:text-white/70 transition-colors">
              <Home size={14} />
            </Link>
            {segments.slice(1).map((seg, i) => (
              <span key={seg} className="flex items-center gap-1.5">
                <ChevronRight size={10} className="text-white/15" />
                <span className={cn(
                  i === segments.length - 2 ? "text-white/50" : "text-white/20",
                  "capitalize"
                )}>
                  {seg.replace(/-/g, " ")}
                </span>
              </span>
            ))}
          </nav>

          <div className="hidden md:block">
            <h1 className="font-heading text-lg font-bold tracking-tight">{title}</h1>
            {description && (
              <p className="text-xs text-white/30 mt-0.5">{description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {children}

          {/* View Live Site */}
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.06] text-[11px] text-white/40 hover:text-white/70 hover:border-white/20 transition-all"
          >
            <ExternalLink size={12} />
            View Live Site
          </a>

          {/* Search */}
          <div className={cn(
            "relative hidden lg:block transition-all duration-300",
            searchFocused ? "w-72" : "w-48"
          )}>
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
            <input
              placeholder="Search anything..."
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className={cn(
                "h-9 w-full rounded-xl bg-white/[0.02] pl-9 pr-8 text-xs border border-white/[0.04]",
                "placeholder:text-white/20 outline-none transition-all duration-300",
                "focus:border-neon-cyan/20 focus:bg-white/[0.03]"
              )}
            />
          </div>

          {/* Notifications */}
          <Link
            href="/admin/notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.04] bg-white/[0.02] text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-all"
          >
            <Bell size={15} />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-r from-neon-orange to-orange-500 text-[8px] font-bold text-white shadow-[0_0_8px_rgba(255,107,0,0.4)]">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>

          {/* Avatar */}
          <div className="flex items-center gap-2.5 pl-2.5 border-l border-white/[0.04]">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-medium leading-none text-white/60">{session?.user?.name || "Admin"}</p>
              <p className="text-[10px] text-white/25 mt-0.5">{session?.user?.email || "admin@example.com"}</p>
            </div>
            <Avatar className="h-8 w-8 cursor-pointer ring-1 ring-white/[0.06] hover:ring-neon-cyan/30 transition-all">
              <AvatarFallback className="text-[10px] bg-gradient-to-br from-neon-orange/30 to-neon-cyan/30 text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>

      {/* Mobile title */}
      <div className="md:hidden px-6 py-3 border-b border-white/[0.04] bg-[#050505]/40">
        <h1 className="font-heading text-base font-bold">{title}</h1>
        {description && <p className="text-xs text-white/30 mt-0.5">{description}</p>}
      </div>
    </header>
  );
}
