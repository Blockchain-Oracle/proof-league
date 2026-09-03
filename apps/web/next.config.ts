import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Workspace packages ship TypeScript sources; Next transpiles them in place (AD-2 planes).
  transpilePackages: ["@proof-league/shared", "@proof-league/chain"],
  // The repo's NodeNext-style ".js" import suffixes (load-bearing for the worker's tsc
  // emit) must resolve to .ts sources when bundling workspace packages. Turbopack does
  // not apply an extension alias inside linked packages (probed 2026-09-03), so the web
  // builds with webpack (--webpack in the scripts) and this documented alias.
  webpack: (config) => {
    config.resolve.extensionAlias = { ".js": [".ts", ".tsx", ".js"] };
    return config;
  },
};

export default nextConfig;
