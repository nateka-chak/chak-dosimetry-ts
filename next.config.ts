import type { NextConfig } from "next";
import fs from "fs";
import path from "path";

// #region agent log
(async () => {
  const endpoint =
    "http://127.0.0.1:7242/ingest/024ebd25-8bbc-47e2-8323-fa6c74762372";
  const basePayload = {
    sessionId: "debug-session",
    runId: "pre-fix",
    hypothesisId: "",
    location: "next.config.ts:agent",
    timestamp: Date.now(),
  };

  try {
    const manifestPath = path.join(
      process.cwd(),
      ".next",
      "routes-manifest.json"
    );
    const raw = fs.readFileSync(manifestPath, "utf8");
    const parsed = JSON.parse(raw);

    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...basePayload,
        hypothesisId: "H1",
        message: "Loaded routes-manifest.json",
        data: {
          keys: Object.keys(parsed),
          version: parsed.version,
          hasDataRoutes: Array.isArray((parsed as any).dataRoutes),
          dataRoutesType: typeof (parsed as any).dataRoutes,
        },
      }),
    }).catch(() => {});
  } catch (error: any) {
    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...basePayload,
        hypothesisId: "H2",
        message: "Error reading routes-manifest.json",
        data: { error: String(error?.message || error) },
      }),
    }).catch(() => {});
  }

  try {
    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...basePayload,
        hypothesisId: "H3",
        message: "Environment at next.config load",
        data: {
          NODE_ENV: process.env.NODE_ENV,
          BASE_PATH: process.env.BASE_PATH,
        },
      }),
    }).catch(() => {});
  } catch {
    // ignore
  }
})();
// #endregion

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ["mysql2", "tesseract.js"],

  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "197.232.14.151",
        port: "4488",
        pathname: "/chak-dosimetry-ts/**",
      },
    ],
  },

  basePath: process.env.BASE_PATH || "",

  env: {
    DB_HOST: process.env.DB_HOST,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_NAME: process.env.DB_NAME,
  },

  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
      allowedOrigins: ["*"],
    },
  },
};

export default nextConfig;
