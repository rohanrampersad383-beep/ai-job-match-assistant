import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { PropsWithChildren } from "react";
import { SpeedInsights } from "@vercel/speed-insights/next";

import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans"
});

export const metadata: Metadata = {
  title: "Job Match Assistant",
  description:
    "A legal, semi-automated job discovery and application preparation assistant."
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <body className={manrope.className}>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
