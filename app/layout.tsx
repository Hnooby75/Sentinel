import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ToastProvider } from "@/components/ui/Toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Sentinel — Compliance OS pour PME",
    template: "%s | Sentinel",
  },
  description: "Plateforme de conformité AI Act pour les PME européennes. Documentez vos usages IA, calculez votre score de conformité et générez vos rapports réglementaires.",
  keywords: ["AI Act", "conformité", "IA", "PME", "RGPD", "compliance", "intelligence artificielle"],
  authors: [{ name: "Sentinel" }],
  creator: "Sentinel SAS",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Sentinel",
    title: "Sentinel — Compliance OS pour PME",
    description: "Conformité AI Act simplifiée pour les PME européennes",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
