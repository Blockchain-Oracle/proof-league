// Machine-writes packages/chain/src/abis/league-core.ts from the forge artifact, so the
// worker's viem call surface can never drift from the compiled contract: CI regenerates it
// right after forge build and diffs it against the committed copy (the shared-vectors
// freshness pattern, review 2026-09-02). Regenerate locally:
//   cd contracts && forge build && cd .. && node scripts/abi-export.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const artifact = JSON.parse(readFileSync("contracts/out/LeagueCore.sol/LeagueCore.json", "utf8"));
const header =
  "// Machine-written by scripts/abi-export.mjs from the forge LeagueCore artifact - do not edit.\n" +
  "// Freshness-gated in CI next to forge build (regenerate: node scripts/abi-export.mjs).\n";
mkdirSync("packages/chain/src/abis", { recursive: true });
writeFileSync(
  "packages/chain/src/abis/league-core.ts",
  `${header}export const leagueCoreAbi = ${JSON.stringify(artifact.abi, null, 2)} as const;\n`,
);
console.log(`abi-export: leagueCoreAbi written (${artifact.abi.length} entries)`);
