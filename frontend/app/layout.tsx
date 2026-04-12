import type { Metadata } from "next";
import { Bebas_Neue, DM_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { SiteHeader } from "@/components/site-header";
import { ConditionalSiteFooter } from "@/components/conditional-site-footer";
import { WhatsAppButton } from "@/components/whatsapp-button";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "600", "700"],
});

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://store-gym-bigboys.vercel.app"),
  title: {
    default: "Big Boys Gym · Tienda Oficial",
    template: "%s | Big Boys Gym",
  },
  description:
    "Tienda oficial de Big Boys Gym en Manizales, Colombia. Suplementación, ropa deportiva y equipamiento para tu entrenamiento.",
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
  openGraph: {
    type: "website",
    locale: "es_CO",
    url: "https://store-gym-bigboys.vercel.app",
    siteName: "Big Boys Gym · Tienda",
    title: "Big Boys Gym · Tienda Oficial",
    description:
      "Suplementación, ropa deportiva y equipamiento. Manizales, Colombia.",
    images: [
      {
        url: "/brand/logo-bigboys.jpg",
        width: 400,
        height: 400,
        alt: "Big Boys Gym Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Big Boys Gym · Tienda Oficial",
    description: "Suplementación y ropa deportiva en Manizales.",
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
    <html
      lang="es"
      className={`${dmSans.variable} ${bebasNeue.variable} h-full antialiased`}
    >
      <body className="relative min-h-full flex flex-col font-sans text-zinc-100">
        <Providers>
          <SiteHeader />
          <div className="relative z-10 flex flex-1 flex-col">{children}</div>
          <ConditionalSiteFooter />
          <WhatsAppButton />
        </Providers>
      </body>
    </html>
  );
}
