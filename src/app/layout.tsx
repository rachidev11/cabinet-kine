import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import AppShell from "@/components/AppShell";

export const viewport: Viewport = {
  themeColor: "#0B57D0",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "Centre de Kinésithérapie Nassim Al Massira | Hassna El-Hmaidi",
  description: "Plateforme de gestion du Centre de Kinésithérapie Nassim Al Massira de Hassna El-Hmaidi à Fès : dossiers patients, agenda des 3 salles, facturation et bilan kiné.",
  manifest: "/manifest.json",
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kiné Nassim",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning className="h-full bg-slate-50 text-slate-900 antialiased">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <meta name="theme-color" content="#0B57D0" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Kiné Nassim" />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col font-sans selection:bg-[#0B57D0] selection:text-white">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
