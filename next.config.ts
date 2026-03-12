import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: process.env.NEXT_PUBLIC_BASEPATH || "",
  images: {
    unoptimized: true
  },
  output: "export",
  reactStrictMode: true,
  env: {
    GIT_SHA: process.env.GIT_SHA
  }
};

export default nextConfig;
