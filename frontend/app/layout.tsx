import type { Metadata } from "next";
import { Black_Ops_One, Rajdhani } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { SiteHeader } from "@/components/site-header";
import { ConditionalSiteFooter } from "@/components/conditional-site-footer";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { PushPrompt } from "@/components/push-prompt";
import { ConsentBanner } from "@/components/consent-banner";
import { CustomCursor } from "@/components/custom-cursor";
import { ParticlesBg } from "@/components/particles-bg";
import { RippleDelegate } from "@/components/ripple-delegate";
import { ScrollProgress } from "@/components/scroll-progress";
import { ScrollRevealProvider } from "@/components/scroll-reveal-provider";

const blackOps = Black_Ops_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

const rajdhani = Rajdhani({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://bigboysgym.com"),
  title: {
    default: "Big Boys Gym · Tienda Oficial",
    template: "%s | Big Boys Gym",
  },
  description:
    "Tienda oficial de Big Boys Gym en Manizales, Colombia. Suplementación, ropa deportiva y equipamiento.",
  keywords: [
    "gym",
    "suplementos",
    "proteína",
    "ropa deportiva",
    "Manizales",
    "Colombia",
    "Big Boys Gym",
    "entrenamiento",
  ],
  authors: [{ name: "Big Boys Gym" }],
  creator: "Big Boys Gym",
  themeColor: "#cc0000",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      {
        url: "/brand/logo-bigboys.jpg",
        type: "image/jpeg",
      },
      {
        url: "/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcut: "/brand/logo-bigboys.jpg",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "Big Boys Gym · Tienda Oficial",
    description: "Suplementación y ropa deportiva en Manizales, Colombia.",
    url: "https://bigboysgym.com",
    siteName: "Big Boys Gym",
    images: [
      {
        url: "/brand/logo-bigboys.jpg",
        width: 400,
        height: 400,
        alt: "Big Boys Gym Logo",
      },
    ],
    locale: "es_CO",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Big Boys Gym · Tienda Oficial",
    description: "Suplementación y ropa deportiva.",
    images: ["/brand/logo-bigboys.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${blackOps.variable} ${rajdhani.variable} h-full`}>
      <body className="relative flex min-h-screen flex-col antialiased text-white">
        <CustomCursor />
        <ParticlesBg count={40} />
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: "2px",
            background: "linear-gradient(90deg, transparent, #cc0000, transparent)",
            opacity: 0.35,
            zIndex: 9998,
            pointerEvents: "none",
          }}
          aria-hidden
        />
        <Providers>
          <RippleDelegate />
          <ScrollRevealProvider />
          <ScrollProgress />
          <SiteHeader />
          <div className="main-shell">{children}</div>
          <ConditionalSiteFooter />
          <WhatsAppButton />
          <PushPrompt />
          <ConsentBanner />
        </Providers>
      </body>
    </html>
  );
}
