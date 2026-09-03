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
    // The per-file exemption promised above (after the max-lines block — flat config
    // replaces wholesale): /abis/ holds only machine-written artifacts
    // (scripts/abi-export.mjs, CI-freshness-gated); the raw-lines sweep exempts the same path.
    files: ["packages/*/src/abis/**/*.ts"],
    rules: { "max-lines": "off" },
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
      // Chip single-renderer law (Story 3.1, UX-DR2): the chip-state literals render only
      // through StateChip over shared deriveMarketChip. Flat config replaces rule entries
      // wholesale, so the AD-6 chain-id selectors are restated here for web files.
      "no-restricted-syntax": [
        "error",
        { selector: "Literal[value=102031]", message: "Chain ids live only in packages/chain (AD-6)." },
        { selector: "Literal[value=11155111]", message: "Chain ids live only in packages/chain (AD-6)." },
        { selector: "Literal[value='awaiting attestation']", message: "Chip states render only via StateChip (UX-DR2)." },
        { selector: "Literal[value='proof verified']", message: "Chip states render only via StateChip (UX-DR2)." },
        { selector: "Literal[value='voided']", message: "Chip states render only via StateChip (UX-DR2)." },
        { selector: "Literal[value='stuck']", message: "Chip states render only via StateChip (UX-DR2)." },
      ],
    },
  },
  {
    // Story 3.9 / UX-DR14: Reels is a DISCOVERY surface. It may render a Market and link
    // to the canonical composer, and it may not grow its own signing, submission, payout
    // or availability logic — a second integrity model reachable only from the fast feed
    // is exactly how a product ends up with two answers to "was this Pick legal". The
    // canonical view model is the sanctioned way in, so the ban is on everything below it.
    // (Flat config replaces rule entries wholesale, so the web zone's list is restated.)
    files: ["apps/web/app/(product)/reels/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["@proof-league/worker*", "**/apps/worker/*"], message: "web imports only from packages/* (AD-2)." },
            DRIZZLE_RESTRICTION,
            {
              group: ["viem", "viem/*"],
              message: "Reels never signs or submits (UX-DR14). Link to the canonical composer instead.",
            },
            {
              group: ["@proof-league/shared/pick", "@proof-league/shared/pickset", "@proof-league/shared/payout", "@proof-league/shared/intake"],
              message: "Reels reads the canonical view model only (AD-23); Pick legality and payout live behind it.",
            },
            {
              group: ["**/lib/market-data*", "**/lib/market-data.js"],
              message: "Reels consumes boardMarketViews, never its own query (AD-23).",
            },
          ],
        },
      ],
    },
  },
  {
    // The single sanctioned chip renderer keeps only the AD-6 selectors.
    files: ["apps/web/components/state-chip.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        { selector: "Literal[value=102031]", message: "Chain ids live only in packages/chain (AD-6)." },
        { selector: "Literal[value=11155111]", message: "Chain ids live only in packages/chain (AD-6)." },
      ],
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
  },
  {
    // Abu's standing rule (2026-09-03): structured pino logger, never bare console — bare
    // console lines carry no level or timestamp and vanish in hosted log shipping. Scoped
    // to src/: the spike/ scripts are frozen day-1 measurement evidence, not runtime code.
    files: ["apps/worker/src/**/*.ts"],
    rules: { "no-console": "error" },
  }
);
