import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Logos d'assos et visuels d'événements (max 4 Mo, cf. lib/storage.ts).
      bodySizeLimit: "5mb",
    },
  },
};

export default nextConfig;
