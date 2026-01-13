// lib/config.ts
// If you deploy under a basePath (e.g. /chak-dosimetry-ts), set NEXT_PUBLIC_BASE_PATH in env to that.
// If you want to talk to a separate API server, set NEXT_PUBLIC_API_BASE to the absolute base URL.
const isProd = process.env.NODE_ENV === "production";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE ||
  (isProd
    ? "http://197.232.14.151:4488/chak-dosimetry-ts"
    : "http://localhost:4488");