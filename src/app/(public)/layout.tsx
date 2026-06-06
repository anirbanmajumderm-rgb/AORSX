import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ClientLayout } from "@/components/ClientLayout";
import { LanguageProvider } from "@/context/LanguageContext";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <LanguageProvider>
      <ClientLayout>
        <Navbar />
        <main className="relative z-10">{children}</main>
        <Footer />
      </ClientLayout>
    </LanguageProvider>
  );
}
