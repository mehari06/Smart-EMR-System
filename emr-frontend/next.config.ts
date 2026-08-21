import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent Next.js from emitting 308 redirects that break the Django API proxy
  // trailingSlash: false,
   skipTrailingSlashRedirect: true,
  trailingSlash: false,
  turbopack: {
    root: process.cwd(),
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*/",
        destination: `${process.env.BACKEND_URL || 'http://127.0.0.1:8000'}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;