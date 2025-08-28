import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // ⬅️ disables lint errors on build
  },

  typescript: {
    ignoreBuildErrors: true, // ⬅️ disables type errors on build (optional)
  },

  serverExternalPackages: ["mysql2", "tesseract.js"],

  images: {
    domains: ["localhost"],
  },

  env: {
    DB_HOST: process.env.DB_HOST,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_NAME: process.env.DB_NAME,
  },
};

export default nextConfig;
