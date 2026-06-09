import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ClientLayout } from "@/components/ClientLayout";
import { LanguageProvider } from "@/context/LanguageContext";
import { SiteDataProvider } from "@/context/SiteDataContext";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <LanguageProvider>
      <SiteDataProvider>
        <ClientLayout>
          <Navbar />
          <main className="relative z-10">{children}</main>
          <Footer />
        </ClientLayout>
      </SiteDataProvider>
    </LanguageProvider>
  );
}
