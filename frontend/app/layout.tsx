import type { Metadata } from "next";
import { Bebas_Neue, DM_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { SiteHeader } from "@/components/site-header";
import { ConditionalSiteFooter } from "@/components/conditional-site-footer";

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
  title: {
    default: "BIG BOYS GYM · Tienda",
    template: "%s · BIG BOYS",
  },
  description:
    "BIG BOYS GYM: fuerza real, equipo real. Tienda oficial — suplementación e indumentaria.",
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
        </Providers>
      </body>
    </html>
  );
}
