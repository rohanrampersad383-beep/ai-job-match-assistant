import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb"
    }
  },
  output: "standalone",
  poweredByHeader: false
};

export default nextConfig;

