import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import { PropsWithChildren } from "react";

import { brand } from "@/lib/brand";

import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans"
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono"
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display"
});

export const metadata: Metadata = {
  metadataBase: new URL(brand.url),
  title: {
    default: brand.name,
    template: `%s | ${brand.name}`
  },
  description: brand.description,
  applicationName: brand.name,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: brand.assets.favicon,
    shortcut: brand.assets.favicon,
    apple: brand.assets.appIcon
  },
  openGraph: {
    title: brand.name,
    description: brand.description,
    siteName: brand.name,
    type: "website",
    images: [
      {
        url: brand.assets.appIcon,
        width: 512,
        height: 512,
        alt: `${brand.name} app icon`
      }
    ]
  },
  twitter: {
    card: "summary",
    title: brand.name,
    description: brand.description,
    images: [brand.assets.appIcon]
  }
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${geistMono.variable} ${spaceGrotesk.variable} ${geist.className}`}>
        {children}
      </body>
    </html>
  );
}
