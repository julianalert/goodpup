import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev only: let a phone on the same Wi-Fi load the dev server (http://<this Mac's IP>:3000)
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
  async redirects() {
    return [
      // The quiz moved from /form to /start — keep old links, ads and bookmarks working.
      { source: "/form", destination: "/start", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        // Private admin area: tell crawlers to stay out even if a link leaks.
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }],
      },
    ];
  },
};

export default nextConfig;
