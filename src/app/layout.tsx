import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { CookieBanner } from "@/components/site/cookie-consent";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const sans = Geist({ subsets: ["latin"], variable: "--font-geist-sans", display: "swap" });
// Mono não é pré-carregada: só aparece em dados técnicos, nunca no LCP
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap", preload: false });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "AutoCasteloBranco — Viaturas usadas revistas e oficina em Castelo Branco",
    template: "%s · AutoCasteloBranco",
  },
  description:
    "Stand de viaturas usadas com oficina própria em Castelo Branco. Viaturas revistas com garantia, retoma, financiamento e marcação de oficina online.",
  applicationName: "AutoCasteloBranco",
  formatDetection: { telephone: false },
  openGraph: { locale: "pt_PT", siteName: "AutoCasteloBranco", type: "website" },
};

export const viewport: Viewport = {
  themeColor: "#f6f5f2",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-PT" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        {/* Esconde o banner de cookies antes de pintar se já houver consentimento (evita "flash") */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(document.cookie.indexOf("acb_consent=")>-1)document.documentElement.setAttribute("data-consent","1")}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-dvh">
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
