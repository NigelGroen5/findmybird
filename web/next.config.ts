import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  images: {
    domains: [
      "cdn.download.ams.birds.cornell.edu",
      "search.macaulaylibrary.org",
      "macaulaylibrary.org",
      "upload.wikimedia.org",
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.download.ams.birds.cornell.edu",
      },
      {
        protocol: "https",
        hostname: "search.macaulaylibrary.org",
      },
      {
        protocol: "https",
        hostname: "macaulaylibrary.org",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
    ],
  },
};

export default nextConfig;