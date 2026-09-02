import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Workspace packages ship TypeScript sources; Next transpiles them in place (AD-2 planes).
  transpilePackages: ["@proof-league/shared", "@proof-league/chain"],
};

export default nextConfig;
