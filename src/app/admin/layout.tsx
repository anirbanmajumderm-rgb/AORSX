import { AuthProvider } from "@/components/admin/AuthProvider";
import Sidebar from "@/components/admin/layout/Sidebar";
import { AdminErrorBoundary } from "./error-boundary";
import { NotificationProvider } from "@/contexts/notification-context";
import { ToastProvider } from "@/components/ui/Toast";
import { Toaster } from "sonner";
import "./admin.css";

let cachedAdminMetadata: { title: string; robots: { index: boolean; follow: boolean } } | null = null;

export async function generateMetadata() {
  if (cachedAdminMetadata) return cachedAdminMetadata;
  try {
    const { prisma } = await import("@/lib/prisma");
    const [setting, company] = await Promise.all([
      prisma.setting.findUnique({ where: { key: "site_name" } }),
      prisma.company.findFirst(),
    ]);
    const siteName = setting?.value || company?.name || "Admin";
    cachedAdminMetadata = {
      title: `${siteName} | Admin`,
      robots: { index: false, follow: false },
    };
    return cachedAdminMetadata;
  } catch {
    return {
      title: "Admin Dashboard",
      robots: { index: false, follow: false },
    };
  }
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminErrorBoundary>
        <NotificationProvider>
          <ToastProvider>
            <Toaster position="top-right" richColors closeButton />
            <div className="min-h-screen bg-[#050505] text-white admin-grid-bg">
              <Sidebar />
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
