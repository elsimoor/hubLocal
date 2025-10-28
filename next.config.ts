import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable ESLint during production builds to avoid issues with circular
  // references in eslint plugins.  See https://nextjs.org/docs/messages/sync-dynamic-apis#possible-ways-to-fix-it for context【354619373757140†L472-L523】.
  eslint: {
    // When true, ESLint will be skipped during `next build`.  This is useful
    // for avoiding build failures due to eslint-plugin issues or misconfigured
    // environments.  You can still run `yarn lint` locally to check code.
    ignoreDuringBuilds: true,
  },
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
