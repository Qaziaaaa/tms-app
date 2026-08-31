import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["mongoose"],
  // Keep Playwright's dev server separate from an interactive local dev server.
  distDir: process.env.TMS_TEST_MODE === "1" ? ".next-e2e" : ".next",
  devIndicators: false,
};

export default nextConfig;
