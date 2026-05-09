import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/chat",
        destination: "http://localhost:8080/api/chat",
      },
      {
        source: "/api/agents/:path*",
        destination: "http://localhost:8080/api/agents/:path*",
      },
    ];
  },
};

export default nextConfig;
