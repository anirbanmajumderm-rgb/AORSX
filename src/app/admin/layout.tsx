import { AuthProvider } from "@/components/admin/AuthProvider";
import type { Viewport } from "next";
import dynamic from "next/dynamic";
import { AdminErrorBoundary } from "./error-boundary";
import { NotificationProvider } from "@/contexts/notification-context";
import { ToastProvider } from "@/components/ui/Toast";
import { Toaster } from "sonner";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import "./admin.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

const Sidebar = dynamic(() => import("@/components/admin/layout/Sidebar"), { ssr: true });

let cachedAdminMeta: { data: { title: string; robots: { index: boolean; follow: boolean } }; ts: number } | null = null;
const ADMIN_META_CACHE_TTL = 60_000;

export async function generateMetadata() {
  if (cachedAdminMeta && Date.now() - cachedAdminMeta.ts < ADMIN_META_CACHE_TTL) return cachedAdminMeta.data;
  try {
    const [setting, company] = await Promise.all([
      prisma.setting.findUnique({ where: { key: "site_name" }, select: { value: true } }),
      prisma.company.findFirst({ select: { name: true } }),
    ]);
    const siteName = setting?.value || company?.name || "Admin";
    const data = {
      title: `${siteName} | Admin`,
      robots: { index: false, follow: false },
    };
    cachedAdminMeta = { data, ts: Date.now() };
    return data;
  } catch {
    return {
      title: "Admin Dashboard",
      robots: { index: false, follow: false },
    };
  }
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  let siteName = "Admin";
  try {
    if (cachedAdminMeta && Date.now() - cachedAdminMeta.ts < ADMIN_META_CACHE_TTL) {
      const title = cachedAdminMeta.data.title;
      siteName = title.replace(" | Admin", "");
    } else {
      const [setting, company] = await Promise.all([
        prisma.setting.findUnique({ where: { key: "site_name" }, select: { value: true } }),
        prisma.company.findFirst({ select: { name: true } }),
      ]);
      siteName = setting?.value || company?.name || "Admin";
    }
  } catch {}

  if (!session?.user) {
    return <>{children}</>;
  }

  return (
    <AuthProvider>
      <AdminErrorBoundary>
        <NotificationProvider>
          <ToastProvider>
            <Toaster position="top-right" richColors closeButton />
            <div className="min-h-screen bg-[#050505] text-white admin-grid-bg">
              <Sidebar siteName={siteName} />
              <div className="relative z-0 lg:pl-[260px] transition-all duration-300">
                <main className="min-h-screen admin-scrollbar relative z-10">
                  {children}
                </main>
              </div>
            </div>
          </ToastProvider>
        </NotificationProvider>
      </AdminErrorBoundary>
    </AuthProvider>
  );
}
