import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true
  },
  output: "export",
  reactStrictMode: true
};

export default nextConfig;
