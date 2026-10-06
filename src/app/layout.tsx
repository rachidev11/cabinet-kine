import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Cabinet de Kinésithérapie | Hassna El-Hmaidi — Rééducation Fonctionnelle",
  description: "Plateforme de gestion du Cabinet de Kinésithérapie de Hassna El-Hmaidi : dossiers patients, agenda, facturation et bilan kiné.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full bg-slate-50 text-slate-900 antialiased">
      <body className="min-h-full flex flex-col font-sans selection:bg-teal-500 selection:text-white">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
