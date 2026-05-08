import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Playwright hits 127.0.0.1 while Next dev may report localhost; allow HMR.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

export default nextConfig;
