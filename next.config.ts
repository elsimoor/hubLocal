import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow loading images from any external domain and protocol
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
    dangerouslyAllowSVG: true,
  },
};

export default nextConfig;
