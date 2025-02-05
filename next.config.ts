import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: process.env.NEXT_PUBLIC_BASEPATH || "",
  images: {
    unoptimized: true
  },
  output: "export",
  reactStrictMode: true
};

export default nextConfig;
