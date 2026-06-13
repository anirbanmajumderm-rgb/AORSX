"use client";

import { MessageCircle } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

export function ChatButton() {
  const router = useRouter();
  const pathname = usePathname();

  if (pathname === "/messages" || pathname.startsWith("/admin")) return null;

  return (
    <button
      onClick={() => router.push("/messages")}
      aria-label="Messages"
      className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#FF6B00] to-[#00E5FF] text-white shadow-[0_0_20px_rgba(255,107,0,0.3)] hover:shadow-[0_0_30px_rgba(0,229,255,0.4)] transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
    >
      <MessageCircle className="h-5 w-5 md:h-6 md:w-6" />
    </button>
  );
}
