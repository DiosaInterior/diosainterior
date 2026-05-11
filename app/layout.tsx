import type { Metadata } from "next";
import { Cormorant_Garamond, Raleway, DM_Mono } from "next/font/google";

import { MetaPixelScript } from "@/components/MetaPixelScript";

import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400"],
  style: ["italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const raleway = Raleway({
  subsets: ["latin"],
  weight: ["200", "300", "400"],
  variable: "--font-raleway",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["300", "400"],
  variable: "--font-dm-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Diosa Interior — Tu paleta de colorimetría",
  description:
    "La primera guía de colorimetría calibrada para la diversidad de la piel.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={`${cormorant.variable} ${raleway.variable} ${dmMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-vino-profundo text-marfil font-raleway antialiased">
        <MetaPixelScript />
        {children}
      </body>
    </html>
  );
}
