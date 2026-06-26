import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["outrank-next-js-blog"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
