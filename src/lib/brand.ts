export const brand = {
  name: "MatchIQ",
  legalName: "MatchIQ",
  tagline: "AI-powered career intelligence",
  description:
    "A premium AI-powered career intelligence platform for ranking opportunities, understanding fit, and preparing career moves with human control.",
  url: process.env.APP_URL ?? "http://localhost:3000",
  assets: {
    logoMark: "/branding/logo-mark.svg",
    logoFull: "/branding/logo-full.svg",
    favicon: "/favicon.svg",
    appIcon: "/icon.svg"
  }
} as const;
