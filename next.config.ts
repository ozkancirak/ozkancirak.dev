import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Spotify album artwork (now-playing bubble)
      { protocol: "https", hostname: "i.scdn.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  devIndicators: false,
};

export default nextConfig;
