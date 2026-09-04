import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Workspace packages ship TypeScript sources; Next transpiles them in place (AD-2 planes).
  transpilePackages: ["@proof-league/shared", "@proof-league/chain"],
  // Next 16.3 writes its own AGENTS.md and CLAUDE.md into this app on every dev start and
  // build. This repository does not carry those files by the owner's decision, and the root
  // AGENTS.md was deleted deliberately, so a framework that recreates them silently undoes
  // that every time anyone runs the dev server. Turned off rather than deleted repeatedly,
  // because a rule nobody enforces is a rule that comes back (CONVENTIONS, law of the
  // document: a rule must name its enforcement).
  agentRules: false,
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
