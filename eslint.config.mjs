// Enforcement chain per CONVENTIONS.md — every rule here names the failure it prevents.
// Flat-config note: a later block REPLACES a rule's entry wholesale (no pattern merging),
// so each file zone declares its complete no-restricted-imports list in exactly one block.
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";

// §4 schema ownership: a rogue pgTable outside packages/shared/db is invisible to the rebuild diff.
const DRIZZLE_RESTRICTION = {
  group: ["drizzle-orm/pg-core"],
  message: "Drizzle table builders live only in packages/shared/db (CONVENTIONS §4).",
};

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "**/out/**",
      "contracts/**", // Solidity is forge's jurisdiction; generated ABIs get per-file exemptions when they land
      "**/next-env.d.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["apps/**/*.{ts,tsx}", "packages/**/*.{ts,tsx}"],
    rules: {
      // File-size law: both reference repos proved quality collapses past ~300 effective lines.
      "max-lines": ["error", { max: 300, skipBlankLines: true, skipComments: true }],
      // AD-6: chain ids are runtime data from packages/chain; a hardcoded id is the cross-chain-spoof footgun.
      "no-restricted-syntax": [
        "error",
        {
          selector: "Literal[value=102031]",
          message: "Chain ids live only in packages/chain (AD-6). Import from @proof-league/chain.",
        },
        {
          selector: "Literal[value=11155111]",
          message: "Chain ids live only in packages/chain (AD-6). Import from @proof-league/chain.",
        },
      ],
    },
  },
  {
    // AD-2 import zones: packages must never depend on apps (one dependency direction).
    files: ["packages/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["@proof-league/web*", "@proof-league/worker*", "**/apps/*"], message: "packages/* import nothing from apps (AD-2)." },
            DRIZZLE_RESTRICTION,
          ],
        },
      ],
    },
  },
  {
    // The one legal home for table builders.
    files: ["packages/shared/db/**/*.ts", "packages/shared/src/db/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["@proof-league/web*", "@proof-league/worker*", "**/apps/*"], message: "packages/* import nothing from apps (AD-2)." },
          ],
        },
      ],
    },
  },
  {
    // AD-2: web imports only from packages/*; never reaches into the worker.
    files: ["apps/web/**/*.{ts,tsx}"],
    plugins: { react },
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["@proof-league/worker*", "**/apps/worker/*"], message: "web imports only from packages/* (AD-2)." },
            DRIZZLE_RESTRICTION,
          ],
        },
      ],
      // Styling law §7: inline style objects cost hover/breakpoints/responsiveness (zk-freighter shipped a separate mobile app to apologize for this).
      "react/forbid-dom-props": ["error", { forbid: ["style"] }],
    },
  },
  {
    files: ["apps/worker/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["@proof-league/web*", "**/apps/web/*"], message: "worker imports only from packages/* (AD-2)." },
            DRIZZLE_RESTRICTION,
          ],
        },
      ],
    },
  }
);
