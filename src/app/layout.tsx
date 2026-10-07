import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Centre de Kinésithérapie Nassim Al Massira | Hassna El-Hmaidi",
  description: "Plateforme de gestion du Centre de Kinésithérapie Nassim Al Massira de Hassna El-Hmaidi à Fès : dossiers patients, agenda des 3 salles, facturation et bilan kiné.",
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning className="h-full bg-slate-50 text-slate-900 antialiased">
      <body suppressHydrationWarning className="min-h-full flex flex-col font-sans selection:bg-[#0B57D0] selection:text-white">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
